import { useState, useEffect } from 'preact/hooks';
import { getTransactions } from '../services/api';

function TransactionList() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [limit] = useState(50);
    const [selectedTx, setSelectedTx] = useState(null);

    useEffect(() => {
        loadTransactions();
    }, [page]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const data = await getTransactions(page * limit, limit);
            setTransactions(data);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('cs-CZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatAmount = (amount, currency = 'CZK') => {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
                <p className="text-secondary mt-md">Loading transactions...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-lg">
                <h2>Transactions</h2>
                <button onClick={loadTransactions} className="btn-secondary">
                    <span>🔄</span>
                    Refresh
                </button>
            </div>

            <div className="card">
                {transactions.length === 0 ? (
                    <p className="text-secondary" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                        No transactions found. Try fetching data from the Fetch tab.
                    </p>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Counter Party</th>
                                        <th>Account</th>
                                        <th>VS</th>
                                        <th>KS</th>
                                        <th>SS</th>
                                        <th>Amount</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id}>
                                            <td className="text-sm">{formatDate(tx.date)}</td>
                                            <td>
                                                <div className="font-medium">
                                                    {tx.counter_account_name || 'N/A'}
                                                </div>
                                                {tx.bank_name && (
                                                    <div className="text-sm text-secondary">{tx.bank_name}</div>
                                                )}
                                            </td>
                                            <td className="text-sm font-mono">
                                                {tx.counter_account || '-'}
                                                {tx.bank_code && `/${tx.bank_code}`}
                                            </td>
                                            <td className="text-sm">{tx.variable_symbol || '-'}</td>
                                            <td className="text-sm">{tx.constant_symbol || '-'}</td>
                                            <td className="text-sm">{tx.specific_symbol || '-'}</td>
                                            <td>
                                                <span
                                                    className="font-semibold"
                                                    style={{
                                                        color: tx.amount >= 0 ? 'var(--success)' : 'var(--danger)',
                                                    }}
                                                >
                                                    {formatAmount(tx.amount, tx.currency)}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="btn-secondary"
                                                    style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.875rem' }}
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-lg" style={{ paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)' }}>
                            <button
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0}
                                className="btn-secondary"
                            >
                                ← Previous
                            </button>
                            <span className="text-secondary">Page {page + 1}</span>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={transactions.length < limit}
                                className="btn-secondary"
                            >
                                Next →
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--space-lg)',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedTx(null)}
                >
                    <div
                        className="card animate-fade-in"
                        style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="card-header">
                            <div className="flex items-center justify-between">
                                <h3>Transaction Details</h3>
                                <button onClick={() => setSelectedTx(null)} className="btn-secondary" style={{ padding: 'var(--space-xs) var(--space-sm)' }}>
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-md">
                            <DetailRow label="Date" value={formatDate(selectedTx.date)} />
                            <DetailRow label="Amount" value={formatAmount(selectedTx.amount, selectedTx.currency)} />
                            <DetailRow label="Counter Account" value={selectedTx.counter_account} />
                            <DetailRow label="Counter Account Name" value={selectedTx.counter_account_name} />
                            <DetailRow label="Bank Code" value={selectedTx.bank_code} />
                            <DetailRow label="Bank Name" value={selectedTx.bank_name} />
                            <DetailRow label="Variable Symbol" value={selectedTx.variable_symbol} />
                            <DetailRow label="Constant Symbol" value={selectedTx.constant_symbol} />
                            <DetailRow label="Specific Symbol" value={selectedTx.specific_symbol} />
                            <DetailRow label="User Identification" value={selectedTx.user_identification} />
                            <DetailRow label="Message for Recipient" value={selectedTx.message_for_recipient} />
                            <DetailRow label="Type" value={selectedTx.type} />
                            <DetailRow label="Executor" value={selectedTx.executor} />
                            <DetailRow label="Specification" value={selectedTx.specification} />
                            <DetailRow label="Comment" value={selectedTx.comment} />
                            <DetailRow label="BIC" value={selectedTx.bic} />
                            <DetailRow label="Transaction ID" value={selectedTx.transaction_id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }) {
    if (!value) return null;

    return (
        <div>
            <div className="text-sm text-secondary mb-xs">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}

export default TransactionList;
