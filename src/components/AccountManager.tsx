import { useState, useEffect } from 'preact/hooks';
import { useI18n } from '../I18nContext';
import { getAccounts, addAccount, updateAccount, deleteAccount, type Account } from '../db';
import { friendlyFormatIBAN, isValidIBAN } from 'ibantools';
import { ConfirmDialog } from './Dialog';

export function AccountManager() {
    const { t } = useI18n();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        iban: '',
        currency: 'CZK',

        isDefault: false,
    });
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ account: Account } | null>(null);

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

                isDefault: account.isDefault,
            });
        } else {
            setEditingAccount(null);
            setFormData({
                name: '',
                iban: '',
                currency: 'CZK',

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
            setError(t.invalidIban);
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
            setError(err instanceof Error ? err.message : t.failedToCreateAccount);
        }
    }

    function handleDelete(account: Account) {
        if (!account.id) return;
        setDeleteConfirm({ account });
    }

    async function confirmDelete() {
        if (!deleteConfirm?.account.id) return;
        await deleteAccount(deleteConfirm.account.id);
        await loadAccounts();
        setDeleteConfirm(null);
    }

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-lg">
                <h2>{t.accounts}</h2>
                <button className="btn btn-primary" onClick={() => openForm()}>
                    {t.addAccount}
                </button>
            </div>

            {accounts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏦</div>
                    <h3>{t.noAccountsYet}</h3>
                    <p>{t.noAccountsMessage}</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {accounts.map((account) => (
                        <div key={account.id} className="card">
                            <div className="flex justify-between items-center mb-md">
                                <h3 className="text-lg">{account.name}</h3>
                                {account.isDefault && (
                                    <span className="badge badge-acked">{t.default}</span>
                                )}
                            </div>
                            <div className="mb-sm">
                                <div className="text-sm text-secondary">{t.iban}</div>
                                <div className="font-mono text-sm">
                                    {friendlyFormatIBAN(account.iban) || account.iban}
                                </div>
                            </div>
                            <div className="mb-sm">
                                <div className="text-sm text-secondary">{t.currency}</div>
                                <div className="text-sm">{account.currency}</div>
                            </div>

                            <div className="flex gap-sm mt-md">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openForm(account)}
                                >
                                    {t.edit}
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(account)}
                                >
                                    {t.delete}
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
                                {editingAccount ? t.editAccount : t.addAccount.replace('+ ', '')}
                            </h2>
                            <button className="modal-close" onClick={closeForm}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t.accountName}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onInput={(e) =>
                                        setFormData({ ...formData, name: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder={t.accountNamePlaceholder}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.iban}</label>
                                <input
                                    type="text"
                                    value={formData.iban}
                                    onInput={(e) =>
                                        setFormData({ ...formData, iban: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder={t.ibanPlaceholder}
                                    required
                                />
                                <div className="form-help">
                                    {t.ibanHelp}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.currency}</label>
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
                                <label className="flex items-center gap-sm">
                                    <input
                                        type="checkbox"
                                        checked={formData.isDefault}
                                        onChange={(e) =>
                                            setFormData({ ...formData, isDefault: (e.target as HTMLInputElement).checked })
                                        }
                                    />
                                    <span className="form-label" style={{ marginBottom: 0 }}>
                                        {t.setAsDefault}
                                    </span>
                                </label>
                            </div>

                            {error && <div className="form-error mb-md">{error}</div>}

                            <div className="flex gap-sm justify-between">
                                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingAccount ? t.update : t.create} {t.account}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <ConfirmDialog
                    message={`${t.deleteAccountConfirm} "${deleteConfirm.account.name}"?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
        </div>
    );
}
