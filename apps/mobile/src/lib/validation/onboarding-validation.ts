/**
 * Onboarding Validation
 * Validates personal info inputs during onboarding
 */

export interface PersonalInfoValidationErrors {
  name?: string;
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Name is required';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return null;
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Please enter a valid email address';
  }

  return null;
}

export function validatePersonalInfo(
  data: { name: string; email: string },
): PersonalInfoValidationErrors {
  const errors: PersonalInfoValidationErrors = {};

  const nameError = validateName(data.name);
  if (nameError) {
    errors.name = nameError;
  }

  const emailError = validateEmail(data.email);
  if (emailError) {
    errors.email = emailError;
  }

  return errors;
}

export function hasPersonalInfoValidationErrors(errors: PersonalInfoValidationErrors): boolean {
  return Boolean(errors.name || errors.email);
}