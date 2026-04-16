/**
 * Personal Info Screen - Step 1 of Onboarding
 * Collects user's name, job title, email, and company name
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from 'react-native-paper';
import { AppTextInput } from '@/components/common';
import { OnboardingLayout } from '@/components/onboarding';
import { useOnboardingProgress } from '@/hooks/use-onboarding-progress';
import { useOnlineAccess } from '@/hooks/use-online-access';
import { announceForScreenReader } from '@/lib/utils/accessibility';
import {
  hasPersonalInfoValidationErrors,
  validatePersonalInfo,
} from '@/lib/validation/onboarding-validation';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useAuthSession } from '@/stores/auth-session-store';
import { trpc } from '@/lib/trpc';

function toTrimmedOptional(value: string): string {
  return value.trim();
}

export default function PersonalInfoScreen() {
  const router = useRouter();
  const theme = useTheme();
  const inputBackgroundColor = theme.dark ? theme.colors.elevation.level1 : '#FFFFFF';
  const inputBorderColor = theme.dark ? '#333333' : '#F0F0F0';
  const { t } = useTranslation();

  const personalInfo = useOnboardingStore((state) => state.personalInfo);
  const setPersonalInfo = useOnboardingStore((state) => state.setPersonalInfo);
  const setCurrentStep = useOnboardingStore((state) => state.setCurrentStep);
  const { currentStep, totalSteps } = useOnboardingProgress(1);
  const onboardingAccess = useOnlineAccess('onboarding');


  const [name, setName] = useState(personalInfo.name);
  const [jobTitle, setJobTitle] = useState(personalInfo.jobTitle);
  const [email, setEmail] = useState(personalInfo.email);
  const [companyName, setCompanyName] = useState(personalInfo.companyName);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const nameInputRef = useRef<any>(null);
  const jobTitleInputRef = useRef<any>(null);
  const emailInputRef = useRef<any>(null);
  const companyInputRef = useRef<any>(null);

  // Get phone from auth store
  const { session } = useAuthSession();
  const trpcUtils = trpc.useUtils();
  const verifiedPhone = session?.user?.phoneNumber;

  useEffect(() => {
    setCurrentStep(currentStep);
  }, [currentStep, setCurrentStep]);

  useEffect(() => {
    if (verifiedPhone && !personalInfo.phoneNumber) {
      setPersonalInfo({ phoneNumber: verifiedPhone });
    }
  }, [verifiedPhone, personalInfo.phoneNumber, setPersonalInfo]);

  useEffect(() => {
    if (errors.name) {
      void announceForScreenReader(errors.name);
      return;
    }
    if (errors.email) {
      void announceForScreenReader(errors.email);
      return;
    }
    if (formError) {
      void announceForScreenReader(formError);
    }
  }, [errors.email, errors.name, formError]);

  const persistLocalValues = useCallback(() => {
    setPersonalInfo({
      name: name.trim(),
      jobTitle: toTrimmedOptional(jobTitle),
      email: email.trim().toLowerCase(),
      companyName: toTrimmedOptional(companyName),
      phoneNumber: verifiedPhone || personalInfo.phoneNumber,
    });
  }, [companyName, email, jobTitle, name, verifiedPhone, personalInfo.phoneNumber, setPersonalInfo]);

  const goToNextStep = useCallback(() => {
    router.push('/profile-photo' as any);
  }, [router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/phone-entry');
  }, [router]);

  const handleNext = useCallback(async () => {
    if (isValidating) {
      return;
    }

    const validationErrors = validatePersonalInfo({ name, email });
    if (hasPersonalInfoValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);

    if (!onboardingAccess.requireOnline((message) => setFormError(message))) {
      return;
    }

    // 校验联系方式唯一性
    const userId = session?.user?.id;
    const trimmedEmail = email.trim().toLowerCase();
    const phoneNumber = verifiedPhone || personalInfo.phoneNumber;

    if (userId && (trimmedEmail || phoneNumber)) {
      setIsValidating(true);
      try {
        const result = await trpcUtils.user.validateContact.fetch({
          userId,
          email: trimmedEmail || undefined,
          phoneNumber: phoneNumber || undefined,
        });
        if (result && !result.available) {
          const conflicts = result.conflicts ?? [];
          const conflictMessages = conflicts.map((field: string) =>
            field === 'email'
              ? t('onboarding.personal_info.email_already_taken')
              : t('onboarding.personal_info.phone_already_taken'),
          );
          setFormError(conflictMessages.join('\n'));
          setIsValidating(false);
          return;
        }
      } catch (err) {
        // 联系方式校验失败不阻塞流程，仅 warn
        console.warn('[PersonalInfo] Contact validation failed:', err);
      } finally {
        setIsValidating(false);
      }
    }

    persistLocalValues();
    goToNextStep();
  }, [email, goToNextStep, isValidating, name, onboardingAccess, persistLocalValues, session?.user?.id, t, verifiedPhone, personalInfo.phoneNumber]);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      title={t('onboarding.personal_info.title')}
      subtitle={t('onboarding.personal_info.subtitle')}
      onNext={handleNext}
      onBack={handleBack}
      onlineNoticeTitle={onboardingAccess.isOffline ? onboardingAccess.title : null}
      onlineNoticeMessage={onboardingAccess.isOffline ? onboardingAccess.message : null}
      nextButtonLabel={t('onboarding.layout.continue_button')}
      nextButtonDisabled={!name.trim() || isValidating || onboardingAccess.isOffline}
      nextButtonLoading={isValidating}
      showSkip={false}
    >
      <Pressable onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.form}>
          {formError ? (
            <Text
              style={[styles.errorText, { color: theme.colors.error }]}
              accessibilityLiveRegion="polite"
            >
              {formError}
            </Text>
          ) : null}

          <View>
            <Text variant="labelLarge" style={styles.label}>
              {t('onboarding.personal_info.full_name_label')}
            </Text>
            <AppTextInput
              mode="outlined"
              value={name}
              onChangeText={setName}
              ref={nameInputRef}
              placeholder={t('onboarding.personal_info.full_name_placeholder')}
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => jobTitleInputRef.current?.focus()}
              accessibilityLabel={t('onboarding.personal_info.full_name_accessibility_label')}
              style={{ backgroundColor: inputBackgroundColor }}
              outlineColor={errors.name ? theme.colors.error : inputBorderColor}
              activeOutlineColor={errors.name ? theme.colors.error : theme.colors.primary}
            />
            {errors.name ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]} accessibilityLiveRegion="polite">
                {errors.name}
              </Text>
            ) : null}
          </View>

          <View>
            <Text variant="labelLarge" style={styles.label}>
              {t('onboarding.personal_info.job_title_label')}
            </Text>
            <AppTextInput
              mode="outlined"
              value={jobTitle}
              onChangeText={setJobTitle}
              ref={jobTitleInputRef}
              placeholder={t('onboarding.personal_info.job_title_placeholder')}
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailInputRef.current?.focus()}
              accessibilityLabel={t('onboarding.personal_info.job_title_accessibility_label')}
              style={{ backgroundColor: inputBackgroundColor }}
              outlineColor={inputBorderColor}
              activeOutlineColor={theme.colors.primary}
            />
          </View>

          <View>
            <Text variant="labelLarge" style={styles.label}>
              {t('onboarding.personal_info.email_label')}
            </Text>
            <AppTextInput
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              ref={emailInputRef}
              placeholder={t('onboarding.personal_info.email_placeholder')}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => companyInputRef.current?.focus()}
              accessibilityLabel={t('onboarding.personal_info.email_accessibility_label')}
              style={{ backgroundColor: inputBackgroundColor }}
              outlineColor={errors.email ? theme.colors.error : inputBorderColor}
              activeOutlineColor={errors.email ? theme.colors.error : theme.colors.primary}
            />
            {errors.email ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]} accessibilityLiveRegion="polite">
                {errors.email}
              </Text>
            ) : null}
          </View>

          <View>
            <Text variant="labelLarge" style={styles.label}>
              {t('onboarding.personal_info.company_name_label')}
            </Text>
            <AppTextInput
              mode="outlined"
              value={companyName}
              onChangeText={setCompanyName}
              ref={companyInputRef}
              placeholder={t('onboarding.personal_info.company_name_placeholder')}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => void handleNext()}
              accessibilityLabel={t('onboarding.personal_info.company_name_accessibility_label')}
              style={{ backgroundColor: inputBackgroundColor }}
              outlineColor={inputBorderColor}
              activeOutlineColor={theme.colors.primary}
            />
          </View>
        </View>
      </Pressable>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  label: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: 6,
  },
});