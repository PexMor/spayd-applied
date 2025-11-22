import { useState, useEffect } from 'preact/hooks';
import { Modal } from './Dialog';
import { useI18n } from '../I18nContext';
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
    const { t } = useI18n();
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
        if (confirm(t.deletePaymentConfirm)) {
            await deletePayment(payment.id);
            await loadData();
            if (selectedPayment?.id === payment.id) {
                setSelectedPayment(null);
            }
        }
    }

    function getAccountName(accountId: number): string {
        return accounts.find((a) => a.id === accountId)?.name || t.unknown;
    }

    function getEventName(eventId: number): string {
        return events.find((e) => e.id === eventId)?.name || t.unknown;
    }

    function formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleString();
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        alert(t.copiedToClipboard);
    }

    return (
        <div className="fade-in">
            <h2 className="mb-lg">{t.paymentHistory}</h2>

            <div className="card mb-lg">
                <h3 className="mb-md">{t.filters}</h3>
                <div className="flex gap-md">
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">{t.account}</label>
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
                            <option value="">{t.allAccounts}</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">{t.event}</label>
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
                            <option value="">{t.allEvents}</option>
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
                    <h3>{t.noPaymentsFound}</h3>
                    <p>{t.noPaymentsMessage}</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t.date}</th>
                                <th>{t.account}</th>
                                <th>{t.event}</th>
                                <th>{t.amount}</th>
                                <th>{t.vs}</th>
                                <th>{t.actions}</th>
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
                                                {t.view}
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(payment)}
                                            >
                                                {t.delete}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedPayment && (
                <Modal
                    title={t.paymentDetails}
                    onClose={() => setSelectedPayment(null)}
                >
                    <div className="qr-display mb-lg">
                        <img src={selectedPayment.qrCodeDataUrl} alt="Payment QR Code" />
                    </div>

                    <div className="mb-md">
                        <div className="text-sm text-secondary mb-xs">{t.date}</div>
                        <div>{formatDate(selectedPayment.createdAt)}</div>
                    </div>

                    <div className="mb-md">
                        <div className="text-sm text-secondary mb-xs">{t.account}</div>
                        <div>{getAccountName(selectedPayment.accountId)}</div>
                    </div>

                    <div className="mb-md">
                        <div className="text-sm text-secondary mb-xs">{t.event}</div>
                        <div>{getEventName(selectedPayment.eventId)}</div>
                    </div>

                    <div className="mb-md">
                        <div className="text-sm text-secondary mb-xs">{t.amount}</div>
                        <div className="text-xl font-bold">
                            {selectedPayment.amount} {selectedPayment.currency}
                        </div>
                    </div>

                    <div className="mb-md">
                        <div className="text-sm text-secondary mb-xs">{t.variableSymbol}</div>
                        <div className="font-mono">{selectedPayment.variableSymbol}</div>
                    </div>

                    <div className="mb-md">
                        <div className="text-sm text-secondary mb-xs">{t.staticSymbolSimple}</div>
                        <div className="font-mono">{selectedPayment.staticSymbol}</div>
                    </div>

                    {selectedPayment.message && (
                        <div className="mb-md">
                            <div className="text-sm text-secondary mb-xs">{t.message}</div>
                            <div>{selectedPayment.message}</div>
                        </div>
                    )}

                    <div className="mb-lg">
                        <div className="text-sm text-secondary mb-xs">{t.spaydString}</div>
                        <div className="spayd-string" style={{ position: 'relative' }}>
                            <button
                                className="copy-button"
                                onClick={() => copyToClipboard(selectedPayment.spaydString)}
                            >
                                {t.copyToClipboard}
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
                        {t.downloadQrCode}
                    </button>
                </Modal>
            )}
        </div>
    );
}
