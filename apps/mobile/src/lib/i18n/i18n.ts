import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English base translations (split by module)
import commonEn from '../../constants/locales/common.json';
import authEn from '../../constants/locales/auth.json';
import onboardingEn from '../../constants/locales/onboarding.json';

// British English overrides (spelling differences)
import onboardingEnGB from '../../constants/locales/onboarding.en-GB.json';

// Chinese translations (split by module)
import commonZh from '../../constants/locales/common.zh.json';
import authZh from '../../constants/locales/auth.zh.json';
import onboardingZh from '../../constants/locales/onboarding.zh.json';

import { getSavedLanguage } from '../services/language-storage';

// Merge module files into complete translation objects
const enTranslation = {
  ...commonEn,
  ...authEn,
  ...onboardingEn,
};

// British English: base + overrides (spelling differences like "recognise")
const enGBTranslation = {
  ...enTranslation,
  ...onboardingEnGB,
};

const zhTranslation = {
  ...commonZh,
  ...authZh,
  ...onboardingZh,
};

// Resources for i18next
const resources = {
  en: { translation: enTranslation },
  'en-GB': { translation: enGBTranslation },
  zh: { translation: zhTranslation },
};

/**
 * Get device language preference
 * Detects from system locale settings
 */
export const getDeviceLanguage = (): 'en' | 'en-GB' | 'zh' => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const locale = locales[0];
    if (locale.languageCode === 'zh') return 'zh';
    if (locale.languageCode === 'en' && locale.regionCode === 'US') return 'en';
    return 'en-GB';
  }
  return 'en-GB';
};

// Initialize i18next
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

// Load saved language preference from storage
void getSavedLanguage().then((saved) => {
  const lng = saved === 'system' ? getDeviceLanguage() : saved;
  if (i18n.language !== lng) {
    // eslint-disable-next-line import/no-named-as-default-member
    void i18n.changeLanguage(lng);
  }
});

export default i18n;