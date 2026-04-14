import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enGB from '../../constants/locales/en-GB.json';
import en from '../../constants/locales/en.json';
import zh from '../../constants/locales/zh.json';
import { getSavedLanguage } from '../services/language-storage';

const resources = {
  en: { translation: en },
  'en-GB': { translation: enGB },
  zh: { translation: zh },
};

// 获取设备语言
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

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4', // 确保在 React Native 中兼容性
});

// 从持久化存储中加载用户语言偏好
void getSavedLanguage().then((saved) => {
  const lng = saved === 'system' ? getDeviceLanguage() : saved;
  if (i18n.language !== lng) {
    // eslint-disable-next-line import/no-named-as-default-member
    void i18n.changeLanguage(lng);
  }
});

export default i18n;