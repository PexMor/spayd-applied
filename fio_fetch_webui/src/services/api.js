import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Transactions
export const getTransactions = async (skip = 0, limit = 100) => {
    const response = await api.get('/transactions', {
        params: { skip, limit },
    });
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

export default api;
