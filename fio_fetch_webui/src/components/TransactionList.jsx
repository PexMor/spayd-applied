import { useState, useEffect, useCallback, useMemo } from 'preact/hooks';
import { getTransactions, getTransactionsCount, getMatchingStats, getMatchingData } from '../services/api';
import useAppStore from '../store/useAppStore';
import MatchingDataUpload from './MatchingDataUpload';

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

function TransactionList() {
    const {
        transactions,
        transactionsLoading,
        transactionsPage,
        transactionsLimit,
        transactionsTotalCount,
        transactionsFilters,
        transactionsAppliedFilters,
        matchingData,
        matchingStats,
        hideMatchedTransactions,
        setTransactions,
        setTransactionsLoading,
        setTransactionsPage,
        setTransactionsTotalCount,
        setTransactionsFilters,
        setTransactionsAppliedFilters,
        clearTransactionsFilters,
        setMatchingStats,
        setMatchingData,
        setHideMatchedTransactions,
    } = useAppStore();

    const [selectedTx, setSelectedTx] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Debounce filter inputs (500ms delay)
    const debouncedFilters = useDebounce(transactionsFilters, 500);

    // Apply debounced filters when they change
    useEffect(() => {
        // Serialize filters for comparison
        const debouncedKey = JSON.stringify(debouncedFilters);
        const appliedKey = JSON.stringify(transactionsAppliedFilters);
        
        if (debouncedKey !== appliedKey) {
            setTransactionsAppliedFilters(debouncedFilters);
        }
    }, [debouncedFilters, transactionsAppliedFilters, setTransactionsAppliedFilters]);

    // Load transactions function
    const loadTransactions = useCallback(async () => {
        try {
            setTransactionsLoading(true);
            // Only include non-empty filters
            const activeFilters = Object.fromEntries(
                Object.entries(transactionsAppliedFilters).filter(([_, value]) => value.trim() !== '')
            );
            
            // Load transactions and count in parallel
            const [transactionsData, countData] = await Promise.all([
                getTransactions(transactionsPage * transactionsLimit, transactionsLimit, activeFilters),
                getTransactionsCount(activeFilters),
            ]);
            
            setTransactions(transactionsData);
            setTransactionsTotalCount(countData.count || 0);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    }, [transactionsPage, transactionsLimit, transactionsAppliedFilters, setTransactions, setTransactionsLoading, setTransactionsTotalCount]);

    // Load matching stats and data on mount
    useEffect(() => {
        const loadMatchingData = async () => {
            try {
                const [stats, data] = await Promise.all([getMatchingStats(), getMatchingData()]);
                setMatchingStats(stats);
                setMatchingData(data);
            } catch (error) {
                console.error('Failed to load matching data:', error);
            }
        };
        loadMatchingData();
    }, [setMatchingStats, setMatchingData]);

    // Load transactions when page or applied filters change
    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // Check if transaction is matched
    const isTransactionMatched = useCallback((tx) => {
        if (!matchingData || matchingData.length === 0) return false;

        return matchingData.some((entry) => {
            // Normalize values for comparison
            const entryVS = entry.variable_symbol ? String(entry.variable_symbol).trim() : '';
            const txVS = tx.variable_symbol ? String(tx.variable_symbol).trim() : '';
            const vsMatch = entryVS && txVS && entryVS === txVS;

            const entrySS = entry.specific_symbol ? String(entry.specific_symbol).trim() : '';
            const txSS = tx.specific_symbol ? String(tx.specific_symbol).trim() : '';
            const ssMatch = entrySS && txSS && entrySS === txSS;

            let ksMatch = true;
            if (entry.constant_symbol) {
                const entryKS = String(entry.constant_symbol).trim();
                const txKS = tx.constant_symbol ? String(tx.constant_symbol).trim() : '';
                ksMatch = txKS && entryKS === txKS;
            }

            return vsMatch && ssMatch && ksMatch;
        });
    }, [matchingData]);

    // Filter transactions based on hideMatchedTransactions
    const filteredTransactions = useMemo(() => {
        if (!hideMatchedTransactions || !matchingData || matchingData.length === 0) {
            return transactions;
        }
        return transactions.filter((tx) => !isTransactionMatched(tx));
    }, [transactions, hideMatchedTransactions, matchingData, isTransactionMatched]);

    const handleFilterChange = useCallback((field, value) => {
        setTransactionsFilters({ ...transactionsFilters, [field]: value });
        // Don't reset page here - let debounce handle it
    }, [transactionsFilters, setTransactionsFilters]);

    const clearFilters = useCallback(() => {
        clearTransactionsFilters();
    }, [clearTransactionsFilters]);

    const hasActiveFilters = useMemo(() => {
        return Object.values(transactionsFilters).some((value) => value.trim() !== '');
    }, [transactionsFilters]);

    const totalPages = useMemo(() => {
        return Math.ceil(transactionsTotalCount / transactionsLimit);
    }, [transactionsTotalCount, transactionsLimit]);

    return (
        <div>
            {/* Matching Data Upload - always show */}
            <MatchingDataUpload />

            {/* Matching Stats and Controls - only show when matching data exists */}
            {matchingStats && matchingStats.total_matching_rows > 0 && (
                <div className="card mb-lg" style={{ background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-secondary mb-xs">Matching Status</div>
                            <div className="font-bold text-lg">
                                {matchingStats.matched_transactions} / {matchingStats.total_transactions} transactions
                                matched
                            </div>
                            <div className="text-sm text-secondary mt-xs">
                                {matchingStats.total_matching_rows} matching row(s) loaded
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={hideMatchedTransactions}
                                onChange={(e) => setHideMatchedTransactions(e.target.checked)}
                            />
                            <span className="text-sm">Hide matched transactions</span>
                        </label>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-lg">
                <h2>
                    Transactions{' '}
                    {transactionsTotalCount > 0 && (
                        <span className="text-secondary text-sm font-normal">
                            ({hideMatchedTransactions && matchingStats ? filteredTransactions.length : transactionsTotalCount} total)
                        </span>
                    )}
                </h2>
                <div className="flex gap-md">
                    <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
                        <span>{showFilters ? '🔽' : '🔍'}</span>
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                        {hasActiveFilters && (
                            <span className="badge badge-primary" style={{ marginLeft: 'var(--space-xs)' }}>
                                ●
                            </span>
                        )}
                    </button>
                    <button onClick={loadTransactions} className="btn-secondary">
                        <span>🔄</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filter Panel - Separate component to prevent re-renders */}
            {showFilters && (
                <FilterPanel
                    filters={transactionsFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                />
            )}

            {/* Transaction List - Separate component that only re-renders when data changes */}
            <TransactionListContent
                transactions={filteredTransactions}
                loading={transactionsLoading}
                page={transactionsPage}
                totalPages={totalPages}
                totalCount={hideMatchedTransactions && matchingStats ? filteredTransactions.length : transactionsTotalCount}
                limit={transactionsLimit}
                onPageChange={setTransactionsPage}
                onSelectTransaction={setSelectedTx}
                isTransactionMatched={isTransactionMatched}
            />

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <TransactionDetailModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
            )}
        </div>
    );
}

// Separate Filter Panel component - only re-renders when filter inputs change
function FilterPanel({ filters, onFilterChange, onClearFilters, hasActiveFilters }) {
    return (
        <div className="card mb-lg animate-fade-in" style={{ background: 'var(--bg-secondary)' }}>
            <div className="card-header">
                <div className="flex items-center justify-between">
                    <h3>Filter Transactions</h3>
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="btn-secondary"
                            style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.875rem' }}
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-2 gap-md">
                <FilterInput
                    label="Variable Symbol (VS)"
                    value={filters.variable_symbol}
                    onChange={(value) => onFilterChange('variable_symbol', value)}
                    placeholder="e.g., 12345"
                />
                <FilterInput
                    label="Specific Symbol (SS)"
                    value={filters.specific_symbol}
                    onChange={(value) => onFilterChange('specific_symbol', value)}
                    placeholder="e.g., 67890"
                />
                <FilterInput
                    label="Constant Symbol (KS)"
                    value={filters.constant_symbol}
                    onChange={(value) => onFilterChange('constant_symbol', value)}
                    placeholder="e.g., 0308"
                />
                <FilterInput
                    label="Counter Account"
                    value={filters.counter_account}
                    onChange={(value) => onFilterChange('counter_account', value)}
                    placeholder="e.g., CZ6508000000192000145399"
                />
                <FilterInput
                    label="Counter Account Name"
                    value={filters.counter_account_name}
                    onChange={(value) => onFilterChange('counter_account_name', value)}
                    placeholder="e.g., John Doe"
                />
                <FilterInput
                    label="Bank Code"
                    value={filters.bank_code}
                    onChange={(value) => onFilterChange('bank_code', value)}
                    placeholder="e.g., 0800"
                />
                <FilterInput
                    label="Bank Name"
                    value={filters.bank_name}
                    onChange={(value) => onFilterChange('bank_name', value)}
                    placeholder="e.g., Česká spořitelna"
                />
                <FilterInput
                    label="Executor"
                    value={filters.executor}
                    onChange={(value) => onFilterChange('executor', value)}
                    placeholder="e.g., John Doe"
                />
                <FilterInput
                    label="Transaction ID"
                    value={filters.transaction_id}
                    onChange={(value) => onFilterChange('transaction_id', value)}
                    placeholder="e.g., 123456789"
                />
            </div>

            <div className="mt-md text-sm text-secondary">
                💡 <strong>Tip:</strong> All filters support substring matching (case-insensitive). Filters are applied
                automatically after you stop typing (500ms delay).
            </div>
        </div>
    );
}

// Separate Transaction List Content component - only re-renders when transactions/loading/page changes
function TransactionListContent({
    transactions,
    loading,
    page,
    totalPages,
    totalCount,
    limit,
    onPageChange,
    onSelectTransaction,
    isTransactionMatched,
}) {
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
            <div className="card">
                <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="text-secondary mt-md">Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
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
                                {transactions.map((tx) => {
                                    const isMatched = isTransactionMatched ? isTransactionMatched(tx) : false;
                                    return (
                                        <tr
                                            key={tx.id}
                                            style={{
                                                background: isMatched
                                                    ? 'linear-gradient(135deg, hsla(var(--success-hue), 70%, 50%, 0.1), hsla(var(--success-hue), 70%, 50%, 0.05))'
                                                    : 'transparent',
                                                borderLeft: isMatched ? '3px solid var(--success)' : 'none',
                                            }}
                                        >
                                            <td className="text-sm">
                                                {formatDate(tx.date)}
                                                {isMatched && (
                                                    <span className="badge badge-success" style={{ marginLeft: 'var(--space-xs)', fontSize: '0.75rem' }}>
                                                        ✓
                                                    </span>
                                                )}
                                            </td>
                                        <td>
                                            <div className="font-medium">{tx.counter_account_name || 'N/A'}</div>
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
                                                onClick={() => onSelectTransaction(tx)}
                                                className="btn-secondary"
                                                style={{
                                                    padding: 'var(--space-xs) var(--space-sm)',
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div
                        className="flex items-center justify-between mt-lg"
                        style={{
                            paddingTop: 'var(--space-lg)',
                            borderTop: '1px solid var(--border-color)',
                        }}
                    >
                        <button
                            onClick={() => onPageChange(Math.max(0, page - 1))}
                            disabled={page === 0 || loading}
                            className="btn-secondary"
                        >
                            ← Previous
                        </button>
                        <span className="text-secondary">
                            Page {page + 1} of {totalPages || 1} ({totalCount} total)
                        </span>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages - 1 || loading || transactions.length < limit}
                            className="btn-secondary"
                        >
                            Next →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// Separate Transaction Detail Modal component
function TransactionDetailModal({ transaction, onClose }) {
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

    return (
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
            onClick={onClose}
        >
            <div
                className="card animate-fade-in"
                style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="card-header">
                    <div className="flex items-center justify-between">
                        <h3>Transaction Details</h3>
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ padding: 'var(--space-xs) var(--space-sm)' }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-md">
                    <DetailRow label="Date" value={formatDate(transaction.date)} />
                    <DetailRow label="Amount" value={formatAmount(transaction.amount, transaction.currency)} />
                    <DetailRow label="Counter Account" value={transaction.counter_account} />
                    <DetailRow label="Counter Account Name" value={transaction.counter_account_name} />
                    <DetailRow label="Bank Code" value={transaction.bank_code} />
                    <DetailRow label="Bank Name" value={transaction.bank_name} />
                    <DetailRow label="Variable Symbol" value={transaction.variable_symbol} />
                    <DetailRow label="Constant Symbol" value={transaction.constant_symbol} />
                    <DetailRow label="Specific Symbol" value={transaction.specific_symbol} />
                    <DetailRow label="User Identification" value={transaction.user_identification} />
                    <DetailRow label="Message for Recipient" value={transaction.message_for_recipient} />
                    <DetailRow label="Type" value={transaction.type} />
                    <DetailRow label="Executor" value={transaction.executor} />
                    <DetailRow label="Specification" value={transaction.specification} />
                    <DetailRow label="Comment" value={transaction.comment} />
                    <DetailRow label="BIC" value={transaction.bic} />
                    <DetailRow label="Transaction ID" value={transaction.transaction_id} />
                </div>
            </div>
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

function FilterInput({ label, value, onChange, placeholder }) {
    return (
        <div>
            <label className="text-sm text-secondary mb-xs" style={{ display: 'block' }}>
                {label}
            </label>
            <input
                type="text"
                value={value}
                onInput={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                }}
            />
        </div>
    );
}

export default TransactionList;
