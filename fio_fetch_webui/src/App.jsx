import { useState, useEffect } from 'preact/hooks';
import TransactionList from './components/TransactionList';
import ConfigPanel from './components/ConfigPanel';
import FetchControl from './components/FetchControl';
import Modal from './components/Modal';
import HamburgerMenu, { HamburgerButton } from './components/HamburgerMenu';
import { initializeWebSocket, cleanupWebSocket } from './store/useAppStore';
import useAppStore from './store/useAppStore';

function App() {
    const [showFetchModal, setShowFetchModal] = useState(false);
    const [showConfigMenu, setShowConfigMenu] = useState(false);
    
    const { isConnected, isFetching, canFetch, countdown } = useAppStore();
    
    // Initialize WebSocket once when app mounts
    useEffect(() => {
        initializeWebSocket();
        
        // Cleanup on unmount (app-level cleanup)
        return () => {
            cleanupWebSocket();
        };
    }, []);

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="container">
                    <div className="header-content">
                        <div className="header-brand">
                            <span className="brand-icon">🏦</span>
                            <div className="brand-text">
                                <h1 className="brand-title">FioFetch</h1>
                                <p className="brand-subtitle">Transaction Manager</p>
                            </div>
                        </div>
                        
                        <div className="header-actions">
                            {/* Connection Status Indicator */}
                            <div className="connection-status" title={isConnected ? 'Connected' : 'Disconnected'}>
                                <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                            </div>
                            
                            {/* Fetch Button */}
                            <button
                                onClick={() => setShowFetchModal(true)}
                                className="fetch-trigger-btn"
                                title="Fetch transactions"
                            >
                                {isFetching ? (
                                    <div className="spinner spinner-sm" />
                                ) : !canFetch ? (
                                    <span className="countdown-badge">{countdown}s</span>
                                ) : (
                                    <span>🔄</span>
                                )}
                                <span className="btn-text">Fetch</span>
                            </button>
                            
                            {/* Hamburger Menu Button */}
                            <HamburgerButton 
                                onClick={() => setShowConfigMenu(true)} 
                                isOpen={showConfigMenu}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Just Transactions */}
            <main className="app-main">
                <div className="container">
                    <TransactionList />
                </div>
            </main>

            {/* Footer */}
            <footer className="app-footer">
                <div className="container">
                    <p>FioFetch &copy; 2025 - Financial Transaction Manager</p>
                </div>
            </footer>

            {/* Fetch Modal (Fullscreen Popup) */}
            <Modal
                isOpen={showFetchModal}
                onClose={() => setShowFetchModal(false)}
                title="🔄 Fetch Transactions"
            >
                <FetchControl />
            </Modal>

            {/* Config Hamburger Menu */}
            <HamburgerMenu
                isOpen={showConfigMenu}
                onClose={() => setShowConfigMenu(false)}
            >
                <ConfigPanel />
            </HamburgerMenu>
        </div>
    );
}

export default App;
