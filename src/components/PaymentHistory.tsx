import { useState, useEffect } from 'preact/hooks';
import {
    getPayments,
    getAccounts,
    getEvents,
    deletePayment,
    type Payment,
    type Account,
    type Event,
} from '../db';

export function PaymentHistory() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [filterAccountId, setFilterAccountId] = useState<number | null>(null);
    const [filterEventId, setFilterEventId] = useState<number | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

    useEffect(() => {
        loadData();
    }, [filterAccountId, filterEventId]);

    async function loadData() {
        const accountsData = await getAccounts();
        const eventsData = await getEvents();
        const paymentsData = await getPayments({
            accountId: filterAccountId || undefined,
            eventId: filterEventId || undefined,
        });

        setAccounts(accountsData);
        setEvents(eventsData);
        setPayments(paymentsData);
    }

    async function handleDelete(payment: Payment) {
        if (!payment.id) return;
        if (confirm('Are you sure you want to delete this payment?')) {
            await deletePayment(payment.id);
            await loadData();
            if (selectedPayment?.id === payment.id) {
                setSelectedPayment(null);
            }
        }
    }

    function getAccountName(accountId: number): string {
        return accounts.find((a) => a.id === accountId)?.name || 'Unknown';
    }

    function getEventName(eventId: number): string {
        return events.find((e) => e.id === eventId)?.name || 'Unknown';
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    }

    return (
        <div className="fade-in">
            <h2 className="mb-lg">Payment History</h2>

            <div className="card mb-lg">
                <h3 className="mb-md">Filters</h3>
                <div className="flex gap-md">
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">Account</label>
                        <select
                            value={filterAccountId || ''}
                            onChange={(e) =>
                                setFilterAccountId(
                                    (e.target as HTMLSelectElement).value
                                        ? parseInt((e.target as HTMLSelectElement).value)
                                        : null
                                )
                            }
                        >
                            <option value="">All Accounts</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">Event</label>
                        <select
                            value={filterEventId || ''}
                            onChange={(e) =>
                                setFilterEventId(
                                    (e.target as HTMLSelectElement).value
                                        ? parseInt((e.target as HTMLSelectElement).value)
                                        : null
                                )
                            }
                        >
                            <option value="">All Events</option>
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {payments.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3>No payments found</h3>
                    <p>Generate your first payment to see it here</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    <div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Account</th>
                                        <th>Event</th>
                                        <th>Amount</th>
                                        <th>VS</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td className="text-sm">{formatDate(payment.createdAt)}</td>
                                            <td className="text-sm">{getAccountName(payment.accountId)}</td>
                                            <td className="text-sm">{getEventName(payment.eventId)}</td>
                                            <td className="font-semibold">
                                                {payment.amount} {payment.currency}
                                            </td>
                                            <td className="font-mono text-sm">{payment.variableSymbol}</td>
                                            <td>
                                                <div className="flex gap-xs">
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => setSelectedPayment(payment)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(payment)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        {selectedPayment ? (
                            <div className="card fade-in">
                                <h3 className="mb-md">Payment Details</h3>

                                <div className="qr-display mb-lg">
                                    <img src={selectedPayment.qrCodeDataUrl} alt="Payment QR Code" />
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Date</div>
                                    <div>{formatDate(selectedPayment.createdAt)}</div>
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Account</div>
                                    <div>{getAccountName(selectedPayment.accountId)}</div>
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Event</div>
                                    <div>{getEventName(selectedPayment.eventId)}</div>
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Amount</div>
                                    <div className="text-xl font-bold">
                                        {selectedPayment.amount} {selectedPayment.currency}
                                    </div>
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Variable Symbol</div>
                                    <div className="font-mono">{selectedPayment.variableSymbol}</div>
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Static Symbol</div>
                                    <div className="font-mono">{selectedPayment.staticSymbol}</div>
                                </div>

                                {selectedPayment.message && (
                                    <div className="mb-md">
                                        <div className="text-sm text-secondary mb-xs">Message</div>
                                        <div>{selectedPayment.message}</div>
                                    </div>
                                )}

                                <div className="mb-lg">
                                    <div className="text-sm text-secondary mb-xs">SPAYD String</div>
                                    <div className="spayd-string" style={{ position: 'relative' }}>
                                        <button
                                            className="copy-button"
                                            onClick={() => copyToClipboard(selectedPayment.spaydString)}
                                        >
                                            Copy
                                        </button>
                                        {selectedPayment.spaydString}
                                    </div>
                                </div>

                                <button
                                    className="btn btn-secondary"
                                    style={{ width: '100%' }}
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.download = `payment-${selectedPayment.variableSymbol}.png`;
                                        link.href = selectedPayment.qrCodeDataUrl;
                                        link.click();
                                    }}
                                >
                                    💾 Download QR Code
                                </button>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">👈</div>
                                <h3>Select a payment</h3>
                                <p>Click "View" on a payment to see details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
