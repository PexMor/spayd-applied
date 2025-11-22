import { useState, useEffect } from 'preact/hooks';
import './app.css';
import { AccountManager } from './components/AccountManager';
import { EventManager } from './components/EventManager';
import { PaymentForm } from './components/PaymentForm';
import { PaymentHistory } from './components/PaymentHistory';
import { SyncQueue } from './components/SyncQueue';
import { HamburgerMenu } from './components/HamburgerMenu';
import { ConfigWizard } from './components/ConfigWizard';
import { initDB, getAccounts, getEvents } from './db';
import { startBackgroundSync } from './services/sync-service';
import { useI18n } from './I18nContext';

type ViewName = 'generate' | 'accounts' | 'events' | 'history' | 'sync';

export function App() {
  const { t } = useI18n();
  const [activeView, setActiveView] = useState<ViewName>('generate');
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsConfiguration, setNeedsConfiguration] = useState(false);

  useEffect(() => {
    // Initialize database and check configuration status
    initDB()
      .then(async () => {
        // Check if we need to show the configuration wizard
        const accounts = await getAccounts();
        const events = await getEvents();

        if (accounts.length === 0 || events.length === 0) {
          // No accounts or events - show configuration wizard
          setNeedsConfiguration(true);
        } else {
          // Already configured - proceed normally
          setNeedsConfiguration(false);
        }

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

  async function handleConfigComplete() {
    // Configuration wizard completed - check status again
    const accounts = await getAccounts();
    const events = await getEvents();

    if (accounts.length > 0 && events.length > 0) {
      setNeedsConfiguration(false);
      setActiveView('generate');
    }
  }

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

  // Show configuration wizard if needed
  if (needsConfiguration) {
    return <ConfigWizard onComplete={handleConfigComplete} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            {t.appTitle}
          </h1>
          <HamburgerMenu activeView={activeView} onNavigate={(view) => setActiveView(view as ViewName)} />
        </div>
      </header>

      <main className="app-main">
        {activeView === 'generate' && <PaymentForm />}
        {activeView === 'accounts' && <AccountManager />}
        {activeView === 'events' && <EventManager />}
        {activeView === 'history' && <PaymentHistory />}
        {activeView === 'sync' && <SyncQueue />}
      </main>

      <footer className="app-footer">
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
}
