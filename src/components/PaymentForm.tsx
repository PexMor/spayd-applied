import { useState, useEffect } from 'preact/hooks';
import { JSX } from 'preact';
import { getAccounts, getEvents, type Account, type Event } from '../db';
import { generatePayment } from '../services/payment-generator';
import { friendlyFormatIBAN } from 'ibantools';

export function PaymentForm() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPayment, setGeneratedPayment] = useState<any>(null);
    const [error, setError] = useState('');
    const [usePermanentAmount, setUsePermanentAmount] = useState(false);

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

    useEffect(() => {
        // Auto-fill permanent amount if available and toggle is on
        if (usePermanentAmount && selectedEvent?.permanentAmount) {
            setAmount(selectedEvent.permanentAmount.toString());
        }
    }, [usePermanentAmount, selectedEvent]);

    async function handleGenerate(e: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) {
        e.preventDefault();
        if (!selectedAccountId || !selectedEventId) {
            setError('Please select both account and event');
            return;
        }

        setError('');
        setIsGenerating(true);

        try {
            const amountValue = parseFloat(amount);
            if (isNaN(amountValue) || amountValue <= 0) {
                throw new Error('Invalid amount');
            }

            const payment = await generatePayment(selectedAccountId, selectedEventId, amountValue, {
                message: message || undefined,
            });

            setGeneratedPayment(payment);

            // Reload data to get updated VS counter
            await loadData();

            // Reset form if not using permanent amount
            if (!usePermanentAmount) {
                setAmount('');
                setMessage('');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate payment');
        } finally {
            setIsGenerating(false);
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    }

    return (
        <div className="fade-in">
            <h2 className="mb-lg">Generate Payment</h2>

            {accounts.length === 0 || events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <h3>Setup Required</h3>
                    <p>
                        Please create at least one account and one event before generating payments.
                    </p>
                </div>
            ) : (
                <div className="grid grid-2">
                    <div>
                        <form onSubmit={handleGenerate}>
                            <div className="card mb-lg">
                                <h3 className="mb-md">Selection</h3>

                                <div className="form-group">
                                    <label className="form-label">Account</label>
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
                                    <label className="form-label">Event</label>
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

                                {selectedAccount && selectedEvent && (
                                    <div className="p-md" style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                        <div className="text-sm text-secondary mb-xs">Selected Configuration</div>
                                        <div className="text-sm">
                                            <strong>IBAN:</strong> {friendlyFormatIBAN(selectedAccount.iban)}
                                        </div>
                                        <div className="text-sm">
                                            <strong>Currency:</strong> {selectedAccount.currency}
                                        </div>
                                        <div className="text-sm">
                                            <strong>SS:</strong> {selectedEvent.staticSymbol}
                                        </div>
                                        <div className="text-sm">
                                            <strong>VS Mode:</strong> {selectedEvent.vsMode}
                                            {selectedEvent.vsMode === 'counter' && ` (next: ${selectedEvent.vsCounter})`}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="card">
                                <h3 className="mb-md">Payment Details</h3>

                                {selectedEvent?.permanentAmount && (
                                    <div className="form-group">
                                        <label className="flex items-center gap-sm">
                                            <input
                                                type="checkbox"
                                                checked={usePermanentAmount}
                                                onChange={(e) =>
                                                    setUsePermanentAmount((e.target as HTMLInputElement).checked)
                                                }
                                            />
                                            <span className="form-label" style={{ marginBottom: 0 }}>
                                                Use permanent amount ({selectedEvent.permanentAmount}{' '}
                                                {selectedAccount?.currency || 'CZK'})
                                            </span>
                                        </label>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">
                                        Amount ({selectedAccount?.currency || 'CZK'})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
                                        placeholder="e.g., 450.00"
                                        required
                                        disabled={usePermanentAmount}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Message (Optional)</label>
                                    <input
                                        type="text"
                                        value={message}
                                        onInput={(e) => setMessage((e.target as HTMLInputElement).value)}
                                        placeholder="e.g., Registration fee"
                                    />
                                </div>

                                {error && <div className="form-error mb-md">{error}</div>}

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={isGenerating}
                                    style={{ width: '100%' }}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="spinner"></div>
                                            Generating...
                                        </>
                                    ) : usePermanentAmount ? (
                                        '⚡ Quick Generate'
                                    ) : (
                                        'Generate Payment'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div>
                        {generatedPayment ? (
                            <div className="card fade-in">
                                <h3 className="mb-md">Generated Payment</h3>

                                <div className="qr-display mb-lg">
                                    <img src={generatedPayment.qrCodeDataUrl} alt="Payment QR Code" />
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Amount</div>
                                    <div className="text-xl font-bold">
                                        {generatedPayment.amount} {generatedPayment.currency}
                                    </div>
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Variable Symbol</div>
                                    <div className="font-mono">{generatedPayment.variableSymbol}</div>
                                </div>

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">Static Symbol</div>
                                    <div className="font-mono">{generatedPayment.staticSymbol}</div>
                                </div>

                                {generatedPayment.message && (
                                    <div className="mb-md">
                                        <div className="text-sm text-secondary mb-xs">Message</div>
                                        <div>{generatedPayment.message}</div>
                                    </div>
                                )}

                                <div className="mb-md">
                                    <div className="text-sm text-secondary mb-xs">SPAYD String</div>
                                    <div className="spayd-string" style={{ position: 'relative' }}>
                                        <button
                                            className="copy-button"
                                            onClick={() => copyToClipboard(generatedPayment.spaydString)}
                                        >
                                            Copy
                                        </button>
                                        {generatedPayment.spaydString}
                                    </div>
                                </div>

                                <div className="flex gap-sm">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.download = `payment-${generatedPayment.variableSymbol}.png`;
                                            link.href = generatedPayment.qrCodeDataUrl;
                                            link.click();
                                        }}
                                    >
                                        💾 Download QR
                                    </button>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => setGeneratedPayment(null)}
                                    >
                                        ✨ Generate Another
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📱</div>
                                <h3>No payment generated yet</h3>
                                <p>Fill in the form and click generate to create a payment QR code</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
