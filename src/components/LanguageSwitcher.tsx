import { useI18n } from '../I18nContext';

export function LanguageSwitcher() {
    const { savedPreference, t, setLocale } = useI18n();

    async function handleLanguageChange(e: Event) {
        const value = (e.target as HTMLSelectElement).value as 'cs' | 'en' | 'auto';
        console.log('[LanguageSwitcher] User selected:', value);
        await setLocale(value);
    }

    return (
        <div className="language-switcher" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <label htmlFor="language-select" className="text-sm text-secondary">
                {t.language}:
            </label>
            <select
                id="language-select"
                value={savedPreference}
                onChange={handleLanguageChange}
                className="language-select"
                style={{ minWidth: '120px' }}
            >
                <option value="auto">{t.languageAuto}</option>
                <option value="cs">{t.languageCzech}</option>
                <option value="en">{t.languageEnglish}</option>
            </select>
        </div>
    );
}
