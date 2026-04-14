import { normalizeInternationalPhoneNumber, splitPhoneNumberFromE164 } from './phone-normalization';

export interface PhoneCountryOption {
  code: string;
  callingCode: string;
  exampleLocal: string;
  exampleInternational: string;
}

export function getCountryFlag(code: string): string {
  return Array.from(code.toUpperCase())
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('');
}

export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { code: 'CN', callingCode: '+86', exampleLocal: '13800138000', exampleInternational: '+8613800138000' },
  { code: 'AU', callingCode: '+61', exampleLocal: '0435111222', exampleInternational: '+61435111222' },
  { code: 'US', callingCode: '+1', exampleLocal: '4155550123', exampleInternational: '+14155550123' },
  { code: 'CA', callingCode: '+1', exampleLocal: '4165550123', exampleInternational: '+14165550123' },
  { code: 'GB', callingCode: '+44', exampleLocal: '07400123456', exampleInternational: '+447400123456' },
  { code: 'NZ', callingCode: '+64', exampleLocal: '0211234567', exampleInternational: '+64211234567' },
  { code: 'SG', callingCode: '+65', exampleLocal: '81234567', exampleInternational: '+6581234567' },
  { code: 'IN', callingCode: '+91', exampleLocal: '9123456789', exampleInternational: '+919123456789' },
];

function formatLocalPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function formatPhoneInput(value: string): string {
  const trimmed = value.replace(/^\s+/, '');
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '+';
  }
  return formatLocalPhoneNumber(trimmed);
}

export function normalizePhoneNumberForSubmission(
  value: string,
  selectedCountry: PhoneCountryOption,
): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('+')) {
    return normalizeInternationalPhoneNumber(trimmed) ?? '';
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) return '';

  const withoutLeadingZeros = digitsOnly.replace(/^0+/, '');
  if (!withoutLeadingZeros) return '';

  return normalizeInternationalPhoneNumber(`${selectedCountry.callingCode}${withoutLeadingZeros}`) ?? '';
}

export function findPhoneCountryOptionOrNull(phone?: string | null): PhoneCountryOption | null {
  const parts = splitPhoneNumberFromE164(phone);
  return PHONE_COUNTRY_OPTIONS.find((option) => option.callingCode === parts.countryCode) ?? null;
}

export function findPhoneCountryOption(phone?: string | null): PhoneCountryOption {
  return findPhoneCountryOptionOrNull(phone) ?? PHONE_COUNTRY_OPTIONS[0];
}