import AsyncStorage from 'expo-sqlite/kv-store';

const LANGUAGE_KEY = '@pulse_build:app_language';

export type AppLanguage = 'system' | 'en' | 'en-GB' | 'zh';

/**
 * Get saved language preference from storage
 * Returns 'system' if no preference is saved
 */
export async function getSavedLanguage(): Promise<AppLanguage> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (value === 'en' || value === 'en-GB' || value === 'zh') {
    return value;
  }
  // Migrate legacy en-AU preference to en-GB
  if (value === 'en-AU') {
    await AsyncStorage.setItem(LANGUAGE_KEY, 'en-GB');
    return 'en-GB';
  }
  return 'system';
}

/**
 * Save language preference to storage
 * @param language - The language to save ('system', 'en', 'en-GB', 'zh')
 */
export async function setSavedLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}