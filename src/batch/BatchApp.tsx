import { useState, useEffect } from 'preact/hooks';
import { useI18n } from '../I18nContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

import { EmailPreview } from './components/EmailPreview';
import { BatchAccountManager, Account } from './components/BatchAccountManager';
import { BatchEventManager, EventConfig } from './components/BatchEventManager';
import { PeopleDataManager } from './components/PeopleDataManager';
import { initDB, loadAccounts, saveAccounts, loadEvents, saveEvents } from './services/storage';

export interface BatchData {
    headers: string[];
    rows: any[];
}

export interface BatchConfig {
    account: {
        iban: string;
        currency: string;
        name: string;
        logoUrl?: string;
    };
    event: EventConfig | null;
}

export function BatchApp() {
    const { t } = useI18n();
    const [data, setData] = useState<BatchData | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');

    const [events, setEvents] = useState<EventConfig[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    const [config, setConfig] = useState<BatchConfig>({
        account: { iban: '', currency: 'CZK', name: '' },
        event: null,
    });

    // Initialize IndexedDB and load data on mount
    useEffect(() => {
        const init = async () => {
            await initDB();
            const savedAccounts = await loadAccounts();
            const savedEvents = await loadEvents();

            if (savedAccounts.length > 0) {
                setAccounts(savedAccounts);
                setSelectedAccountId(savedAccounts[0].id);
            }

            if (savedEvents.length > 0) {
                setEvents(savedEvents);
                setSelectedEventId(savedEvents[0].id);
            }
        };
        init().catch(console.error);
    }, []);

    // Save accounts to IndexedDB whenever they change
    useEffect(() => {
        if (accounts.length > 0) {
            saveAccounts(accounts).catch(console.error);
        }
    }, [accounts]);

    // Save events to IndexedDB whenever they change
    useEffect(() => {
        if (events.length > 0) {
            saveEvents(events).catch(console.error);
        }
    }, [events]);

    // Update config when selected account changes
    useEffect(() => {
        const account = accounts.find(a => a.id === selectedAccountId);
        if (account) {
            setConfig(prev => ({
                ...prev,
                account: {
                    iban: account.iban,
                    currency: account.currency,
                    name: account.name,
                    logoUrl: account.logoUrl
                }
            }));
        }
    }, [selectedAccountId, accounts]);

    // Update config when selected event changes
    useEffect(() => {
        const event = events.find(e => e.id === selectedEventId);
        if (event) {
            setConfig(prev => ({
                ...prev,
                event: event
            }));
        }
    }, [selectedEventId, events]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <header className="text-center mb-12 relative">
                    <div className="absolute right-0 top-0">
                        <LanguageSwitcher />
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{t.batchTitle}</h1>
                    <p className="mt-3 text-lg text-gray-600">{t.batchSubtitle}</p>
                </header>

                <div className="space-y-6">
                    {/* 1. Accounts Section (Blue) */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 ring-4 ring-blue-50/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                            <h2 className="text-xl font-bold text-gray-900">{t.stepAccounts}</h2>
                        </div>
                        <BatchAccountManager
                            accounts={accounts}
                            onAccountsChange={setAccounts}
                            selectedAccountId={selectedAccountId}
                            onSelectAccount={setSelectedAccountId}
                        />
                    </section>

                    {/* 2. Events Section (Green) */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-green-100 ring-4 ring-green-50/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold">2</div>
                            <h2 className="text-xl font-bold text-gray-900">{t.stepEvents}</h2>
                        </div>
                        <BatchEventManager
                            events={events}
                            onEventsChange={setEvents}
                            selectedEventId={selectedEventId}
                            onSelectEvent={setSelectedEventId}
                        />
                    </section>

                    {/* 3. People Data (Orange) */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 ring-4 ring-orange-50/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">3</div>
                            <h2 className="text-xl font-bold text-gray-900">{t.stepPeople}</h2>
                        </div>
                        <PeopleDataManager
                            data={data}
                            onDataChange={setData}
                        />
                    </section>

                    {/* 4. Preview (Purple) */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 ring-4 ring-purple-50/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold">4</div>
                            <h2 className="text-xl font-bold text-gray-900">{t.stepPreview}</h2>
                        </div>
                        {data ? (
                            <EmailPreview data={data} config={config} />
                        ) : (
                            <div className="text-center py-24 text-gray-400 border-2 border-dashed border-purple-100 rounded-xl bg-purple-50/30">
                                <div className="text-4xl mb-4">👀</div>
                                <p>{t.uploadDataToSeePreview}</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
