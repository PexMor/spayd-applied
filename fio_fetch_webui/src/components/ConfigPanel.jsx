import { useState, useEffect } from 'preact/hooks';
import { getConfig, updateConfig, deleteAllTransactions, deleteMatchingData } from '../services/api';
import useAppStore from '../store/useAppStore';

function ConfigPanel() {
    const { clearMatchingData } = useAppStore();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newToken, setNewToken] = useState('');
    const [newApiUrl, setNewApiUrl] = useState('');
    const [apiUrlMode, setApiUrlMode] = useState('predefined'); // 'predefined' or 'custom'
    const [selectedPredefinedUrl, setSelectedPredefinedUrl] = useState('');
    const [newBackDateDays, setNewBackDateDays] = useState('');
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [showApiUrlInput, setShowApiUrlInput] = useState(false);
    const [showBackDateDaysInput, setShowBackDateDaysInput] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteMatchingConfirm, setShowDeleteMatchingConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingMatching, setDeletingMatching] = useState(false);
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

            const result = await updateConfig({ fio_token: newToken });

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

    const predefinedApiUrls = [
        { value: 'https://fioapi.fio.cz/v1/rest', label: 'Fio Bank Production API (https://fioapi.fio.cz/v1/rest)' },
        { value: 'http://host.docker.internal:8000/v1/rest', label: 'Docker Internal Mock (http://host.docker.internal:8000/v1/rest)' },
        { value: 'http://localhost:8000/v1/rest', label: 'Localhost Mock (http://localhost:8000/v1/rest)' },
        { value: 'http://172.17.0.1:8000/v1/rest', label: 'Localhost Mock (http://172.17.0.1:8000/v1/rest)' },
    ];

    const handleUpdateApiUrl = async (e) => {
        e.preventDefault();

        let urlToSave = '';
        if (apiUrlMode === 'predefined') {
            if (!selectedPredefinedUrl) {
                setMessage({ type: 'warning', text: 'Please select a predefined API URL' });
                return;
            }
            urlToSave = selectedPredefinedUrl;
        } else {
            if (!newApiUrl.trim()) {
                setMessage({ type: 'warning', text: 'Please enter an API URL' });
                return;
            }
            urlToSave = newApiUrl.trim();
        }

        try {
            setSaving(true);
            setMessage(null);

            const result = await updateConfig({ fio_api_url: urlToSave });

            setMessage({ type: 'success', text: result.message || 'Configuration updated successfully' });
            setNewApiUrl('');
            setSelectedPredefinedUrl('');
            setApiUrlMode('predefined');
            setShowApiUrlInput(false);

            // Reload config to show updated URL
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

    const handleUpdateBackDateDays = async (e) => {
        e.preventDefault();

        const days = parseInt(newBackDateDays);
        if (!days || days < 1 || days > 365) {
            setMessage({ type: 'warning', text: 'Please enter a valid number of days (1-365)' });
            return;
        }

        try {
            setSaving(true);
            setMessage(null);

            const result = await updateConfig({ back_date_days: days });

            setMessage({ type: 'success', text: result.message || 'Configuration updated successfully' });
            setNewBackDateDays('');
            setShowBackDateDaysInput(false);

            // Reload config to show updated value
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

    const handleDeleteAllTransactions = async () => {
        try {
            setDeleting(true);
            setMessage(null);

            const result = await deleteAllTransactions();

            setMessage({
                type: 'success',
                text: result.message || `Successfully deleted ${result.deleted_count || 0} transaction(s)`,
            });
            setShowDeleteConfirm(false);

            // Optionally reload the page or refresh data after deletion
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Failed to delete transactions:', error);
            setMessage({
                type: 'danger',
                text: error.response?.data?.detail || 'Failed to delete transactions',
            });
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
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

                    <div>
                        <div className="text-sm text-secondary mb-xs">Fio API URL</div>
                        <div className="flex items-center gap-md">
                            <code
                                style={{
                                    background: 'var(--bg-secondary)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.875rem',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {config?.fio_api_url || 'https://fioapi.fio.cz/v1/rest'}
                            </code>
                            {!showApiUrlInput && (
                                <button
                                    onClick={() => setShowApiUrlInput(true)}
                                    className="btn-secondary"
                                    style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.875rem' }}
                                >
                                    Update
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-secondary mb-xs">History Limit (Days Back)</div>
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
                                {config?.back_date_days || 3} days
                            </code>
                            {!showBackDateDaysInput && (
                                <button
                                    onClick={() => setShowBackDateDaysInput(true)}
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
                                    You can get your API token from your Fio Bank account settings. Leave empty to use example data.
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

            {/* Update API URL */}
            {showApiUrlInput && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <h3>Update Fio API URL</h3>
                    </div>

                    <form onSubmit={handleUpdateApiUrl}>
                        <div className="flex flex-col gap-md">
                            <div>
                                <label className="text-sm text-secondary mb-xs" style={{ display: 'block' }}>
                                    Select URL Source
                                </label>
                                <div className="flex flex-col gap-sm mb-md">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="apiUrlMode"
                                            value="predefined"
                                            checked={apiUrlMode === 'predefined'}
                                            onInput={(e) => {
                                                setApiUrlMode('predefined');
                                                setNewApiUrl('');
                                            }}
                                            disabled={saving}
                                        />
                                        <span>Predefined URL</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="apiUrlMode"
                                            value="custom"
                                            checked={apiUrlMode === 'custom'}
                                            onInput={(e) => {
                                                setApiUrlMode('custom');
                                                setSelectedPredefinedUrl('');
                                            }}
                                            disabled={saving}
                                        />
                                        <span>Custom URL</span>
                                    </label>
                                </div>

                                {apiUrlMode === 'predefined' ? (
                                    <div>
                                        <label className="text-sm text-secondary mb-xs" style={{ display: 'block' }}>
                                            Select Predefined API URL
                                        </label>
                                        <select
                                            value={selectedPredefinedUrl}
                                            onInput={(e) => setSelectedPredefinedUrl(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: 'var(--space-sm) var(--space-md)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.875rem',
                                            }}
                                            disabled={saving}
                                        >
                                            <option value="">-- Select a predefined URL --</option>
                                            {predefinedApiUrls.map((url) => (
                                                <option key={url.value} value={url.value}>
                                                    {url.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-sm text-secondary mb-xs" style={{ display: 'block' }}>
                                            Custom API Base URL
                                        </label>
                                        <input
                                            type="text"
                                            value={newApiUrl}
                                            onInput={(e) => setNewApiUrl(e.target.value)}
                                            placeholder="https://fioapi.fio.cz/v1/rest"
                                            style={{ width: '100%' }}
                                            disabled={saving}
                                        />
                                    </div>
                                )}
                                <p className="text-sm text-tertiary mt-xs">
                                    {apiUrlMode === 'predefined'
                                        ? 'Select a predefined API URL from the list above'
                                        : 'Enter a custom API URL to point to your own mock server for testing purposes'}
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
                                            Save URL
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowApiUrlInput(false);
                                        setNewApiUrl('');
                                        setSelectedPredefinedUrl('');
                                        setApiUrlMode('predefined');
                                        setMessage(null);
                                    }}
                                    className="btn-secondary"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>

                            <div
                                className="badge badge-info"
                                style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}
                            >
                                💡 <strong>Tip:</strong> You can choose from predefined URLs or enter a custom one. The default URL is{' '}
                                <code>https://fioapi.fio.cz/v1/rest</code>. You will need to restart the server for changes to take effect.
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Update Back Date Days */}
            {showBackDateDaysInput && (
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <h3>Update History Limit</h3>
                    </div>

                    <form onSubmit={handleUpdateBackDateDays}>
                        <div className="flex flex-col gap-md">
                            <div>
                                <label className="text-sm text-secondary mb-xs" style={{ display: 'block' }}>
                                    Days Back (Zarážka)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={newBackDateDays}
                                    onInput={(e) => setNewBackDateDays(e.target.value)}
                                    placeholder="3"
                                    style={{ width: '100%' }}
                                    disabled={saving}
                                />
                                <p className="text-sm text-tertiary mt-xs">
                                    Set the default number of days back for the history limit. This is used when setting the "zarážka" to prevent 422 errors. Valid range: 1-365 days.
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
                                            Save Setting
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBackDateDaysInput(false);
                                        setNewBackDateDays('');
                                        setMessage(null);
                                    }}
                                    className="btn-secondary"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>

                            <div
                                className="badge badge-info"
                                style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}
                            >
                                💡 <strong>Tip:</strong> This setting controls how far back the Fio API will search for transactions. Lower values help prevent 422 errors. You will need to restart the server for changes to take effect.
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete All Transactions */}
            <div className="card" style={{ border: '2px solid var(--danger)', background: 'var(--bg-secondary)' }}>
                <div className="card-header">
                    <h3 style={{ color: 'var(--danger)' }}>⚠️ Danger Zone</h3>
                </div>

                <div className="flex flex-col gap-md">
                    <p className="text-sm text-secondary">
                        Permanently delete all transactions from the database. This action cannot be undone.
                    </p>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn-danger"
                            style={{
                                alignSelf: 'flex-start',
                                padding: 'var(--space-sm) var(--space-md)',
                            }}
                        >
                            🗑️ Delete All Transactions
                        </button>
                    ) : (
                        <div className="flex flex-col gap-md animate-fade-in">
                            <div
                                className="badge badge-warning"
                                style={{ padding: 'var(--space-md)', fontSize: '0.95rem' }}
                            >
                                ⚠️ <strong>Warning:</strong> This will permanently delete all transactions from the database. This action cannot be undone. Are you sure you want to continue?
                            </div>

                            <div className="flex gap-md">
                                <button
                                    onClick={handleDeleteAllTransactions}
                                    className="btn-danger"
                                    disabled={deleting}
                                    style={{ padding: 'var(--space-sm) var(--space-md)' }}
                                >
                                    {deleting ? (
                                        <>
                                            <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <span>🗑️</span>
                                            Yes, Delete All
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setMessage(null);
                                    }}
                                    className="btn-secondary"
                                    disabled={deleting}
                                    style={{ padding: 'var(--space-sm) var(--space-md)' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Matching Data */}
            <div className="card" style={{ border: '2px solid var(--warning)', background: 'var(--bg-secondary)' }}>
                <div className="card-header">
                    <h3 style={{ color: 'var(--warning)' }}>🗂️ Matching Data</h3>
                </div>

                <div className="flex flex-col gap-md">
                    <p className="text-sm text-secondary">
                        Delete all uploaded matching data (VS, SS, KS entries). This will remove matching information but not affect transactions.
                    </p>

                    {!showDeleteMatchingConfirm ? (
                        <button
                            onClick={() => setShowDeleteMatchingConfirm(true)}
                            className="btn-secondary"
                            style={{
                                alignSelf: 'flex-start',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderColor: 'var(--warning)',
                                color: 'var(--warning)',
                            }}
                        >
                            🗑️ Delete Matching Data
                        </button>
                    ) : (
                        <div className="flex flex-col gap-md animate-fade-in">
                            <div
                                className="badge badge-warning"
                                style={{ padding: 'var(--space-md)', fontSize: '0.95rem' }}
                            >
                                ⚠️ <strong>Warning:</strong> This will permanently delete all matching data. Matching highlights will be removed from transactions. Are you sure you want to continue?
                            </div>

                            <div className="flex gap-md">
                                <button
                                    onClick={handleDeleteMatchingData}
                                    className="btn-secondary"
                                    disabled={deletingMatching}
                                    style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        borderColor: 'var(--warning)',
                                        color: 'var(--warning)',
                                    }}
                                >
                                    {deletingMatching ? (
                                        <>
                                            <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <span>🗑️</span>
                                            Yes, Delete Matching Data
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        setShowDeleteMatchingConfirm(false);
                                        setMessage(null);
                                    }}
                                    className="btn-secondary"
                                    disabled={deletingMatching}
                                    style={{ padding: 'var(--space-sm) var(--space-md)' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
                        <strong>History Limit (Zarážka):</strong> Number of days back to set as the history limit in Fio API. This prevents 422 errors by limiting how far back the API searches. Default: 3 days.
                    </p>
                    <p>
                        <strong>Environment Variables:</strong>
                    </p>
                    <ul style={{ marginLeft: 'var(--space-lg)', marginTop: 'var(--space-xs)' }}>
                        <li><code>FIO_FETCH_HOST</code> - Server host</li>
                        <li><code>FIO_FETCH_PORT</code> - Server port</li>
                        <li><code>FIO_FETCH_DB_PATH</code> - Database path</li>
                        <li><code>FIO_FETCH_TOKEN</code> - Fio API token (leave empty for example data)</li>
                        <li><code>FIO_FETCH_API_URL</code> - Fio API base URL (for testing with mock servers)</li>
                        <li><code>FIO_FETCH_BACK_DATE_DAYS</code> - History limit in days (default: 3)</li>
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
