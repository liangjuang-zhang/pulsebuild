/**
 * Onboarding-related type definitions
 */

import type { PersonalInfoData } from './user';

export type OnboardingFlowVariant = 'legacy' | 'authenticated';

/**
 * Onboarding state shape used by onboarding store/screens.
 */
export interface OnboardingState {
  flowVariant: OnboardingFlowVariant;
  currentStep: number;
  personalInfo: PersonalInfoData;
  profilePhotoUri: string | null;
  notificationsEnabled: boolean;
  skippedSteps: number[];
  isCompleting: boolean;
  isLoading: boolean;
  error: string | null;
}