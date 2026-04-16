/**
 * Profile Photo Screen - Step 2 of Onboarding
 * Allows user to select or take a profile photo
 */
import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from 'react-native-paper';
import { ConfirmationDialog } from '@/components/common';
import { OnboardingLayout, ProfilePhotoUploader } from '@/components/onboarding';
import { useToast } from '@/components/toast';
import { useOnboardingProgress } from '@/hooks/use-onboarding-progress';
import { useOnlineAccess } from '@/hooks/use-online-access';
import { announceForScreenReader } from '@/lib/utils/accessibility';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function ProfilePhotoScreen() {
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const theme = useTheme();

  const profilePhotoUri = useOnboardingStore((state) => state.profilePhotoUri);
  const setProfilePhoto = useOnboardingStore((state) => state.setProfilePhoto);
  const markStepSkipped = useOnboardingStore((state) => state.markStepSkipped);
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);
  const { currentStep, totalSteps } = useOnboardingProgress(2);
  const onboardingAccess = useOnlineAccess('onboarding');

  const [permissionDialogVisible, setPermissionDialogVisible] = useState(false);
  const [permissionDialogMessage, setPermissionDialogMessage] = useState('');

  useEffect(() => {
    setCurrentStep(currentStep);
  }, [currentStep, setCurrentStep]);

  const goToNextStep = useCallback(() => {
    router.push('/notifications' as any);
  }, [router]);

  const handleSkip = useCallback(() => {
    setProfilePhoto(null);
    markStepSkipped(currentStep);
    goToNextStep();
  }, [currentStep, goToNextStep, markStepSkipped, setProfilePhoto]);

  const handlePermissionDenied = useCallback(
    (source: 'camera' | 'library') => {
      const sourceLabel =
        source === 'camera'
          ? t('onboarding.profile_photo.camera_option').toLowerCase()
          : t('onboarding.profile_photo.photo_library_option').toLowerCase();
      setPermissionDialogMessage(
        t('onboarding.profile_photo.permission_source_message', { source: sourceLabel }),
      );
      setPermissionDialogVisible(true);
    },
    [t],
  );

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('onboarding.profile_photo.title')}
      subtitle={t('onboarding.profile_photo.subtitle')}
      onlineNoticeTitle={onboardingAccess.isOffline ? onboardingAccess.title : null}
      onlineNoticeMessage={onboardingAccess.isOffline ? onboardingAccess.message : null}
      onBack={() => router.back()}
      onNext={goToNextStep}
      onSkip={handleSkip}
      nextButtonLabel={t('onboarding.layout.continue_button')}
      nextButtonDisabled={onboardingAccess.isOffline}
    >
      <View style={styles.content}>
        <ProfilePhotoUploader
          mode="menu"
          currentPhoto={profilePhotoUri}
          onPhotoSelected={setProfilePhoto}
          onPhotoRemoved={() => setProfilePhoto(null)}
          onError={(message) => {
            toast.error(message);
            void announceForScreenReader(message);
          }}
          onPermissionDenied={handlePermissionDenied}
        />
        {!profilePhotoUri ? (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('onboarding.profile_photo.continue_disabled_hint')}
          </Text>
        ) : null}
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('onboarding.profile_photo.skip_hint')}
        </Text>
      </View>

      <ConfirmationDialog
        visible={permissionDialogVisible}
        title={t('onboarding.profile_photo.permission_denied')}
        message={permissionDialogMessage}
        confirmText={t('onboarding.profile_photo.open_settings')}
        cancelText={t('onboarding.profile_photo.continue_without')}
        onConfirm={() => {
          setPermissionDialogVisible(false);
          void Linking.openSettings();
        }}
        onCancel={() => {
          setPermissionDialogVisible(false);
          handleSkip();
        }}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
});