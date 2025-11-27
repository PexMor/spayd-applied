import { useState, useEffect } from 'preact/hooks';
import { getTransactions } from '../services/api';

function Dashboard() {
    const [stats, setStats] = useState({
        totalTransactions: 0,
        recentCount: 0,
        totalIncome: 0,
        totalExpense: 0,
    });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const transactions = await getTransactions(0, 10);

            // Calculate stats
            const totalIncome = transactions
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);

            const totalExpense = transactions
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            setStats({
                totalTransactions: transactions.length,
                recentCount: transactions.length,
                totalIncome: totalIncome.toFixed(2),
                totalExpense: totalExpense.toFixed(2),
            });

            setRecentTransactions(transactions.slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('cs-CZ');
    };

    const formatAmount = (amount, currency = 'CZK') => {
        const formatted = new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: currency,
        }).format(amount);
        return formatted;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
                <p className="text-secondary mt-md">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="mb-lg">Dashboard</h2>

            {/* Stats Grid */}
            <div className="grid grid-2 mb-lg">
                <div className="card" style={{
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    color: 'white'
                }}>
                    <div className="text-sm" style={{ opacity: 0.9, marginBottom: 'var(--space-sm)' }}>
                        Total Income
                    </div>
                    <div className="text-xl font-bold">{formatAmount(stats.totalIncome)}</div>
                </div>

                <div className="card" style={{
                    background: 'linear-gradient(135deg, var(--danger), hsl(var(--danger-hue), 70%, 50%))',
                    color: 'white'
                }}>
                    <div className="text-sm" style={{ opacity: 0.9, marginBottom: 'var(--space-sm)' }}>
                        Total Expense
                    </div>
                    <div className="text-xl font-bold">{formatAmount(stats.totalExpense)}</div>
                </div>

                <div className="card">
                    <div className="text-sm text-secondary mb-sm">Recent Transactions</div>
                    <div className="text-xl font-bold text-primary">{stats.recentCount}</div>
                </div>

                <div className="card">
                    <div className="text-sm text-secondary mb-sm">Net Balance</div>
                    <div className="text-xl font-bold" style={{
                        color: (stats.totalIncome - stats.totalExpense) >= 0 ? 'var(--success)' : 'var(--danger)'
                    }}>
                        {formatAmount(stats.totalIncome - stats.totalExpense)}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <div className="card-header">
                    <h3>Recent Transactions</h3>
                </div>

                {recentTransactions.length === 0 ? (
                    <p className="text-secondary" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                        No transactions found
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Counter Party</th>
                                    <th>VS</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td className="text-sm">{formatDate(tx.date)}</td>
                                        <td>
                                            <div className="font-medium">{tx.counter_account_name || 'N/A'}</div>
                                            {tx.counter_account && (
                                                <div className="text-sm text-secondary">{tx.counter_account}</div>
                                            )}
                                        </td>
                                        <td className="text-sm">{tx.variable_symbol || '-'}</td>
                                        <td>
                                            <span
                                                className="font-semibold"
                                                style={{ color: tx.amount >= 0 ? 'var(--success)' : 'var(--danger)' }}
                                            >
                                                {formatAmount(tx.amount, tx.currency)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
