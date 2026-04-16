/**
 * User-related type definitions
 */

/**
 * Personal information captured during onboarding.
 */
export interface PersonalInfoData {
  name: string;
  phoneNumber: string;
  jobTitle: string;
  email: string;
  companyName: string;
}

/**
 * Configuration for a single onboarding step.
 */
export interface OnboardingStepConfig {
  id: number;
  name: string;
  title: string;
  subtitle?: string;
  skippable: boolean;
  required: boolean;
}