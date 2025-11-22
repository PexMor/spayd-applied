// IndexedDB wrapper for SPAYD application

// Type definitions
export interface Account {
  id?: number;
  name: string;
  iban: string;
  currency: string;
  webhookUrl?: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Event {
  id?: number;
  name: string;
  staticSymbol: string;
  vsMode: 'counter' | 'time' | 'static';
  vsCounter: number;
  vsStaticValue?: string;
  permanentAmount?: number;
  message?: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id?: number;
  accountId: number;
  eventId: number;
  amount: number;
  currency: string;
  variableSymbol: string;
  staticSymbol: string;
  message?: string;
  spaydString: string;
  qrCodeDataUrl: string;
  createdAt: number;
}

export interface SyncQueueItem {
  id?: number;
  paymentId: number;
  webhookUrl: string;
  payload: any;
  status: 'pending' | 'sent' | 'acked' | 'failed';
  attempts: number;
  lastAttempt?: number;
  ackedAt?: number;
  error?: string;
  createdAt: number;
}

export interface Settings {
  language?: 'cs' | 'en' | 'auto';
  theme?: 'light' | 'dark' | 'auto';
  webhookUrl?: string;
  immediateSync?: boolean;
}

// Database instance holder
let dbInstance: IDBDatabase | null = null;

import * as sampleDataImport from './data/sample-data.json';
const sampleData = sampleDataImport as any;

/**
 * Initialize the IndexedDB database with schema
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const DB_NAME = 'spayd-db';
  const DB_VERSION = 4; // Incremented to move webhook URL to global settings

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      // Create accounts store
      if (!db.objectStoreNames.contains('accounts')) {
        const accountStore = db.createObjectStore('accounts', {
          keyPath: 'id',
          autoIncrement: true,
        });
        accountStore.createIndex('isDefault', 'isDefault', { unique: false });
      }

      // Create events store
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', {
          keyPath: 'id',
          autoIncrement: true,
        });
        eventStore.createIndex('isDefault', 'isDefault', { unique: false });
      }

      // Create payments store
      if (!db.objectStoreNames.contains('payments')) {
        const paymentStore = db.createObjectStore('payments', {
          keyPath: 'id',
          autoIncrement: true,
        });
        paymentStore.createIndex('accountId', 'accountId', { unique: false });
        paymentStore.createIndex('eventId', 'eventId', { unique: false });
        paymentStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create syncQueue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('paymentId', 'paymentId', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }

      // Create settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Migration for version 4: Move webhook URL from accounts to global settings
      if (event.oldVersion < 4 && transaction) {
        const accountStore = transaction.objectStore('accounts');
        const settingsStore = transaction.objectStore('settings');
        
        const request = accountStore.getAll();
        request.onsuccess = () => {
          const accounts = request.result as Account[];
          // Find the first account with a webhook URL
          const accountWithWebhook = accounts.find(a => a.webhookUrl);
          
          if (accountWithWebhook && accountWithWebhook.webhookUrl) {
            console.log('[DB] Migrating webhook URL to global settings:', accountWithWebhook.webhookUrl);
            settingsStore.put({ key: 'webhookUrl', value: accountWithWebhook.webhookUrl });
          }
        };
      }
    };
  });
}

/**
 * Generic helper to get all items from a store
 */
async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to get a single item by ID
 */
async function getById<T>(storeName: string, id: number): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to add an item
 */
async function add<T>(storeName: string, item: T): Promise<number> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to update an item
 */
async function update<T>(storeName: string, item: T): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to delete an item
 */
async function deleteItem(storeName: string, id: number): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// Account CRUD operations
// ============================================================================

export async function getAccounts(): Promise<Account[]> {
  return getAll<Account>('accounts');
}

export async function getAccount(id: number): Promise<Account | undefined> {
  return getById<Account>('accounts', id);
}

export async function addAccount(account: Omit<Account, 'id'>): Promise<number> {
  return add<Account>('accounts', account as Account);
}

export async function updateAccount(account: Account): Promise<void> {
  if (!account.id) {
    throw new Error('Account ID is required for update');
  }
  account.updatedAt = Date.now();
  return update<Account>('accounts', account);
}

export async function deleteAccount(id: number): Promise<void> {
  return deleteItem('accounts', id);
}

// ============================================================================
// Event CRUD operations
// ============================================================================

export async function getEvents(): Promise<Event[]> {
  return getAll<Event>('events');
}

export async function getEvent(id: number): Promise<Event | undefined> {
  return getById<Event>('events', id);
}

export async function addEvent(event: Omit<Event, 'id'>): Promise<number> {
  return add<Event>('events', event as Event);
}

export async function updateEvent(event: Event): Promise<void> {
  if (!event.id) {
    throw new Error('Event ID is required for update');
  }
  event.updatedAt = Date.now();
  return update<Event>('events', event);
}

export async function deleteEvent(id: number): Promise<void> {
  return deleteItem('events', id);
}

// ============================================================================
// Payment CRUD operations
// ============================================================================

export async function getPayments(filters?: {
  accountId?: number;
  eventId?: number;
}): Promise<Payment[]> {
  console.log('[DB] Getting payments with filters', filters);
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('payments', 'readonly');
    const store = transaction.objectStore('payments');
    
    let request: IDBRequest;
    
    if (filters?.accountId) {
      const index = store.index('accountId');
      request = index.getAll(filters.accountId);
    } else if (filters?.eventId) {
      const index = store.index('eventId');
      request = index.getAll(filters.eventId);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => {
      let results = request.result;
      
      // Apply additional filters if needed
      if (filters?.accountId && filters?.eventId) {
        results = results.filter(
          (p: Payment) => p.accountId === filters.accountId && p.eventId === filters.eventId
        );
      }
      
      // Sort by createdAt descending (newest first)
      results.sort((a: Payment, b: Payment) => b.createdAt - a.createdAt);
      
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPayment(id: number): Promise<Payment | undefined> {
  return getById<Payment>('payments', id);
}

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<number> {
  console.log('[DB] Adding payment to IndexedDB', payment);
  const id = await add<Payment>('payments', payment as Payment);
  console.log('[DB] Payment added with ID:', id);
  return id;
}

export async function updatePayment(payment: Payment): Promise<void> {
  if (!payment.id) {
    throw new Error('Payment ID is required for update');
  }
  return update<Payment>('payments', payment);
}

export async function deletePayment(id: number): Promise<void> {
  return deleteItem('payments', id);
}

// ============================================================================
// Sync Queue operations
// ============================================================================

export async function getSyncQueue(statusFilter?: SyncQueueItem['status']): Promise<SyncQueueItem[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readonly');
    const store = transaction.objectStore('syncQueue');
    
    let request: IDBRequest;
    
    if (statusFilter) {
      const index = store.index('status');
      request = index.getAll(statusFilter);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
  return add<SyncQueueItem>('syncQueue', item as SyncQueueItem);
}

export async function updateSyncStatus(
  id: number,
  status: SyncQueueItem['status'],
  error?: string
): Promise<void> {
  const item = await getById<SyncQueueItem>('syncQueue', id);
  if (!item) {
    throw new Error('Sync queue item not found');
  }

  item.status = status;
  item.lastAttempt = Date.now();
  item.attempts = (item.attempts || 0) + 1;
  
  if (status === 'acked') {
    item.ackedAt = Date.now();
  }
  
  if (error) {
    item.error = error;
  }

  return update<SyncQueueItem>('syncQueue', item);
}

export async function resetSyncFlags(options?: {
  fromPaymentId?: number;
  global?: boolean;
}): Promise<void> {
  const items = await getSyncQueue();
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readwrite');
    const store = transaction.objectStore('syncQueue');

    let itemsToReset = items;
    
    if (options?.fromPaymentId && !options.global) {
      // Find the payment's createdAt timestamp
      getById<Payment>('payments', options.fromPaymentId).then((payment) => {
        if (payment) {
          // Reset items for payments created at or after this payment
          itemsToReset = items.filter((item) => {
            return item.createdAt >= payment.createdAt;
          });
          
          resetItems(store, itemsToReset, resolve, reject);
        }
      });
    } else {
      resetItems(store, itemsToReset, resolve, reject);
    }
  });
}

function resetItems(
  store: IDBObjectStore,
  items: SyncQueueItem[],
  resolve: () => void,
  reject: (error: any) => void
) {
  items.forEach((item) => {
    item.status = 'pending';
    item.attempts = 0;
    item.lastAttempt = undefined;
    item.ackedAt = undefined;
    item.error = undefined;

    const request = store.put(item);
    request.onerror = () => reject(request.error);
  });

  resolve();
}

// ============================================================================
// Settings operations
// ============================================================================

export async function getSetting<T = any>(key: string): Promise<T | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : undefined);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function setSetting<T = any>(key: string, value: T): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put({ key, value });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSettings(): Promise<Settings> {
  const language = await getSetting<Settings['language']>('language');
  const theme = await getSetting<Settings['theme']>('theme');
  return { language, theme };
}

// ============================================================================
// Sample Data Initialization
// ============================================================================

/**
 * Initialize database with sample data if empty
 * Called on app startup to help users get started quickly
 */
export async function initializeWithSampleData(locale: 'cs' | 'en' = 'en'): Promise<void> {
  console.log('[DB] Adding sample data for locale:', locale);

  const now = Date.now();
  
  const localeData = sampleData[locale];
  if (!localeData) {
    console.error('[DB] Sample data not found for locale:', locale);
    return;
  }

  // Get existing accounts and events to check for conflicts
  const existingAccounts = await getAccounts();
  const existingEvents = await getEvents();

  let accountsAdded = 0;
  let accountsSkipped = 0;
  let eventsAdded = 0;
  let eventsSkipped = 0;

  // Add sample accounts that don't conflict (by IBAN)
  for (const accountData of localeData.accounts) {
    const exists = existingAccounts.some(a => a.iban === accountData.iban);
    if (!exists) {
      try {
        await addAccount({
          ...accountData,
          createdAt: now,
          updatedAt: now,
        } as Account);
        accountsAdded++;
        console.log('[DB] Added sample account:', accountData.name);
      } catch (err) {
        console.log('[DB] Failed to add sample account (conflict?):', accountData.name, err);
        accountsSkipped++;
      }
    } else {
      console.log('[DB] Skipping existing account (IBAN exists):', accountData.name);
      accountsSkipped++;
    }
  }

  // Add sample events that don't conflict (by static symbol)
  for (const eventData of localeData.events) {
    const exists = existingEvents.some(e => e.staticSymbol === eventData.staticSymbol);
    if (!exists) {
      try {
        await addEvent({
          ...eventData,
          vsCounter: eventData.vsCounter || 1,
          createdAt: now,
          updatedAt: now,
        } as Event);
        eventsAdded++;
        console.log('[DB] Added sample event:', eventData.name);
      } catch (err) {
        console.log('[DB] Failed to add sample event (conflict?):', eventData.name, err);
        eventsSkipped++;
      }
    } else {
      console.log('[DB] Skipping existing event (static symbol exists):', eventData.name);
      eventsSkipped++;
    }
  }

  console.log(`[DB] Sample data complete: ${accountsAdded} accounts added (${accountsSkipped} skipped), ${eventsAdded} events added (${eventsSkipped} skipped)`);
}
