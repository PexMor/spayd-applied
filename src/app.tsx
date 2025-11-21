import { useState, useEffect } from 'preact/hooks';
import './app.css';
import { AccountManager } from './components/AccountManager';
import { EventManager } from './components/EventManager';
import { PaymentForm } from './components/PaymentForm';
import { PaymentHistory } from './components/PaymentHistory';
import { SyncQueue } from './components/SyncQueue';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { initDB, initializeWithSampleData } from './db';
import { startBackgroundSync } from './services/sync-service';
import { useI18n } from './I18nContext';
import { detectBrowserLanguage } from './i18n';

type TabName = 'generate' | 'accounts' | 'events' | 'history' | 'sync';

export function App() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabName>('generate');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize database and start background sync
    initDB()
      .then(async () => {
        // Initialize with sample data if database is empty
        // Detect locale for sample data
        const detectedLocale = detectBrowserLanguage();
        await initializeWithSampleData(detectedLocale);

        setIsInitialized(true);
        // Start background sync every 30 seconds
        const syncId = startBackgroundSync(30000);

        // Cleanup on unmount
        return () => {
          if (typeof syncId === 'number') {
            clearInterval(syncId);
          }
        };
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        alert('Failed to initialize database. Please refresh the page.');
      });
  }, []);

  const tabs = [
    { id: 'generate', label: t.tabGenerate },
    { id: 'accounts', label: t.tabAccounts },
    { id: 'events', label: t.tabEvents },
    { id: 'history', label: t.tabHistory },
    { id: 'sync', label: t.tabSync },
  ] as const;

  if (!isInitialized) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }}></div>
          <div className="text-lg">{t.initializingApp}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 'var(--spacing-sm)'
        }}>
          {t.appTitle}
        </h1>
        <p className="text-secondary">
          {t.appSubtitle}
        </p>
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <LanguageSwitcher />
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as TabName)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'generate' && <PaymentForm />}
        {activeTab === 'accounts' && <AccountManager />}
        {activeTab === 'events' && <EventManager />}
        {activeTab === 'history' && <PaymentHistory />}
        {activeTab === 'sync' && <SyncQueue />}
      </main>

      <footer style={{
        textAlign: 'center',
        marginTop: 'var(--spacing-2xl)',
        paddingTop: 'var(--spacing-xl)',
        borderTop: '1px solid var(--color-border-light)',
        color: 'var(--color-text-tertiary)',
        fontSize: '0.875rem'
      }}>
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
}
