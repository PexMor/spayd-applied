import { useState } from 'preact/hooks';
import { useI18n } from '../../I18nContext';
import { generateRandomIBAN } from '../utils/iban-generator';

export interface Account {
    id: string;
    name: string;
    iban: string;
    currency: string;
    logoUrl?: string;
}

interface BatchAccountManagerProps {
    accounts: Account[];
    onAccountsChange: (accounts: Account[]) => void;
    selectedAccountId: string;
    onSelectAccount: (id: string) => void;
}

export function BatchAccountManager({
    accounts,
    onAccountsChange,
    selectedAccountId,
    onSelectAccount,
}: BatchAccountManagerProps) {
    const { t } = useI18n();
    const [isEditing, setIsEditing] = useState(false);
    const [editAccount, setEditAccount] = useState<Account>({
        id: '',
        name: '',
        iban: '',
        currency: 'CZK',
    });

    const handleAddAccount = () => {
        const newAccount: Account = {
            id: crypto.randomUUID(),
            name: t.newAccount.replace('+ ', ''), // Remove '+ ' prefix for default name
            iban: '',
            currency: 'CZK',
        };
        setEditAccount(newAccount);
        setIsEditing(true);
    };

    const handleEditAccount = (account: Account) => {
        setEditAccount({ ...account });
        setIsEditing(true);
    };

    const handleDeleteAccount = (id: string) => {
        if (confirm(`${t.deleteAccountConfirm}?`)) {
            const newAccounts = accounts.filter((a) => a.id !== id);
            onAccountsChange(newAccounts);
            if (selectedAccountId === id && newAccounts.length > 0) {
                onSelectAccount(newAccounts[0].id);
            } else if (newAccounts.length === 0) {
                onSelectAccount('');
            }
        }
    };

    const handleSave = () => {
        if (!editAccount.name || !editAccount.iban) {
            alert(t.required);
            return;
        }

        const existingIndex = accounts.findIndex((a) => a.id === editAccount.id);
        let newAccounts;
        if (existingIndex >= 0) {
            newAccounts = [...accounts];
            newAccounts[existingIndex] = editAccount;
        } else {
            newAccounts = [...accounts, editAccount];
        }

        onAccountsChange(newAccounts);
        onSelectAccount(editAccount.id);
        setIsEditing(false);
    };

    const generateIBAN = () => {
        try {
            const iban = generateRandomIBAN();
            setEditAccount({ ...editAccount, iban });
        } catch (e) {
            console.error(e);
            alert(t.error);
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(accounts, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'accounts.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const importedAccounts = JSON.parse(evt.target?.result as string);
                if (Array.isArray(importedAccounts)) {
                    onAccountsChange(importedAccounts);
                    if (importedAccounts.length > 0) {
                        onSelectAccount(importedAccounts[0].id);
                    }
                    alert(t.importedAccountsSuccess.replace('{count}', importedAccounts.length.toString()));
                } else {
                    alert(t.error);
                }
            } catch (error) {
                alert(t.error);
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    if (isEditing) {
        return (
            <div className="space-y-4 border p-4 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-medium text-blue-900">
                    {accounts.find((a) => a.id === editAccount.id) ? t.editAccount : t.newAccount.replace('+ ', '')}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-blue-800">{t.accountName}</label>
                        <input
                            type="text"
                            value={editAccount.name}
                            onInput={(e) => setEditAccount({ ...editAccount, name: (e.target as HTMLInputElement).value })}
                            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-800">{t.iban}</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={editAccount.iban}
                                onInput={(e) => setEditAccount({ ...editAccount, iban: (e.target as HTMLInputElement).value })}
                                className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            />
                            <button
                                onClick={generateIBAN}
                                className="mt-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm whitespace-nowrap transition-colors"
                            >
                                {t.random}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-800">{t.currency}</label>
                        <select
                            value={editAccount.currency}
                            onChange={(e) => setEditAccount({ ...editAccount, currency: (e.target as HTMLSelectElement).value })}
                            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="CZK">CZK</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-800">Logo URL (Optional)</label>
                        <input
                            type="text"
                            value={editAccount.logoUrl || ''}
                            onInput={(e) => setEditAccount({ ...editAccount, logoUrl: (e.target as HTMLInputElement).value })}
                            placeholder="https://example.com/logo.png"
                            className="mt-1 block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {t.saveAccount}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-blue-900">{t.selectAccount}</label>
                <div className="flex gap-2">
                    <label className="text-sm text-blue-700 hover:text-blue-900 font-medium bg-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors cursor-pointer">
                        {t.import}
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={handleExport}
                        disabled={accounts.length === 0}
                        className="text-sm text-blue-700 hover:text-blue-900 font-medium bg-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t.export}
                    </button>
                    <button
                        onClick={handleAddAccount}
                        className="text-sm text-blue-700 hover:text-blue-900 font-medium bg-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                    >
                        {t.newAccount}
                    </button>
                </div>
            </div>

            {accounts.length === 0 ? (
                <div className="text-center py-6 text-blue-600 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                    {t.noAccountsCreated}
                    <br />
                    <button onClick={handleAddAccount} className="text-blue-700 font-medium hover:underline mt-2">{t.createOne}</button>
                </div>
            ) : (
                <div className="space-y-2">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedAccountId === account.id
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm'
                                : 'border-blue-100 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                                }`}
                            onClick={() => onSelectAccount(account.id)}
                        >
                            <div>
                                <div className="font-medium text-gray-900">{account.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{account.iban} ({account.currency})</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditAccount(account); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                                    title={t.edit}
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title={t.delete}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
