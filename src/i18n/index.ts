import { cs } from './cs';
import { en } from './en';

export const translations = {
  cs,
  en,
};

export type Locale = 'cs' | 'en';
export type { TranslationKeys } from './cs';

/**
 * Detect browser language from Accept-Language header
 */
export function detectBrowserLanguage(): Locale {
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Check if browser language starts with 'cs' (Czech)
  if (browserLang.toLowerCase().startsWith('cs')) {
    return 'cs';
  }
  
  // Default to English
  return 'en';
}

/**
 * Get translation for a specific locale
 */
export function getTranslation(locale: Locale) {
  return translations[locale];
}
