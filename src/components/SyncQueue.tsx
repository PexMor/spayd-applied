import { useState, useEffect } from 'preact/hooks';
import { useI18n } from '../I18nContext';
import { getSyncQueue, resetSyncFlags, type SyncQueueItem } from '../db';
import {
    processSyncQueue,
    retryFailedItems,
    acknowledgeQueueItem,
} from '../services/sync-service';

export function SyncQueue() {
    const { t } = useI18n();
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
        if (confirm(t.resetAllFlagsConfirm)) {
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

    function getStatusLabel(status: SyncQueueItem['status']): string {
        switch (status) {
            case 'pending':
                return t.pending;
            case 'sent':
                return t.sent;
            case 'acked':
                return t.acknowledged;
            case 'failed':
                return t.failed;
            default:
                return status;
        }
    }

    const pendingCount = queueItems.filter((i) => i.status === 'pending').length;
    const failedCount = queueItems.filter((i) => i.status === 'failed').length;
    const ackedCount = queueItems.filter((i) => i.status === 'acked').length;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-lg">
                <h2>{t.syncQueue}</h2>
                <div className="flex gap-sm">
                    <button
                        className="btn btn-secondary"
                        onClick={handleRetryFailed}
                        disabled={isProcessing || failedCount === 0}
                    >
                        {t.retryFailed}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleProcessQueue}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="spinner"></div>
                                {t.processing}
                            </>
                        ) : (
                            t.processQueue
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-3 mb-lg">
                <div className="card">
                    <div className="text-sm text-secondary">{t.pending}</div>
                    <div className="text-2xl font-bold">{pendingCount}</div>
                </div>
                <div className="card">
                    <div className="text-sm text-secondary">{t.failed}</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>
                        {failedCount}
                    </div>
                </div>
                <div className="card">
                    <div className="text-sm text-secondary">{t.acknowledged}</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>
                        {ackedCount}
                    </div>
                </div>
            </div>

            {queueItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3>{t.noSyncItems}</h3>
                    <p>{t.noSyncItemsMessage}</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-md">
                        <h3>{t.queueItemsCount} ({queueItems.length})</h3>
                        <button className="btn btn-danger btn-sm" onClick={handleResetAll}>
                            {t.resetAllFlags}
                        </button>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>{t.paymentId}</th>
                                    <th>{t.status}</th>
                                    <th>{t.attempts}</th>
                                    <th>{t.created}</th>
                                    <th>{t.lastAttempt}</th>
                                    <th>{t.webhookUrl2}</th>
                                    <th>{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queueItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="font-mono text-sm">#{item.paymentId}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                                                {getStatusLabel(item.status)}
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
                                                    {t.acknowledge}
                                                </button>
                                            )}
                                            {item.status === 'failed' && item.error && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => alert(item.error)}
                                                >
                                                    {t.viewError}
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
