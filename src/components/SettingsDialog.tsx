import { useState, useEffect } from 'preact/hooks';
import { useI18n } from '../I18nContext';
import { getSetting, setSetting } from '../db';
import { Modal } from './Dialog';

interface SettingsDialogProps {
    onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
    const { t } = useI18n();
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const url = await getSetting<string>('webhookUrl');
            setWebhookUrl(url || '');
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave(e: Event) {
        e.preventDefault();
        setStatus('saving');

        try {
            await setSetting('webhookUrl', webhookUrl);
            setStatus('saved');
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            setStatus('error');
        }
    }

    return (
        <Modal title={t.globalSettings} onClose={onClose}>
            {isLoading ? (
                <div className="p-md text-center">{t.loading}</div>
            ) : (
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">{t.webhookUrl}</label>
                        <input
                            type="url"
                            value={webhookUrl}
                            onInput={(e) => setWebhookUrl((e.target as HTMLInputElement).value)}
                            placeholder={t.webhookUrlPlaceholder}
                            className="form-input"
                        />
                        <div className="form-help">
                            {t.webhookUrlHelp}
                        </div>
                    </div>

                    {status === 'saved' && (
                        <div className="alert alert-success mb-md">
                            {t.saved}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="alert alert-danger mb-md">
                            {t.failedToSave}
                        </div>
                    )}

                    <div className="flex gap-sm justify-end mt-lg">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={status === 'saving'}
                        >
                            {status === 'saving' ? t.processing : t.save}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
