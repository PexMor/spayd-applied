import { Account } from '../components/BatchAccountManager';
import { EventConfig } from '../components/BatchEventManager';

const DB_NAME = 'SpaydBatchApp';
const DB_VERSION = 1;
const ACCOUNTS_STORE = 'accounts';
const EVENTS_STORE = 'events';

let db: IDBDatabase | null = null;

export async function initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Create accounts store
            if (!database.objectStoreNames.contains(ACCOUNTS_STORE)) {
                database.createObjectStore(ACCOUNTS_STORE, { keyPath: 'id' });
            }

            // Create events store
            if (!database.objectStoreNames.contains(EVENTS_STORE)) {
                database.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
            }
        };
    });
}

// Accounts
export async function saveAccounts(accounts: Account[]): Promise<void> {
    if (!db) await initDB();
    const tx = db!.transaction(ACCOUNTS_STORE, 'readwrite');
    const store = tx.objectStore(ACCOUNTS_STORE);
    
    // Clear existing
    await store.clear();
    
    // Add all
    for (const account of accounts) {
        await store.put(account);
    }
}

export async function loadAccounts(): Promise<Account[]> {
    if (!db) await initDB();
    const tx = db!.transaction(ACCOUNTS_STORE, 'readonly');
    const store = tx.objectStore(ACCOUNTS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Events
export async function saveEvents(events: EventConfig[]): Promise<void> {
    if (!db) await initDB();
    const tx = db!.transaction(EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(EVENTS_STORE);
    
    // Clear existing
    await store.clear();
    
    // Add all
    for (const event of events) {
        await store.put(event);
    }
}

export async function loadEvents(): Promise<EventConfig[]> {
    if (!db) await initDB();
    const tx = db!.transaction(EVENTS_STORE, 'readonly');
    const store = tx.objectStore(EVENTS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}
