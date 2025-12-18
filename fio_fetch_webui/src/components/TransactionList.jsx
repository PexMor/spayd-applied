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
    const [showMatchingUpload, setShowMatchingUpload] = useState(false);

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

    // Load transactions function - uses backend filtering for hide_matched
    const loadTransactions = useCallback(async () => {
        try {
            setTransactionsLoading(true);
            // Only include non-empty filters
            const activeFilters = Object.fromEntries(
                Object.entries(transactionsAppliedFilters).filter(([_, value]) => value.trim() !== '')
            );
            
            // Load transactions and count in parallel, passing hideMatchedTransactions to backend
            const [transactionsData, countData] = await Promise.all([
                getTransactions(transactionsPage * transactionsLimit, transactionsLimit, activeFilters, hideMatchedTransactions),
                getTransactionsCount(activeFilters, hideMatchedTransactions),
            ]);
            
            setTransactions(transactionsData);
            setTransactionsTotalCount(countData.count || 0);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setTransactionsLoading(false);
        }
    }, [transactionsPage, transactionsLimit, transactionsAppliedFilters, hideMatchedTransactions, setTransactions, setTransactionsLoading, setTransactionsTotalCount]);

    // Load matching stats and data on mount
    useEffect(() => {
        const loadMatchingData = async () => {
            try {
                const [stats, data] = await Promise.all([getMatchingStats(), getMatchingData()]);
                console.log('[Matching] Stats from backend:', stats);
                console.log('[Matching] Data entries:', data?.length, data);
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

    // Helper to normalize symbol values - treats null, undefined, empty, "-", "null" as empty
    const normalizeSymbol = useCallback((value) => {
        if (value === null || value === undefined) return '';
        const str = String(value).trim();
        // Treat "-", "null", "undefined", "N/A" as empty values
        if (str === '' || str === '-' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'n/a') {
            return '';
        }
        return str;
    }, []);

    // Check if transaction is matched (used for display purposes - backend handles actual filtering)
    const isTransactionMatched = useCallback((tx) => {
        if (!matchingData || matchingData.length === 0) return false;

        return matchingData.some((entry) => {
            // Normalize values for comparison
            const entryVS = normalizeSymbol(entry.variable_symbol);
            const txVS = normalizeSymbol(tx.variable_symbol);
            
            const entrySS = normalizeSymbol(entry.specific_symbol);
            const txSS = normalizeSymbol(tx.specific_symbol);
            
            // Skip entries that don't have both VS and SS (required for matching)
            if (!entryVS || !entrySS) {
                return false;
            }
            
            // Transaction must have both VS and SS to be considered for matching
            if (!txVS || !txSS) {
                return false;
            }
            
            // VS and SS must both match exactly
            const vsMatch = entryVS === txVS;
            const ssMatch = entrySS === txSS;

            // KS is optional - only check if matching entry specifies it
            let ksMatch = true;
            const entryKS = normalizeSymbol(entry.constant_symbol);
            if (entryKS) {
                const txKS = normalizeSymbol(tx.constant_symbol);
                ksMatch = txKS && entryKS === txKS;
            }

            return vsMatch && ssMatch && ksMatch;
        });
    }, [matchingData, normalizeSymbol]);

    // Transactions are now filtered by the backend when hideMatchedTransactions is true
    // No client-side filtering needed - backend returns already filtered data
    const filteredTransactions = transactions;

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
        <div className="transaction-list-container">
            {/* Header with title and action buttons */}
            <div className="tx-header">
                <h2 className="tx-title">
                    Transactions
                    {transactionsTotalCount > 0 && (
                        <span className="tx-count">
                            ({hideMatchedTransactions && matchingStats ? filteredTransactions.length : transactionsTotalCount})
                        </span>
                    )}
                </h2>
                <div className="tx-actions">
                    <button 
                        onClick={() => setShowMatchingUpload(!showMatchingUpload)} 
                        className={`btn-icon ${showMatchingUpload ? 'active' : ''}`}
                        title="Matching data"
                    >
                        <span>📁</span>
                        {matchingStats && matchingStats.total_matching_rows > 0 && (
                            <span className="badge-dot" />
                        )}
                    </button>
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`btn-icon ${showFilters ? 'active' : ''}`}
                        title="Filters"
                    >
                        <span>{showFilters ? '🔽' : '🔍'}</span>
                        {hasActiveFilters && <span className="badge-dot active" />}
                    </button>
                    <button onClick={loadTransactions} className="btn-icon" title="Refresh">
                        <span>🔄</span>
                    </button>
                </div>
            </div>

            {/* Matching Data Upload (collapsible) */}
            {showMatchingUpload && (
                <div className="animate-fade-in">
                    <MatchingDataUpload />
                </div>
            )}

            {/* Matching Stats and Controls - only show when matching data exists */}
            {matchingStats && matchingStats.total_matching_rows > 0 && !showMatchingUpload && (
                <div className="matching-summary">
                    <div className="matching-info">
                        <span className="matching-badge">
                            ✓ {matchingStats.matched_transactions}/{matchingStats.total_transactions}
                        </span>
                        <span className="text-sm text-secondary">matched</span>
                    </div>
                    <label className="hide-matched-toggle">
                        <input
                            type="checkbox"
                            checked={hideMatchedTransactions}
                            onChange={(e) => setHideMatchedTransactions(e.target.checked)}
                        />
                        <span>Hide matched</span>
                    </label>
                </div>
            )}

            {/* Filter Panel */}
            {showFilters && (
                <FilterPanel
                    filters={transactionsFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                />
            )}

            {/* Transaction List Content */}
            <TransactionListContent
                transactions={filteredTransactions}
                loading={transactionsLoading}
                page={transactionsPage}
                totalPages={totalPages}
                totalCount={transactionsTotalCount}
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

// Filter Panel component
function FilterPanel({ filters, onFilterChange, onClearFilters, hasActiveFilters }) {
    return (
        <div className="filter-panel animate-fade-in">
            <div className="filter-header">
                <h3>Filter Transactions</h3>
                {hasActiveFilters && (
                    <button onClick={onClearFilters} className="btn-text-sm">
                        Clear All
                    </button>
                )}
            </div>

            <div className="filter-grid">
                <FilterInput
                    label="Variable Symbol"
                    value={filters.variable_symbol}
                    onChange={(value) => onFilterChange('variable_symbol', value)}
                    placeholder="VS"
                />
                <FilterInput
                    label="Specific Symbol"
                    value={filters.specific_symbol}
                    onChange={(value) => onFilterChange('specific_symbol', value)}
                    placeholder="SS"
                />
                <FilterInput
                    label="Constant Symbol"
                    value={filters.constant_symbol}
                    onChange={(value) => onFilterChange('constant_symbol', value)}
                    placeholder="KS"
                />
                <FilterInput
                    label="Counter Account"
                    value={filters.counter_account}
                    onChange={(value) => onFilterChange('counter_account', value)}
                    placeholder="Account"
                />
                <FilterInput
                    label="Account Name"
                    value={filters.counter_account_name}
                    onChange={(value) => onFilterChange('counter_account_name', value)}
                    placeholder="Name"
                />
                <FilterInput
                    label="Bank Code"
                    value={filters.bank_code}
                    onChange={(value) => onFilterChange('bank_code', value)}
                    placeholder="Code"
                />
                <FilterInput
                    label="Bank Name"
                    value={filters.bank_name}
                    onChange={(value) => onFilterChange('bank_name', value)}
                    placeholder="Bank"
                />
                <FilterInput
                    label="Executor"
                    value={filters.executor}
                    onChange={(value) => onFilterChange('executor', value)}
                    placeholder="Executor"
                />
                <FilterInput
                    label="Transaction ID"
                    value={filters.transaction_id}
                    onChange={(value) => onFilterChange('transaction_id', value)}
                    placeholder="ID"
                />
            </div>

            <p className="filter-hint">
                💡 Filters are applied automatically (500ms delay)
            </p>
        </div>
    );
}

// Transaction List Content component
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
            day: 'numeric',
            month: 'short',
            year: 'numeric',
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
            <div className="tx-loading">
                <div className="spinner spinner-lg" />
                <p>Loading transactions...</p>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="tx-empty">
                <p>No transactions found.</p>
                <p className="text-sm">Try fetching data or adjusting your filters.</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table View */}
            <div className="tx-table-wrapper">
                <table className="tx-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Counter Party</th>
                            <th className="hide-mobile">Account</th>
                            <th>VS</th>
                            <th className="hide-mobile">KS</th>
                            <th className="hide-mobile">SS</th>
                            <th>Amount</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => {
                            const isMatched = isTransactionMatched ? isTransactionMatched(tx) : false;
                            return (
                                <tr key={tx.id} className={isMatched ? 'matched' : ''}>
                                    <td className="tx-date">
                                        {formatDate(tx.date)}
                                        {isMatched && <span className="match-indicator">✓</span>}
                                    </td>
                                    <td className="tx-party">
                                        <div className="party-name">{tx.counter_account_name || 'N/A'}</div>
                                        {tx.bank_name && (
                                            <div className="party-bank">{tx.bank_name}</div>
                                        )}
                                    </td>
                                    <td className="tx-account hide-mobile">
                                        {tx.counter_account || '-'}
                                        {tx.bank_code && `/${tx.bank_code}`}
                                    </td>
                                    <td className="tx-symbol">{tx.variable_symbol || '-'}</td>
                                    <td className="tx-symbol hide-mobile">{tx.constant_symbol || '-'}</td>
                                    <td className="tx-symbol hide-mobile">{tx.specific_symbol || '-'}</td>
                                    <td className="tx-amount">
                                        <span className={tx.amount >= 0 ? 'positive' : 'negative'}>
                                            {formatAmount(tx.amount, tx.currency)}
                                        </span>
                                    </td>
                                    <td className="tx-actions-cell">
                                        <button
                                            onClick={() => onSelectTransaction(tx)}
                                            className="btn-details"
                                        >
                                            •••
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="tx-cards">
                {transactions.map((tx) => {
                    const isMatched = isTransactionMatched ? isTransactionMatched(tx) : false;
                    return (
                        <div 
                            key={tx.id} 
                            className={`tx-card ${isMatched ? 'matched' : ''}`}
                            onClick={() => onSelectTransaction(tx)}
                        >
                            <div className="tx-card-header">
                                <span className="tx-card-date">
                                    {formatDate(tx.date)}
                                    {isMatched && <span className="match-indicator">✓</span>}
                                </span>
                                <span className={`tx-card-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                                    {formatAmount(tx.amount, tx.currency)}
                                </span>
                            </div>
                            <div className="tx-card-party">{tx.counter_account_name || 'N/A'}</div>
                            {tx.bank_name && (
                                <div className="tx-card-bank">{tx.bank_name}</div>
                            )}
                            <div className="tx-card-symbols">
                                {tx.variable_symbol && <span>VS: {tx.variable_symbol}</span>}
                                {tx.specific_symbol && <span>SS: {tx.specific_symbol}</span>}
                                {tx.constant_symbol && <span>KS: {tx.constant_symbol}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            <div className="tx-pagination">
                <button
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0 || loading}
                    className="btn-pagination"
                >
                    ← Prev
                </button>
                <span className="pagination-info">
                    {page + 1} / {totalPages || 1}
                </span>
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages - 1 || loading || transactions.length < limit}
                    className="btn-pagination"
                >
                    Next →
                </button>
            </div>
        </>
    );
}

// Transaction Detail Modal component
function TransactionDetailModal({ transaction, onClose }) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

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
        <div className="tx-modal-overlay" onClick={onClose}>
            <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tx-modal-header">
                    <h3>Transaction Details</h3>
                    <button onClick={onClose} className="tx-modal-close">✕</button>
                </div>

                <div className="tx-modal-content">
                    <DetailRow label="Date" value={formatDate(transaction.date)} />
                    <DetailRow 
                        label="Amount" 
                        value={formatAmount(transaction.amount, transaction.currency)} 
                        className={transaction.amount >= 0 ? 'positive' : 'negative'}
                    />
                    <DetailRow label="Counter Account" value={transaction.counter_account} mono />
                    <DetailRow label="Counter Account Name" value={transaction.counter_account_name} />
                    <DetailRow label="Bank Code" value={transaction.bank_code} />
                    <DetailRow label="Bank Name" value={transaction.bank_name} />
                    <DetailRow label="Variable Symbol" value={transaction.variable_symbol} mono />
                    <DetailRow label="Constant Symbol" value={transaction.constant_symbol} mono />
                    <DetailRow label="Specific Symbol" value={transaction.specific_symbol} mono />
                    <DetailRow label="User Identification" value={transaction.user_identification} />
                    <DetailRow label="Message for Recipient" value={transaction.message_for_recipient} />
                    <DetailRow label="Type" value={transaction.type} />
                    <DetailRow label="Executor" value={transaction.executor} />
                    <DetailRow label="Specification" value={transaction.specification} />
                    <DetailRow label="Comment" value={transaction.comment} />
                    <DetailRow label="BIC" value={transaction.bic} mono />
                    <DetailRow label="Transaction ID" value={transaction.transaction_id} mono />
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value, className, mono }) {
    if (!value) return null;

    return (
        <div className="detail-row">
            <div className="detail-label">{label}</div>
            <div className={`detail-value ${className || ''} ${mono ? 'mono' : ''}`}>{value}</div>
        </div>
    );
}

function FilterInput({ label, value, onChange, placeholder }) {
    return (
        <div className="filter-input-group">
            <label className="filter-label">{label}</label>
            <input
                type="text"
                value={value}
                onInput={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="filter-input"
            />
        </div>
    );
}

export default TransactionList;
