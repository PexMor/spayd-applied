import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import wsManager from '../services/websocket';
import { triggerFetch } from '../services/api';

const useAppStore = create(
    immer((set, get) => ({
        // WebSocket state
        isConnected: false,
        
        // Fetch state
        isFetching: false,
        lastFetchTime: null,
        canFetch: true,
        countdown: 0,
        
        // Activity log
        messages: [],
        
        // Transactions cache
        transactions: [],
        transactionsLoading: false,
        transactionsPage: 0,
        transactionsLimit: 50,
        transactionsTotalCount: 0,
        transactionsFilters: {
            variable_symbol: '',
            specific_symbol: '',
            constant_symbol: '',
            counter_account: '',
            counter_account_name: '',
            bank_code: '',
            bank_name: '',
            executor: '',
            transaction_id: '',
        },
        transactionsAppliedFilters: {
            variable_symbol: '',
            specific_symbol: '',
            constant_symbol: '',
            counter_account: '',
            counter_account_name: '',
            bank_code: '',
            bank_name: '',
            executor: '',
            transaction_id: '',
        },
        
        // Config cache
        config: null,
        configLoading: false,
        
        // Matching data
        matchingData: [],
        matchingStats: null,
        hideMatchedTransactions: false,
        
        // Actions
        setConnected: (connected) => set((state) => {
            state.isConnected = connected;
        }),
        
        setFetching: (fetching) => set((state) => {
            state.isFetching = fetching;
        }),
        
        setLastFetchTime: (time) => set((state) => {
            state.lastFetchTime = time;
        }),
        
        setCanFetch: (can) => set((state) => {
            state.canFetch = can;
        }),
        
        setCountdown: (countdown) => set((state) => {
            state.countdown = countdown;
        }),
        
        addMessage: (text, type = 'primary') => set((state) => {
            const timestamp = new Date().toLocaleTimeString('cs-CZ');
            state.messages.unshift({
                text,
                type,
                timestamp,
                id: Date.now() + Math.random()
            });
            // Keep last 100 messages
            if (state.messages.length > 100) {
                state.messages = state.messages.slice(0, 100);
            }
        }),
        
        clearMessages: () => set((state) => {
            state.messages = [];
        }),
        
        handleWebSocketMessage: (data) => {
            const { addMessage, setConnected, setFetching } = get();
            
            if (data.type === 'connected') {
                setConnected(true);
                addMessage('✅ Connected to server', 'success');
            } else if (data.type === 'disconnected') {
                setConnected(false);
                addMessage('❌ Disconnected from server', 'danger');
            } else if (data.type === 'error') {
                addMessage('⚠️ WebSocket error occurred', 'warning');
            } else {
                // Handle fetch progress messages
                if (data.status) {
                    // Determine message type based on status
                    let messageType = 'primary';
                    if (data.status === 'error') {
                        messageType = 'danger';
                    } else if (data.status === 'completed') {
                        messageType = 'success';
                    } else if (data.status === 'started') {
                        messageType = 'primary';
                    }
                    
                    // Stop fetching state when completed or error
                    if (data.status === 'completed' || data.status === 'error') {
                        setFetching(false);
                    }
                    
                    // Add the detailed message if present, otherwise add status
                    if (data.message) {
                        addMessage(data.message, messageType);
                    } else {
                        addMessage(`Status: ${data.status}`, messageType);
                    }
                } else if (data.message) {
                    // Standalone message without status
                    addMessage(data.message, 'primary');
                }
                
                if (data.progress !== undefined) {
                    addMessage(`Progress: ${data.progress}%`, 'primary');
                }
            }
        },
        
        triggerFetchAction: async () => {
            const { canFetch, isFetching, setFetching, setLastFetchTime, addMessage } = get();
            
            if (!canFetch || isFetching) return;
            
            try {
                setFetching(true);
                setLastFetchTime(Date.now());
                addMessage('🚀 Starting fetch...', 'primary');
                
                const result = await triggerFetch();
                addMessage(result.message || 'Fetch started', 'success');
            } catch (error) {
                console.error('Fetch failed:', error);
                addMessage(`❌ Error: ${error.message}`, 'danger');
                setFetching(false);
            }
        },
        
        setTransactions: (transactions) => set((state) => {
            state.transactions = transactions;
        }),
        
        setTransactionsLoading: (loading) => set((state) => {
            state.transactionsLoading = loading;
        }),
        
        setConfig: (config) => set((state) => {
            state.config = config;
        }),
        
        setConfigLoading: (loading) => set((state) => {
            state.configLoading = loading;
        }),
        
        // Transaction filter actions
        setTransactionsPage: (page) => set((state) => {
            state.transactionsPage = page;
        }),
        
        setTransactionsTotalCount: (count) => set((state) => {
            state.transactionsTotalCount = count;
        }),
        
        setTransactionsFilters: (filters) => set((state) => {
            state.transactionsFilters = filters;
        }),
        
        setTransactionsAppliedFilters: (filters) => set((state) => {
            state.transactionsAppliedFilters = filters;
            state.transactionsPage = 0; // Reset to first page when filters change
        }),
        
        clearTransactionsFilters: () => set((state) => {
            state.transactionsFilters = {
                variable_symbol: '',
                specific_symbol: '',
                constant_symbol: '',
                counter_account: '',
                counter_account_name: '',
                bank_code: '',
                bank_name: '',
                executor: '',
                transaction_id: '',
            };
            state.transactionsAppliedFilters = {
                variable_symbol: '',
                specific_symbol: '',
                constant_symbol: '',
                counter_account: '',
                counter_account_name: '',
                bank_code: '',
                bank_name: '',
                executor: '',
                transaction_id: '',
            };
            state.transactionsPage = 0;
        }),
        
        // Matching data actions
        setMatchingData: (data) => set((state) => {
            state.matchingData = data;
        }),
        
        setMatchingStats: (stats) => set((state) => {
            state.matchingStats = stats;
        }),
        
        setHideMatchedTransactions: (hide) => set((state) => {
            state.hideMatchedTransactions = hide;
        }),
        
        clearMatchingData: () => set((state) => {
            state.matchingData = [];
            state.matchingStats = null;
        }),
    }))
);

// Initialize WebSocket connection outside of component lifecycle
let wsInitialized = false;
let wsListenerRemover = null;
let countdownInterval = null;

export const initializeWebSocket = () => {
    if (wsInitialized) return;
    
    wsInitialized = true;
    
    // Connect WebSocket
    wsManager.connect();
    
    // Add listener for WebSocket messages
    wsListenerRemover = wsManager.addListener((data) => {
        useAppStore.getState().handleWebSocketMessage(data);
    });
    
    // Check initial connection state periodically until connected
    const checkConnection = setInterval(() => {
        if (wsManager.isConnected()) {
            useAppStore.getState().setConnected(true);
            clearInterval(checkConnection);
        }
    }, 50);
    
    // Clear check after 5 seconds to prevent infinite checking
    setTimeout(() => clearInterval(checkConnection), 5000);
    
    // Start countdown timer
    countdownInterval = setInterval(() => {
        const { lastFetchTime, setCanFetch, setCountdown } = useAppStore.getState();
        
        if (lastFetchTime) {
            const elapsed = Date.now() - lastFetchTime;
            const remaining = Math.max(0, 30000 - elapsed);
            
            if (remaining > 0) {
                setCanFetch(false);
                setCountdown(Math.ceil(remaining / 1000));
            } else {
                setCanFetch(true);
                setCountdown(0);
            }
        }
    }, 100);
};

export const cleanupWebSocket = () => {
    if (wsListenerRemover) {
        wsListenerRemover();
        wsListenerRemover = null;
    }
    
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    wsManager.disconnect();
    wsInitialized = false;
};

export default useAppStore;

