import useAppStore from '../store/useAppStore';

function FetchControl() {
    const {
        isConnected,
        isFetching,
        canFetch,
        countdown,
        messages,
        triggerFetchAction,
        clearMessages,
    } = useAppStore();

    return (
        <div>
            <h2 className="mb-lg">Fetch Control</h2>

            {/* Status Cards */}
            <div className="grid grid-2 mb-lg">
                <div className="card">
                    <div className="flex items-center gap-md">
                        <div
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: isConnected ? 'var(--success)' : 'var(--danger)',
                                boxShadow: isConnected ? '0 0 10px var(--success)' : 'none',
                            }}
                        />
                        <div>
                            <div className="text-sm text-secondary">WebSocket Status</div>
                            <div className="font-semibold">
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center gap-md">
                        {isFetching ? (
                            <div className="spinner"></div>
                        ) : (
                            <span style={{ fontSize: '1.5rem' }}>
                                {canFetch ? '✅' : '⏱️'}
                            </span>
                        )}
                        <div>
                            <div className="text-sm text-secondary">Fetch Status</div>
                            <div className="font-semibold">
                                {isFetching
                                    ? 'Fetching...'
                                    : canFetch
                                        ? 'Ready'
                                        : `Wait ${countdown}s`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fetch Control */}
            <div className="card mb-lg">
                <div className="card-header">
                    <h3>Manual Fetch</h3>
                </div>

                <div className="flex flex-col gap-md">
                    <p className="text-secondary">
                        Trigger a manual fetch of transactions from Fio Bank. The API enforces a
                        minimum 30-second interval between fetch requests.
                    </p>

                    <div className="flex gap-md">
                        <button
                            onClick={triggerFetchAction}
                            disabled={!canFetch || isFetching || !isConnected}
                            className="btn-primary"
                        >
                            {isFetching ? (
                                <>
                                    <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                                    Fetching...
                                </>
                            ) : (
                                <>
                                    <span>🔄</span>
                                    Fetch Transactions
                                </>
                            )}
                        </button>

                        {!canFetch && !isFetching && (
                            <div className="flex items-center gap-sm text-secondary">
                                <span>⏱️</span>
                                <span>Next fetch available in {countdown}s</span>
                            </div>
                        )}
                    </div>

                    {!isConnected && (
                        <div
                            className="badge badge-warning"
                            style={{
                                padding: 'var(--space-md)',
                                fontSize: '0.95rem',
                                display: 'block',
                            }}
                        >
                            ⚠️ WebSocket not connected. Reconnecting...
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Log */}
            <div className="card">
                <div className="card-header">
                    <div className="flex items-center justify-between">
                        <h3>Activity Log</h3>
                        <button onClick={clearMessages} className="btn-secondary" style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.875rem' }}>
                            Clear
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.875rem',
                    }}
                >
                    {messages.length === 0 ? (
                        <p className="text-secondary" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                            No activity yet
                        </p>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-sm)',
                                        borderLeft: `3px solid ${getMessageColor(msg.type)}`,
                                    }}
                                >
                                    <span className="text-tertiary" style={{ marginRight: 'var(--space-sm)' }}>
                                        [{msg.timestamp}]
                                    </span>
                                    <span>{msg.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getMessageColor(type) {
    switch (type) {
        case 'success':
            return 'var(--success)';
        case 'warning':
            return 'var(--warning)';
        case 'danger':
            return 'var(--danger)';
        default:
            return 'var(--primary-500)';
    }
}

export default FetchControl;
