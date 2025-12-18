import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    },
});

// Add timestamp to GET requests to prevent browser caching
api.interceptors.request.use((config) => {
    if (config.method === 'get') {
        config.params = {
            ...config.params,
            _t: Date.now(),
        };
    }
    return config;
});

// Transactions
export const getTransactions = async (skip = 0, limit = 100, filters = {}, hideMatched = false) => {
    const params = { skip, limit };
    
    // Add filter parameters if provided
    if (filters.variable_symbol) params.variable_symbol = filters.variable_symbol;
    if (filters.specific_symbol) params.specific_symbol = filters.specific_symbol;
    if (filters.constant_symbol) params.constant_symbol = filters.constant_symbol;
    if (filters.counter_account) params.counter_account = filters.counter_account;
    if (filters.counter_account_name) params.counter_account_name = filters.counter_account_name;
    if (filters.bank_code) params.bank_code = filters.bank_code;
    if (filters.bank_name) params.bank_name = filters.bank_name;
    if (filters.executor) params.executor = filters.executor;
    if (filters.transaction_id) params.transaction_id = filters.transaction_id;
    
    // Add hide_matched filter
    if (hideMatched) params.hide_matched = true;
    
    const response = await api.get('/transactions', { params });
    return response.data;
};

// Get transaction count with filters
export const getTransactionsCount = async (filters = {}, hideMatched = false) => {
    const params = {};
    
    // Add filter parameters if provided
    if (filters.variable_symbol) params.variable_symbol = filters.variable_symbol;
    if (filters.specific_symbol) params.specific_symbol = filters.specific_symbol;
    if (filters.constant_symbol) params.constant_symbol = filters.constant_symbol;
    if (filters.counter_account) params.counter_account = filters.counter_account;
    if (filters.counter_account_name) params.counter_account_name = filters.counter_account_name;
    if (filters.bank_code) params.bank_code = filters.bank_code;
    if (filters.bank_name) params.bank_name = filters.bank_name;
    if (filters.executor) params.executor = filters.executor;
    if (filters.transaction_id) params.transaction_id = filters.transaction_id;
    
    // Add hide_matched filter
    if (hideMatched) params.hide_matched = true;
    
    const response = await api.get('/transactions/count', { params });
    return response.data;
};

// Fetch trigger
export const triggerFetch = async () => {
    const response = await api.post('/fetch');
    return response.data;
};

// Config
export const getConfig = async () => {
    const response = await api.get('/config');
    return response.data;
};

export const updateConfig = async (configData) => {
    const response = await api.post('/config', configData);
    return response.data;
};

// Set last date (zarážka)
export const setLastDate = async (daysBack = null) => {
    const response = await api.post('/set-last-date', { days_back: daysBack });
    return response.data;
};

// Delete all transactions
export const deleteAllTransactions = async () => {
    const response = await api.delete('/transactions');
    return response.data;
};

// Matching data
export const uploadMatchingData = async (rows) => {
    const response = await api.post('/matching-data', { rows });
    return response.data;
};

export const getMatchingData = async () => {
    const response = await api.get('/matching-data');
    return response.data;
};

export const getMatchingStats = async () => {
    const response = await api.get('/matching-data/stats');
    return response.data;
};

export const deleteMatchingData = async () => {
    const response = await api.delete('/matching-data');
    return response.data;
};

// Fetch matching data from external URL
export const fetchMatchingDataFromUrl = async (url) => {
    // Fetch from external URL (not through our API proxy)
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch matching data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
};

export default api;
