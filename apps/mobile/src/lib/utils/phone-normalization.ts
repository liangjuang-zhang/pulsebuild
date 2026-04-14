export function normalizeInternationalPhoneNumber(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }

  const digits = trimmed.startsWith('+')
    ? trimmed.slice(1).replace(/\D/g, '')
    : trimmed.replace(/\D/g, '');

  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    return null;
  }

  return `+${digits}`;
}

const KNOWN_CALLING_CODES = ['+91', '+86', '+65', '+64', '+61', '+44', '+1'];

function extractDigits(value?: string | null): string {
  return typeof value === 'string' ? value.trim().replace(/\D/g, '') : '';
}

function stripNationalTrunkPrefix(phoneDigits: string): string {
  if (!phoneDigits.startsWith('0')) {
    return phoneDigits;
  }
  return phoneDigits.replace(/^0+/, '');
}

export interface PhoneParts {
  countryCode: string | null;
  phone: string | null;
  e164: string | null;
}

export function normalizeCountryCode(countryCode?: string | null): string | null {
  if (typeof countryCode !== 'string') {
    return null;
  }

  const trimmed = countryCode.trim();
  if (!trimmed) {
    return null;
  }

  const digits = trimmed.startsWith('+')
    ? trimmed.slice(1).replace(/\D/g, '')
    : trimmed.replace(/\D/g, '');

  if (!/^[1-9]\d{0,3}$/.test(digits)) {
    return null;
  }

  return `+${digits}`;
}

export function splitPhoneNumberFromE164(phone?: string | null): PhoneParts {
  const normalized = typeof phone === 'string' ? normalizeInternationalPhoneNumber(phone) : null;
  if (!normalized) {
    return { countryCode: null, phone: null, e164: null };
  }

  const digits = normalized.slice(1);
  const matchingCode = KNOWN_CALLING_CODES.find((callingCode) =>
    digits.startsWith(callingCode.slice(1)),
  );

  if (matchingCode) {
    return {
      countryCode: matchingCode,
      phone: digits.slice(matchingCode.length - 1),
      e164: normalized,
    };
  }

  const fallbackCountryCode = `+${digits.slice(0, Math.min(3, Math.max(1, digits.length - 8)))}`;
  return {
    countryCode: fallbackCountryCode,
    phone: digits.slice(fallbackCountryCode.length - 1),
    e164: normalized,
  };
}