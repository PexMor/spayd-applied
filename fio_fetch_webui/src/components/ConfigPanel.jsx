import { useState, useEffect } from 'preact/hooks';
import { getConfig, updateConfig } from '../services/api';

function ConfigPanel() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newToken, setNewToken] = useState('');
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await getConfig();
            setConfig(data);
        } catch (error) {
            console.error('Failed to load config:', error);
            setMessage({ type: 'danger', text: 'Failed to load configuration' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateToken = async (e) => {
        e.preventDefault();

        if (!newToken.trim()) {
            setMessage({ type: 'warning', text: 'Please enter a token' });
            return;
        }

        try {
            setSaving(true);
            setMessage(null);

            const result = await updateConfig(newToken);

            setMessage({ type: 'success', text: result.message || 'Configuration updated successfully' });
            setNewToken('');
            setShowTokenInput(false);

            // Reload config to show masked token
            setTimeout(() => {
                loadConfig();
            }, 500);
        } catch (error) {
            console.error('Failed to update config:', error);
            setMessage({
                type: 'danger',
                text: error.response?.data?.detail || 'Failed to update configuration',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
                <p className="text-secondary mt-md">Loading configuration...</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="mb-lg">Configuration</h2>

            {message && (
                <div
                    className={`badge badge-${message.type}`}
                    style={{
                        display: 'block',
                        padding: 'var(--space-md)',
                        marginBottom: 'var(--space-lg)',
                        fontSize: '0.95rem',
                    }}
                >
                    {message.text}
                </div>
            )}

            {/* Current Configuration */}
            <div className="card mb-lg">
                <div className="card-header">
                    <h3>Current Settings</h3>
                </div>

                <div className="flex flex-col gap-md">
                    <ConfigRow label="Host" value={config?.host || 'N/A'} />
                    <ConfigRow label="Port" value={config?.port || 'N/A'} />
                    <ConfigRow label="Database Path" value={config?.db_path || 'N/A'} />
                    <ConfigRow label="Static Directory" value={config?.static_dir || 'N/A'} />

                    <div>
                        <div className="text-sm text-secondary mb-xs">Fio API Token</div>
                        <div className="flex items-center gap-md">
                            <code
                                style={{
                                    background: 'var(--bg-secondary)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.875rem',
                                }}
                            >
                                {config?.fio_token || 'Not set'}
                            </code>
                            {!showTokenInput && (
                                <button
                                    onClick={() => setShowTokenInput(true)}
                                    className="btn-secondary"
                                    style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.875rem' }}
                                >
                                    Update
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Update Token */}
            {showTokenInput && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <h3>Update Fio API Token</h3>
                    </div>

                    <form onSubmit={handleUpdateToken}>
                        <div className="flex flex-col gap-md">
                            <div>
                                <label className="text-sm text-secondary mb-xs" style={{ display: 'block' }}>
                                    New API Token
                                </label>
                                <input
                                    type="text"
                                    value={newToken}
                                    onInput={(e) => setNewToken(e.target.value)}
                                    placeholder="Enter your Fio Bank API token"
                                    style={{ width: '100%' }}
                                    disabled={saving}
                                />
                                <p className="text-sm text-tertiary mt-xs">
                                    You can get your API token from your Fio Bank account settings
                                </p>
                            </div>

                            <div className="flex gap-md">
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span>💾</span>
                                            Save Token
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTokenInput(false);
                                        setNewToken('');
                                        setMessage(null);
                                    }}
                                    className="btn-secondary"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>

                            <div
                                className="badge badge-warning"
                                style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}
                            >
                                ⚠️ <strong>Important:</strong> The configuration will be saved to{' '}
                                <code>~/.config/fio_fetch/config.yaml</code>. You will need to restart the
                                server for changes to take effect.
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Help */}
            <div className="card" style={{ background: 'var(--bg-secondary)' }}>
                <h4 className="mb-md">📖 Configuration Help</h4>
                <div className="flex flex-col gap-sm text-sm">
                    <p>
                        <strong>Fio API Token:</strong> Required for fetching transactions from Fio Bank.
                        You can generate a token in your Fio Bank internet banking under Settings → API.
                    </p>
                    <p>
                        <strong>Configuration Priority:</strong> CLI arguments &gt; Environment variables &gt;
                        Config file
                    </p>
                    <p>
                        <strong>Environment Variables:</strong>
                    </p>
                    <ul style={{ marginLeft: 'var(--space-lg)', marginTop: 'var(--space-xs)' }}>
                        <li><code>FIO_FETCH_HOST</code> - Server host</li>
                        <li><code>FIO_FETCH_PORT</code> - Server port</li>
                        <li><code>FIO_FETCH_DB_PATH</code> - Database path</li>
                        <li><code>FIO_FETCH_TOKEN</code> - Fio API token</li>
                        <li><code>FIO_FETCH_STATIC_DIR</code> - Static files directory</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function ConfigRow({ label, value }) {
    return (
        <div>
            <div className="text-sm text-secondary mb-xs">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}

export default ConfigPanel;
