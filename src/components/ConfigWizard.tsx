import { useState } from 'preact/hooks';
import { JSX } from 'preact';
import { addAccount, addEvent, initializeWithSampleData } from '../db';
import { isValidIBAN } from 'ibantools';
import { AlertDialog } from './Dialog';
import './ConfigWizard.css';

interface ConfigWizardProps {
    onComplete: () => void;
}

type Step = 'choice' | 'account' | 'event';

export function ConfigWizard({ onComplete }: ConfigWizardProps) {
    const [currentStep, setCurrentStep] = useState<Step>('choice');

    // Account form state
    const [accountName, setAccountName] = useState('');
    const [accountIban, setAccountIban] = useState('');
    const [accountCurrency, setAccountCurrency] = useState('CZK');
    const [accountError, setAccountError] = useState('');

    // Event form state
    const [eventName, setEventName] = useState('');
    const [eventStaticSymbol, setEventStaticSymbol] = useState('');
    const [eventVsMode, setEventVsMode] = useState<'counter' | 'time' | 'static'>('counter');
    const [eventPermanentAmount, setEventPermanentAmount] = useState('');
    const [eventError, setEventError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAlert, setShowAlert] = useState<string | null>(null);

    async function handleUseDemoData() {
        setIsSubmitting(true);
        try {
            await initializeWithSampleData();
            onComplete();
        } catch (err) {
            setShowAlert('Failed to load demo data: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setIsSubmitting(false);
        }
    }

    async function handleAccountSubmit(e: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) {
        e.preventDefault();
        setAccountError('');

        // Validate IBAN
        if (!isValidIBAN(accountIban)) {
            setAccountError('Please enter a valid IBAN');
            return;
        }

        setIsSubmitting(true);

        try {
            const now = Date.now();
            await addAccount({
                name: accountName,
                iban: accountIban.replace(/\s/g, '').toUpperCase(),
                currency: accountCurrency,
                isDefault: true,
                createdAt: now,
                updatedAt: now,
            });

            // Move to event step
            setCurrentStep('event');
        } catch (err) {
            setAccountError(err instanceof Error ? err.message : 'Failed to create account');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleEventSubmit(e: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) {
        e.preventDefault();
        setEventError('');

        // Validate static symbol (should be numeric)
        if (!/^\d{1,4}$/.test(eventStaticSymbol)) {
            setEventError('Static symbol must be 1-4 digits');
            return;
        }

        setIsSubmitting(true);

        try {
            const now = Date.now();
            await addEvent({
                name: eventName,
                staticSymbol: eventStaticSymbol,
                vsMode: eventVsMode,
                vsCounter: 1,
                vsStaticValue: eventVsMode === 'static' ? '1' : undefined,
                permanentAmount: eventPermanentAmount ? parseFloat(eventPermanentAmount) : undefined,
                isDefault: true,
                createdAt: now,
                updatedAt: now,
            });

            // Configuration complete!
            onComplete();
        } catch (err) {
            setEventError(err instanceof Error ? err.message : 'Failed to create event');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="config-wizard">
            <div className="wizard-container">
                <div className="wizard-header">
                    <h1>Welcome to SPAYD Generator</h1>
                </div>

                {/* Step 0: Choice - Demo Data or Own Data */}
                {currentStep === 'choice' && (
                    <div className="wizard-content fade-in">
                        <p className="wizard-intro">
                            To get started, you need at least one bank account and one event.
                        </p>

                        <div className="choice-container">
                            <button
                                className="choice-card"
                                onClick={handleUseDemoData}
                                disabled={isSubmitting}
                                type="button"
                            >
                                <div className="choice-icon">🎯</div>
                                <h3>Use Demo Data</h3>
                                <p>Start quickly with sample accounts and events. Perfect for testing!</p>
                            </button>

                            <button
                                className="choice-card"
                                onClick={() => setCurrentStep('account')}
                                disabled={isSubmitting}
                                type="button"
                            >
                                <div className="choice-icon">✏️</div>
                                <h3>Create Your Own</h3>
                                <p>Set up your own bank account and event from scratch.</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 1: Create Account */}
                {currentStep === 'account' && (
                    <div className="wizard-step fade-in">
                        <div className="step-icon">🏦</div>
                        <h2 className="step-title">Create Your First Account</h2>
                        <p className="step-description">
                            Add the bank account where you'll receive payments
                        </p>

                        <form onSubmit={handleAccountSubmit}>
                            <div className="form-group">
                                <label className="form-label">Account Name</label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onInput={(e) => setAccountName((e.target as HTMLInputElement).value)}
                                    placeholder="e.g., Main Business Account"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">IBAN</label>
                                <input
                                    type="text"
                                    value={accountIban}
                                    onInput={(e) => setAccountIban((e.target as HTMLInputElement).value)}
                                    placeholder="e.g., CZ65 0800 0000 1920 0014 5399"
                                    required
                                />
                                <div className="form-help">Include spaces for easier reading</div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Currency</label>
                                <select
                                    value={accountCurrency}
                                    onChange={(e) => setAccountCurrency((e.target as HTMLSelectElement).value)}
                                    required
                                >
                                    <option value="CZK">CZK - Czech Koruna</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="GBP">GBP - British Pound</option>
                                </select>
                            </div>

                            {accountError && <div className="form-error">{accountError}</div>}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg wizard-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="spinner"></div>
                                        Creating...
                                    </>
                                ) : (
                                    'Continue to Event →'
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Create Event */}
                {currentStep === 'event' && (
                    <div className="wizard-step fade-in">
                        <div className="step-icon">📅</div>
                        <h2 className="step-title">Create Your First Event</h2>
                        <p className="step-description">
                            Events help organize payments by purpose (e.g., workshop fees, memberships)
                        </p>

                        <form onSubmit={handleEventSubmit}>
                            <div className="form-group">
                                <label className="form-label">Event Name</label>
                                <input
                                    type="text"
                                    value={eventName}
                                    onInput={(e) => setEventName((e.target as HTMLInputElement).value)}
                                    placeholder="e.g., Workshop 2024"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Static Symbol (SS)</label>
                                <input
                                    type="text"
                                    value={eventStaticSymbol}
                                    onInput={(e) => setEventStaticSymbol((e.target as HTMLInputElement).value)}
                                    placeholder="e.g., 543"
                                    maxLength={4}
                                    required
                                />
                                <div className="form-help">1-4 digits to identify this event</div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Variable Symbol (VS) Mode</label>
                                <select
                                    value={eventVsMode}
                                    onChange={(e) => setEventVsMode((e.target as HTMLSelectElement).value as any)}
                                    required
                                >
                                    <option value="counter">Counter - Auto-increment (e.g., 1, 2, 3...)</option>
                                    <option value="time">Timestamp - Based on generation time</option>
                                    <option value="static">Static - Always the same value</option>
                                </select>
                                <div className="form-help">How to generate variable symbols for payments</div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Default Amount (Optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={eventPermanentAmount}
                                    onInput={(e) => setEventPermanentAmount((e.target as HTMLInputElement).value)}
                                    placeholder="e.g., 450.00"
                                />
                                <div className="form-help">Set a standard price for this event</div>
                            </div>

                            {eventError && <div className="form-error">{eventError}</div>}

                            <div className="wizard-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setCurrentStep('account')}
                                    disabled={isSubmitting}
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="spinner"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        'Complete Setup ✨'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {showAlert && (
                <AlertDialog
                    message={showAlert}
                    onClose={() => setShowAlert(null)}
                />
            )}
        </div>
    );
}
