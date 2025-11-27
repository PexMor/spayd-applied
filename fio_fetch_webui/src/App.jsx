import { useState, useEffect } from 'preact/hooks';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import ConfigPanel from './components/ConfigPanel';
import FetchControl from './components/FetchControl';
import { initializeWebSocket, cleanupWebSocket } from './store/useAppStore';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Initialize WebSocket once when app mounts
    useEffect(() => {
        initializeWebSocket();
        
        // Cleanup on unmount (app-level cleanup)
        return () => {
            cleanupWebSocket();
        };
    }, []);

    const tabs = [
        { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
        { id: 'transactions', label: '💰 Transactions', icon: '💰' },
        { id: 'fetch', label: '🔄 Fetch', icon: '🔄' },
        { id: 'config', label: '⚙️ Config', icon: '⚙️' },
    ];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                color: 'white',
                padding: 'var(--space-lg)',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div className="container">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-md">
                            <span style={{ fontSize: '2rem' }}>🏦</span>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'white' }}>FioFetch</h1>
                                <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                                    Transaction Manager
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav style={{
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div className="container">
                    <div className="flex gap-sm" style={{ padding: 'var(--space-sm) 0' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}
                                style={{
                                    padding: 'var(--space-sm) var(--space-lg)',
                                    fontSize: '0.95rem',
                                }}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label.replace(/^.+\s/, '')}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main style={{ flex: 1, padding: 'var(--space-xl) 0' }}>
                <div className="container animate-fade-in">
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'transactions' && <TransactionList />}
                    {activeTab === 'fetch' && <FetchControl />}
                    {activeTab === 'config' && <ConfigPanel />}
                </div>
            </main>

            {/* Footer */}
            <footer style={{
                background: 'var(--bg-primary)',
                borderTop: '1px solid var(--border-color)',
                padding: 'var(--space-lg)',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
            }}>
                <div className="container">
                    <p>FioFetch &copy; 2025 - Financial Transaction Manager</p>
                </div>
            </footer>
        </div>
    );
}

export default App;
