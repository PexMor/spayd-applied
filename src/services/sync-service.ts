import {
  getSyncQueue,
  updateSyncStatus,
  type SyncQueueItem,
} from '../db';

/**
 * Process pending items in the sync queue
 */
export async function processSyncQueue(): Promise<void> {
  const pendingItems = await getSyncQueue('pending');
  const failedItems = await getSyncQueue('failed');

  // Process pending items
  for (const item of pendingItems) {
    await sendPaymentNotification(item);
  }

  // Retry failed items (up to 3 attempts)
  for (const item of failedItems) {
    if (item.attempts < 3) {
      await sendPaymentNotification(item);
    }
  }
}

/**
 * Send payment notification to webhook URL
 */
export async function sendPaymentNotification(
  queueItem: SyncQueueItem
): Promise<void> {
  if (!queueItem.id) {
    throw new Error('Queue item ID is required');
  }

  try {
    const response = await fetch(queueItem.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queueItem.payload),
    });

    if (response.ok) {
      // Check if backend sends acknowledgment in response
      const responseData = await response.json().catch(() => ({}));
      
      if (responseData.acknowledged || response.status === 200) {
        await updateSyncStatus(queueItem.id, 'acked');
      } else {
        await updateSyncStatus(queueItem.id, 'sent');
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateSyncStatus(queueItem.id, 'failed', errorMessage);
  }
}

/**
 * Manually acknowledge a sync queue item
 */
export async function acknowledgeQueueItem(queueItemId: number): Promise<void> {
  await updateSyncStatus(queueItemId, 'acked');
}

/**
 * Retry failed sync queue items
 */
export async function retryFailedItems(maxAttempts: number = 3): Promise<void> {
  const failedItems = await getSyncQueue('failed');
  
  for (const item of failedItems) {
    if (item.attempts < maxAttempts) {
      await sendPaymentNotification(item);
    }
  }
}

/**
 * Get sync status for a specific payment
 */
export async function getPaymentSyncStatus(
  paymentId: number
): Promise<SyncQueueItem | undefined> {
  const allItems = await getSyncQueue();
  return allItems.find((item) => item.paymentId === paymentId);
}

/**
 * Start background sync processing (call this on app initialization)
 */
export function startBackgroundSync(intervalMs: number = 30000): number {
  // Process queue immediately
  processSyncQueue().catch(console.error);
  
  // Then process every intervalMs (default 30 seconds)
  return window.setInterval(() => {
    processSyncQueue().catch(console.error);
  }, intervalMs);
}

/**
 * Stop background sync processing
 */
export function stopBackgroundSync(intervalId: number): void {
  clearInterval(intervalId);
}
