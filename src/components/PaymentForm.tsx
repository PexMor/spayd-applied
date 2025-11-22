import { useState, useEffect } from 'preact/hooks';
import { JSX } from 'preact';
import { useI18n } from '../I18nContext';
import { getAccounts, getEvents, type Account, type Event } from '../db';
import { generatePayment } from '../services/payment-generator';
import { friendlyFormatIBAN } from 'ibantools';
import { AlertDialog } from './Dialog';
import './PaymentForm.css';

export function PaymentForm() {
    const { t } = useI18n();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPayment, setGeneratedPayment] = useState<any>(null);
    const [error, setError] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showAlert, setShowAlert] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const accountsData = await getAccounts();
        const eventsData = await getEvents();
        setAccounts(accountsData);
        setEvents(eventsData);

        // Set defaults
        const defaultAccount = accountsData.find((a) => a.isDefault) || accountsData[0];
        const defaultEvent = eventsData.find((e) => e.isDefault) || eventsData[0];

        if (defaultAccount) setSelectedAccountId(defaultAccount.id!);
        if (defaultEvent) setSelectedEventId(defaultEvent.id!);
    }

    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
    const selectedEvent = events.find((e) => e.id === selectedEventId);

    // Auto-apply event amount and message when event changes
    useEffect(() => {
        if (selectedEvent?.permanentAmount) {
            setAmount(selectedEvent.permanentAmount.toString());
        } else {
            // Clear amount if new event doesn't have permanent amount
            setAmount('');
        }

        if (selectedEvent?.message) {
            setMessage(selectedEvent.message);
        } else {
            // Clear message if new event doesn't have message
            setMessage('');
        }
    }, [selectedEvent]);

    async function handleGenerate(e: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) {
        e.preventDefault();
        if (!selectedAccountId || !selectedEventId) {
            setError(t.pleaseSelectBothAccountAndEvent);
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const amountValue = parseFloat(amount);
            if (isNaN(amountValue) || amountValue <= 0) {
                throw new Error(t.invalidAmount);
            }

            const payment = await generatePayment(selectedAccountId, selectedEventId, amountValue, {
                message: message || undefined,
            });

            setGeneratedPayment(payment);

            // Reload data to get updated VS counter
            await loadData();

            // Don't reset - let auto-apply logic handle it when event changes
        } catch (err) {
            setError(err instanceof Error ? err.message : t.failedToGeneratePayment);
        } finally {
            setIsGenerating(false);
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        setShowAlert(t.copiedToClipboard);
    }

    // Mobile-first: Show QR code full screen after generation
    if (generatedPayment) {
        return (
            <div className="payment-result fade-in">
                <div className="result-header">
                    <h2>{t.paymentQrCode}</h2>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setGeneratedPayment(null)}
                    >
                        {t.backButton}
                    </button>
                </div>

                <div className="result-qr">
                    <img src={generatedPayment.qrCodeDataUrl} alt="Payment QR Code" />
                </div>

                <div className="result-details">
                    <div className="result-amount">
                        <div className="amount-value">
                            {generatedPayment.amount} {generatedPayment.currency}
                        </div>
                        <div className="amount-label">{t.amount}</div>
                    </div>

                    <div className="result-info">
                        <div className="info-row">
                            <span className="info-label">{t.variableSymbol}</span>
                            <span className="info-value font-mono">{generatedPayment.variableSymbol}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">{t.staticSymbolSimple}</span>
                            <span className="info-value font-mono">{generatedPayment.staticSymbol}</span>
                        </div>
                        {generatedPayment.message && (
                            <div className="info-row">
                                <span className="info-label">{t.message}</span>
                                <span className="info-value">{generatedPayment.message}</span>
                            </div>
                        )}
                    </div>

                    <div className="spayd-string-container">
                        <div className="text-sm text-secondary mb-xs">{t.spaydString}</div>
                        <div className="spayd-string">
                            <button
                                className="copy-button"
                                onClick={() => copyToClipboard(generatedPayment.spaydString)}
                            >
                                {t.copyToClipboard}
                            </button>
                            {generatedPayment.spaydString}
                        </div>
                    </div>
                </div>

                <div className="result-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            const link = document.createElement('a');
                            link.download = `payment-${generatedPayment.variableSymbol}.png`;
                            link.href = generatedPayment.qrCodeDataUrl;
                            link.click();
                        }}
                    >
                        💾 {t.download}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setGeneratedPayment(null)}
                    >
                        {t.generateAnother}
                    </button>
                </div>
            </div>
        );
    }

    const hasEventAmount = selectedEvent?.permanentAmount !== undefined;
    const hasEventMessage = selectedEvent?.message !== undefined;

    return (
        <div className="payment-form fade-in">
            <form onSubmit={handleGenerate}>
                {/* Current Selection Summary - Compact */}
                {selectedAccount && selectedEvent && (
                    <div className="selection-summary">
                        <div className="summary-row">
                            <span className="summary-icon">🏦</span>
                            <div className="summary-content">
                                <div className="summary-label">{t.account}</div>
                                <div className="summary-value">{selectedAccount.name}</div>
                            </div>
                        </div>
                        <div className="summary-row">
                            <span className="summary-icon">📅</span>
                            <div className="summary-content">
                                <div className="summary-label">{t.event}</div>
                                <div className="summary-value">{selectedEvent.name}</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="change-selection-btn"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            title="Change account or event"
                        >
                            ⚙️
                        </button>
                    </div>
                )}

                {/* Advanced Selection (Collapsible) */}
                {showAdvanced && (
                    <div className="advanced-section fade-in">
                        <div className="form-group">
                            <label className="form-label">{t.account}</label>
                            <select
                                value={selectedAccountId || ''}
                                onChange={(e) =>
                                    setSelectedAccountId(
                                        parseInt((e.target as HTMLSelectElement).value)
                                    )
                                }
                                required
                            >
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} - {friendlyFormatIBAN(account.iban)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t.event}</label>
                            <select
                                value={selectedEventId || ''}
                                onChange={(e) =>
                                    setSelectedEventId(
                                        parseInt((e.target as HTMLSelectElement).value)
                                    )
                                }
                                required
                            >
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>
                                        {event.name} (SS: {event.staticSymbol})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Amount Input - PROMINENT or disabled if from event */}
                <div className="amount-input-container">
                    <label className="amount-label">
                        {t.amount} ({selectedAccount?.currency || 'CZK'})
                        {hasEventAmount && <span className="fixed-badge">{t.fixed}</span>}
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className="amount-input"
                        value={amount}
                        onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
                        placeholder="0.00"
                        required
                        disabled={hasEventAmount}
                        autoFocus={!hasEventAmount}
                    />
                </div>

                {/* Message Input - shown/hidden based on event config */}
                <div className="message-section">
                    <div className="form-group">
                        <label className="form-label">
                            {t.messageOptional}
                            {hasEventMessage && <span className="fixed-badge">{t.fixed}</span>}
                        </label>
                        <input
                            type="text"
                            value={message}
                            onInput={(e) => setMessage((e.target as HTMLInputElement).value)}
                            placeholder="e.g., Registration fee"
                            disabled={hasEventMessage}
                        />
                    </div>
                </div>

                {error && <div className="form-error mb-md">{error}</div>}

                {/* Generate Button - LARGE */}
                <button
                    type="submit"
                    className="btn btn-primary generate-btn"
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <div className="spinner"></div>
                            {t.generating}
                        </>
                    ) : (
                        <>
                            <span className="btn-icon">📱</span>
                            {t.generateQrCode}
                        </>
                    )}
                </button>
            </form>

            {showAlert && (
                <AlertDialog
                    message={showAlert}
                    onClose={() => setShowAlert(null)}
                />
            )}
        </div>
    );
}
