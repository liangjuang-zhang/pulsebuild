/**
 * Onboarding Store - Zustand state management
 *
 * 离线优先策略：先写入本地 WatermelonDB，再通过 sync 推送到服务器。
 * 即使离线也能完成 onboarding，后续自动同步。
 */
import { create } from 'zustand';
import type { OnboardingFlowVariant, OnboardingState } from '@/lib/types/onboarding';
import type { PersonalInfoData } from '@/lib/types/user';
import { authClient } from '@/lib/auth-client';
import { database } from '@/lib/database';
import { User } from '@/lib/database/models';
import { syncDatabase } from '@/lib/database/sync-manager';
import { uploadProfilePhoto } from '@/lib/utils/upload-profile-photo';

/* ───────── Constants ───────── */

const DEFAULT_PERSONAL_INFO: PersonalInfoData = {
  name: '',
  phoneNumber: '',
  jobTitle: '',
  email: '',
  companyName: '',
};

const initialState: OnboardingState = {
  flowVariant: 'authenticated',
  currentStep: 1,
  personalInfo: DEFAULT_PERSONAL_INFO,
  profilePhotoUri: null,
  notificationsEnabled: false,
  skippedSteps: [],
  isCompleting: false,
  isLoading: false,
  error: null,
};

/* ───────── Helpers ───────── */

function getDefaultName(): string {
  const suffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `User${suffix}`;
}

/* ───────── Types ───────── */

interface OnboardingStore extends OnboardingState {
  setFlowVariant: (variant: OnboardingFlowVariant) => void;
  setCurrentStep: (step: number) => void;
  setPersonalInfo: (data: Partial<PersonalInfoData>) => void;
  setProfilePhoto: (uri: string | null) => void;
  setNotifications: (enabled: boolean) => void;
  markStepSkipped: (step: number) => void;
  resetOnboarding: () => void;
  clearError: () => void;
  completeOnboarding: () => Promise<void>;
}

/* ───────── Store ───────── */

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...initialState,

  setFlowVariant: (flowVariant) => set({ flowVariant }),

  setCurrentStep: (step) => set({ currentStep: Math.max(1, step) }),

  setPersonalInfo: (data) =>
    set((state) => ({
      personalInfo: { ...state.personalInfo, ...data },
      error: null,
    })),

  setProfilePhoto: (uri) => set({ profilePhotoUri: uri, error: null }),

  setNotifications: (enabled) => set({ notificationsEnabled: enabled, error: null }),

  markStepSkipped: (step) =>
    set((state) => ({
      skippedSteps: state.skippedSteps.includes(step)
        ? state.skippedSteps
        : [...state.skippedSteps, step],
    })),

  clearError: () => set({ error: null }),

  resetOnboarding: () => set({ ...initialState }),

  completeOnboarding: async () => {
    const state = get();
    set({ isCompleting: true, error: null });

    try {
      const session = await authClient.getSession();
      if (!session.data?.user?.id) {
        throw new Error('Please sign in to complete onboarding.');
      }

      const userId = session.data.user.id;
      const normalizedName = state.personalInfo.name.trim() || getDefaultName();

      // Upload profile photo if present (with offline fallback)
      let imageUrl: string | undefined;
      if (state.profilePhotoUri) {
        try {
          const uploaded = await uploadProfilePhoto(state.profilePhotoUri);
          imageUrl = uploaded.startsWith('file://') ? undefined : uploaded;
        } catch {
          // Photo upload failed, continue without photo
        }
      }

      // Write to local WatermelonDB (offline-first)
      const userEmail = state.personalInfo.email?.trim().toLowerCase() || null;
      await database.write(async () => {
        try {
          const existingUser = await database.get<User>('user').find(userId);
          await existingUser.update((u) => {
            u.name = normalizedName;
            u.email = userEmail || session.data!.user.email;
            if (imageUrl) u.image = imageUrl;
            if (state.personalInfo.jobTitle?.trim()) u.jobTitle = state.personalInfo.jobTitle.trim();
            if (state.personalInfo.companyName?.trim()) u.companyName = state.personalInfo.companyName.trim();
            u.onboardingCompletedAt = new Date();
          });
        } catch {
          // User not found, create new record
          await database.get<User>('user').create((u) => {
            u._raw.id = userId;
            u.name = normalizedName;
            u.email = userEmail || session.data!.user.email;
            u.emailVerified = session.data!.user.emailVerified;
            u.image = imageUrl ?? null;
            u.phoneNumber = state.personalInfo.phoneNumber || null;
            u.jobTitle = state.personalInfo.jobTitle?.trim() || null;
            u.companyName = state.personalInfo.companyName?.trim() || null;
            u.status = 'active';
            u.onboardingCompletedAt = new Date();
          });
        }
      });
    // Sync to server (non-blocking, sync will push updated email to backend)
      try {
        await syncDatabase();
      } catch {
        // Sync will retry automatically on next app launch
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
      set({ error: message });
      throw error;
    } finally {
      set({ isCompleting: false });
    }
  },
}));