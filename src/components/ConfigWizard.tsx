import { useState } from 'preact/hooks';
import { JSX } from 'preact';
import { useI18n } from '../I18nContext';
import { addAccount, addEvent, initializeWithSampleData } from '../db';
import { isValidIBAN } from 'ibantools';
import { AlertDialog } from './Dialog';
import './ConfigWizard.css';

interface ConfigWizardProps {
    onComplete: () => void;
}

type Step = 'choice' | 'account' | 'event';

export function ConfigWizard({ onComplete }: ConfigWizardProps) {
    const { t, locale } = useI18n();
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
            await initializeWithSampleData(locale);
            onComplete();
        } catch (err) {
            setShowAlert(t.failedToLoadDemoData + (err instanceof Error ? err.message : t.unknownError));
            setIsSubmitting(false);
        }
    }

    async function handleAccountSubmit(e: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) {
        e.preventDefault();
        setAccountError('');

        // Validate IBAN
        if (!isValidIBAN(accountIban)) {
            setAccountError(t.pleaseEnterValidIban);
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
            setAccountError(err instanceof Error ? err.message : t.failedToCreateAccount);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleEventSubmit(e: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) {
        e.preventDefault();
        setEventError('');

        // Validate static symbol (should be numeric)
        if (!/^\d{1,4}$/.test(eventStaticSymbol)) {
            setEventError(t.staticSymbolMust1to4);
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
            setEventError(err instanceof Error ? err.message : t.failedToCreateEvent);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="config-wizard">
            <div className="wizard-container">
                <div className="wizard-header">
                    <h1>{t.welcomeToSpayd}</h1>
                </div>

                {/* Step 0: Choice - Demo Data or Own Data */}
                {currentStep === 'choice' && (
                    <div className="wizard-content fade-in">
                        <p className="wizard-intro">
                            {t.wizardIntro}
                        </p>

                        <div className="choice-container">
                            <button
                                className="choice-card"
                                onClick={handleUseDemoData}
                                disabled={isSubmitting}
                                type="button"
                            >
                                <div className="choice-icon">🎯</div>
                                <h3>{t.useDemoData}</h3>
                                <p>{t.useDemoDataDesc}</p>
                            </button>

                            <button
                                className="choice-card"
                                onClick={() => setCurrentStep('account')}
                                disabled={isSubmitting}
                                type="button"
                            >
                                <div className="choice-icon">✏️</div>
                                <h3>{t.createYourOwn}</h3>
                                <p>{t.createYourOwnDesc}</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 1: Create Account */}
                {currentStep === 'account' && (
                    <div className="wizard-step fade-in">
                        <div className="step-icon">🏦</div>
                        <h2 className="step-title">{t.createFirstAccount}</h2>
                        <p className="step-description">
                            {t.createFirstAccountDesc}
                        </p>

                        <form onSubmit={handleAccountSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t.accountName}</label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onInput={(e) => setAccountName((e.target as HTMLInputElement).value)}
                                    placeholder={t.accountNamePlaceholder}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.iban}</label>
                                <input
                                    type="text"
                                    value={accountIban}
                                    onInput={(e) => setAccountIban((e.target as HTMLInputElement).value)}
                                    placeholder={t.ibanPlaceholder}
                                    required
                                />
                                <div className="form-help">{t.includeSpacesHelp}</div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.currency}</label>
                                <select
                                    value={accountCurrency}
                                    onChange={(e) => setAccountCurrency((e.target as HTMLSelectElement).value)}
                                    required
                                >
                                    <option value="CZK">{t.currencyCzk}</option>
                                    <option value="EUR">{t.currencyEur}</option>
                                    <option value="USD">{t.currencyUsd}</option>
                                    <option value="GBP">{t.currencyGbp}</option>
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
                                        {t.creating}
                                    </>
                                ) : (
                                    t.continueToEvent
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Create Event */}
                {currentStep === 'event' && (
                    <div className="wizard-step fade-in">
                        <div className="step-icon">📅</div>
                        <h2 className="step-title">{t.createFirstEvent}</h2>
                        <p className="step-description">
                            {t.createFirstEventDesc}
                        </p>

                        <form onSubmit={handleEventSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t.eventName}</label>
                                <input
                                    type="text"
                                    value={eventName}
                                    onInput={(e) => setEventName((e.target as HTMLInputElement).value)}
                                    placeholder={t.eventNamePlaceholder}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.staticSymbol}</label>
                                <input
                                    type="text"
                                    value={eventStaticSymbol}
                                    onInput={(e) => setEventStaticSymbol((e.target as HTMLInputElement).value)}
                                    placeholder={t.staticSymbolPlaceholder}
                                    maxLength={4}
                                    required
                                />
                                <div className="form-help">{t.staticSymbolHelp1to4}</div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.variableSymbolMode}</label>
                                <select
                                    value={eventVsMode}
                                    onChange={(e) => setEventVsMode((e.target as HTMLSelectElement).value as any)}
                                    required
                                >
                                    <option value="counter">{t.vsModeCounterDesc}</option>
                                    <option value="time">{t.vsModeTimeDesc}</option>
                                    <option value="static">{t.vsModeStaticDesc}</option>
                                </select>
                                <div className="form-help">{t.vsModeHowToGenerate}</div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.defaultAmountOptional}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={eventPermanentAmount}
                                    onInput={(e) => setEventPermanentAmount((e.target as HTMLInputElement).value)}
                                    placeholder={t.permanentAmountPlaceholder}
                                />
                                <div className="form-help">{t.setStandardPrice}</div>
                            </div>

                            {eventError && <div className="form-error">{eventError}</div>}

                            <div className="wizard-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setCurrentStep('account')}
                                    disabled={isSubmitting}
                                >
                                    {t.back}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="spinner"></div>
                                            {t.creating}
                                        </>
                                    ) : (
                                        t.completeSetup
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
