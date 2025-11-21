import { useState, useEffect } from 'preact/hooks';
import { getAccounts, addAccount, updateAccount, deleteAccount, type Account } from '../db';
import { friendlyFormatIBAN, isValidIBAN } from 'ibantools';

export function AccountManager() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        iban: '',
        currency: 'CZK',
        webhookUrl: '',
        isDefault: false,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        loadAccounts();
    }, []);

    async function loadAccounts() {
        const data = await getAccounts();
        setAccounts(data);
    }

    function openForm(account?: Account) {
        if (account) {
            setEditingAccount(account);
            setFormData({
                name: account.name,
                iban: account.iban,
                currency: account.currency,
                webhookUrl: account.webhookUrl || '',
                isDefault: account.isDefault,
            });
        } else {
            setEditingAccount(null);
            setFormData({
                name: '',
                iban: '',
                currency: 'CZK',
                webhookUrl: '',
                isDefault: accounts.length === 0,
            });
        }
        setError('');
        setIsFormOpen(true);
    }

    function closeForm() {
        setIsFormOpen(false);
        setEditingAccount(null);
        setError('');
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        setError('');

        // Validate IBAN
        if (!isValidIBAN(formData.iban)) {
            setError('Invalid IBAN format');
            return;
        }

        try {
            const accountData = {
                ...formData,
                updatedAt: Date.now(),
                createdAt: editingAccount?.createdAt || Date.now(),
            };

            if (editingAccount) {
                await updateAccount({ ...accountData, id: editingAccount.id });
            } else {
                await addAccount(accountData);
            }

            await loadAccounts();
            closeForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save account');
        }
    }

    async function handleDelete(account: Account) {
        if (!account.id) return;
        if (confirm(`Are you sure you want to delete account "${account.name}"?`)) {
            await deleteAccount(account.id);
            await loadAccounts();
        }
    }

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-lg">
                <h2>Bank Accounts</h2>
                <button className="btn btn-primary" onClick={() => openForm()}>
                    + Add Account
                </button>
            </div>

            {accounts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏦</div>
                    <h3>No accounts yet</h3>
                    <p>Add your first bank account to start generating payments</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {accounts.map((account) => (
                        <div key={account.id} className="card">
                            <div className="flex justify-between items-center mb-md">
                                <h3 className="text-lg">{account.name}</h3>
                                {account.isDefault && (
                                    <span className="badge badge-acked">Default</span>
                                )}
                            </div>
                            <div className="mb-sm">
                                <div className="text-sm text-secondary">IBAN</div>
                                <div className="font-mono text-sm">
                                    {friendlyFormatIBAN(account.iban) || account.iban}
                                </div>
                            </div>
                            <div className="mb-sm">
                                <div className="text-sm text-secondary">Currency</div>
                                <div className="text-sm">{account.currency}</div>
                            </div>
                            {account.webhookUrl && (
                                <div className="mb-sm">
                                    <div className="text-sm text-secondary">Webhook URL</div>
                                    <div className="text-sm font-mono" style={{ wordBreak: 'break-all' }}>
                                        {account.webhookUrl}
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-sm mt-md">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openForm(account)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(account)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <div className="modal-overlay" onClick={closeForm}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingAccount ? 'Edit Account' : 'Add Account'}
                            </h2>
                            <button className="modal-close" onClick={closeForm}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Account Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onInput={(e) =>
                                        setFormData({ ...formData, name: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder="e.g., Main Business Account"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">IBAN</label>
                                <input
                                    type="text"
                                    value={formData.iban}
                                    onInput={(e) =>
                                        setFormData({ ...formData, iban: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder="CZ6508000000192000145399"
                                    required
                                />
                                <div className="form-help">
                                    Enter the IBAN without spaces (e.g., CZ6508000000192000145399)
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Currency</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) =>
                                        setFormData({ ...formData, currency: (e.target as HTMLSelectElement).value })
                                    }
                                >
                                    <option value="CZK">CZK</option>
                                    <option value="EUR">EUR</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Webhook URL (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.webhookUrl}
                                    onInput={(e) =>
                                        setFormData({ ...formData, webhookUrl: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder="https://api.example.com/webhook"
                                />
                                <div className="form-help">
                                    URL to send payment notifications (leave empty to disable sync)
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="flex items-center gap-sm">
                                    <input
                                        type="checkbox"
                                        checked={formData.isDefault}
                                        onChange={(e) =>
                                            setFormData({ ...formData, isDefault: (e.target as HTMLInputElement).checked })
                                        }
                                    />
                                    <span className="form-label" style={{ marginBottom: 0 }}>
                                        Set as default account
                                    </span>
                                </label>
                            </div>

                            {error && <div className="form-error mb-md">{error}</div>}

                            <div className="flex gap-sm justify-between">
                                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingAccount ? 'Update' : 'Create'} Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
