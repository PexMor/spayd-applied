import { useState, useEffect } from 'preact/hooks';
import { getSyncQueue, resetSyncFlags, type SyncQueueItem } from '../db';
import {
    processSyncQueue,
    retryFailedItems,
    acknowledgeQueueItem,
} from '../services/sync-service';

export function SyncQueue() {
    const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadQueue();
        // Refresh every 10 seconds
        const interval = setInterval(loadQueue, 10000);
        return () => clearInterval(interval);
    }, []);

    async function loadQueue() {
        const items = await getSyncQueue();
        setQueueItems(items);
    }

    async function handleProcessQueue() {
        setIsProcessing(true);
        try {
            await processSyncQueue();
            await loadQueue();
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleRetryFailed() {
        setIsProcessing(true);
        try {
            await retryFailedItems(3);
            await loadQueue();
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleResetAll() {
        if (confirm('Reset all sync flags? This will mark all items as pending.')) {
            await resetSyncFlags({ global: true });
            await loadQueue();
        }
    }

    async function handleAcknowledge(itemId: number) {
        await acknowledgeQueueItem(itemId);
        await loadQueue();
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }

    function getStatusBadgeClass(status: SyncQueueItem['status']): string {
        switch (status) {
            case 'pending':
                return 'badge-pending';
            case 'sent':
                return 'badge-sent';
            case 'acked':
                return 'badge-acked';
            case 'failed':
                return 'badge-failed';
            default:
                return '';
        }
    }

    const pendingCount = queueItems.filter((i) => i.status === 'pending').length;
    const failedCount = queueItems.filter((i) => i.status === 'failed').length;
    const ackedCount = queueItems.filter((i) => i.status === 'acked').length;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-lg">
                <h2>Sync Queue</h2>
                <div className="flex gap-sm">
                    <button
                        className="btn btn-secondary"
                        onClick={handleRetryFailed}
                        disabled={isProcessing || failedCount === 0}
                    >
                        🔄 Retry Failed
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleProcessQueue}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="spinner"></div>
                                Processing...
                            </>
                        ) : (
                            '▶️ Process Queue'
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-3 mb-lg">
                <div className="card">
                    <div className="text-sm text-secondary">Pending</div>
                    <div className="text-2xl font-bold">{pendingCount}</div>
                </div>
                <div className="card">
                    <div className="text-sm text-secondary">Failed</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>
                        {failedCount}
                    </div>
                </div>
                <div className="card">
                    <div className="text-sm text-secondary">Acknowledged</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                        {ackedCount}
                    </div>
                </div>
            </div>

            {queueItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3>No sync items</h3>
                    <p>Generated payments will appear here if webhooks are configured</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-md">
                        <h3>Queue Items ({queueItems.length})</h3>
                        <button className="btn btn-danger btn-sm" onClick={handleResetAll}>
                            Reset All Flags
                        </button>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>Status</th>
                                    <th>Attempts</th>
                                    <th>Created</th>
                                    <th>Last Attempt</th>
                                    <th>Webhook URL</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queueItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="font-mono text-sm">#{item.paymentId}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>{item.attempts}</td>
                                        <td className="text-sm">{formatDate(item.createdAt)}</td>
                                        <td className="text-sm">
                                            {item.lastAttempt ? formatDate(item.lastAttempt) : '-'}
                                        </td>
                                        <td className="text-sm" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.webhookUrl}
                                        </td>
                                        <td>
                                            {item.status === 'sent' && (
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleAcknowledge(item.id!)}
                                                >
                                                    ✓ Ack
                                                </button>
                                            )}
                                            {item.status === 'failed' && item.error && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => alert(item.error)}
                                                >
                                                    View Error
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
