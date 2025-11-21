import { createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import type { Locale, TranslationKeys } from './i18n';
import { detectBrowserLanguage, getTranslation } from './i18n';
import { getSetting, setSetting } from './db';

interface I18nContextType {
    locale: Locale;
    savedPreference: 'cs' | 'en' | 'auto';
    t: TranslationKeys;
    setLocale: (locale: Locale | 'auto') => Promise<void>;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: any }) {
    const [locale, setLocaleState] = useState<Locale>('en');
    const [savedPreference, setSavedPreference] = useState<'cs' | 'en' | 'auto'>('auto');
    const [t, setTranslation] = useState<TranslationKeys>(getTranslation('en'));

    useEffect(() => {
        loadLanguagePreference();
    }, []);

    async function loadLanguagePreference() {
        console.log('[I18n] Loading language preference from IndexedDB');
        const savedLanguage = await getSetting<'cs' | 'en' | 'auto'>('language');
        console.log('[I18n] Saved language preference:', savedLanguage);

        let effectiveLocale: Locale;
        if (savedLanguage === 'auto' || !savedLanguage) {
            effectiveLocale = detectBrowserLanguage();
            console.log('[I18n] Using auto-detected language:', effectiveLocale);
        } else {
            effectiveLocale = savedLanguage;
            console.log('[I18n] Using saved language:', effectiveLocale);
        }

        setSavedPreference(savedLanguage || 'auto');
        setLocaleState(effectiveLocale);
        setTranslation(getTranslation(effectiveLocale));
        console.log('[I18n] Applied locale:', effectiveLocale);
    }

    async function setLocale(newLocale: Locale | 'auto') {
        console.log('[I18n] Setting new locale preference:', newLocale);
        // Save preference to IndexedDB
        await setSetting('language', newLocale);
        console.log('[I18n] Saved to IndexedDB');

        // Determine effective locale
        const effectiveLocale = newLocale === 'auto' ? detectBrowserLanguage() : newLocale;
        console.log('[I18n] Effective locale:', effectiveLocale);

        setSavedPreference(newLocale);
        setLocaleState(effectiveLocale);
        setTranslation(getTranslation(effectiveLocale));
        console.log('[I18n] Applied translations for:', effectiveLocale);
    }

    return (
        <I18nContext.Provider value={{ locale, savedPreference, t, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}
