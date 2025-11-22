import { useState, useEffect } from 'preact/hooks';
import { JSX } from 'preact';
import { useI18n } from '../I18nContext';
import { getEvents, addEvent, updateEvent, deleteEvent, type Event } from '../db';
import { ConfirmDialog } from './Dialog';

export function EventManager() {
    const { t } = useI18n();
    const [events, setEvents] = useState<Event[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        staticSymbol: '',
        vsMode: 'counter' as 'counter' | 'time' | 'static',
        vsCounter: 1,
        vsStaticValue: '',
        permanentAmount: '',
        message: '',
        isDefault: false,
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{ event: Event } | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    async function loadEvents() {
        const data = await getEvents();
        setEvents(data);
    }

    function openForm(event?: Event) {
        if (event) {
            setEditingEvent(event);
            setFormData({
                name: event.name,
                staticSymbol: event.staticSymbol,
                vsMode: event.vsMode,
                vsCounter: event.vsCounter,
                vsStaticValue: event.vsStaticValue || '',
                permanentAmount: event.permanentAmount?.toString() || '',
                message: event.message || '',
                isDefault: event.isDefault,
            });
        } else {
            setEditingEvent(null);
            setFormData({
                name: '',
                staticSymbol: '',
                vsMode: 'counter',
                vsCounter: 1,
                vsStaticValue: '',
                permanentAmount: '',
                message: '',
                isDefault: events.length === 0,
            });
        }
        setIsFormOpen(true);
    }

    function closeForm() {
        setIsFormOpen(false);
        setEditingEvent(null);
    }

    async function handleSubmit(e: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) {
        e.preventDefault();

        const eventData = {
            ...formData,
            permanentAmount: formData.permanentAmount ? parseFloat(formData.permanentAmount) : undefined,
            message: formData.message || undefined,
            updatedAt: Date.now(),
            createdAt: editingEvent?.createdAt || Date.now(),
        };

        if (editingEvent) {
            await updateEvent({ ...eventData, id: editingEvent.id });
        } else {
            await addEvent(eventData);
        }

        await loadEvents();
        closeForm();
    }

    function handleDelete(event: Event) {
        if (!event.id) return;
        setDeleteConfirm({ event });
    }

    async function confirmDelete() {
        if (!deleteConfirm?.event.id) return;
        await deleteEvent(deleteConfirm.event.id);
        await loadEvents();
        setDeleteConfirm(null);
    }

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-lg">
                <h2>{t.events}</h2>
                <button className="btn btn-primary" onClick={() => openForm()}>
                    {t.addEvent}
                </button>
            </div>

            {events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <h3>{t.noEventsYet}</h3>
                    <p>{t.noEventsMessage}</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {events.map((event) => (
                        <div key={event.id} className="card">
                            <div className="flex justify-between items-center mb-md">
                                <h3 className="text-lg">{event.name}</h3>
                                {event.isDefault && (
                                    <span className="badge badge-acked">{t.default}</span>
                                )}
                            </div>
                            <div className="mb-sm">
                                <div className="text-sm text-secondary">{t.staticSymbol}</div>
                                <div className="font-mono text-sm">{event.staticSymbol}</div>
                            </div>
                            <div className="mb-sm">
                                <div className="text-sm text-secondary">{t.vsGenerationMode}</div>
                                <div className="text-sm">
                                    {event.vsMode === 'counter' && `${t.counterCurrent}${event.vsCounter})`}
                                    {event.vsMode === 'time' && t.timeBasedYMDHMS}
                                    {event.vsMode === 'static' && `${t.staticValue}${event.vsStaticValue})`}
                                </div>
                            </div>
                            {event.permanentAmount && (
                                <div className="mb-sm">
                                    <div className="text-sm text-secondary">{t.permanentAmount}</div>
                                    <div className="text-sm font-semibold">{event.permanentAmount} CZK</div>
                                </div>
                            )}
                            {event.message && (
                                <div className="mb-sm">
                                    <div className="text-sm text-secondary">{t.message}</div>
                                    <div className="text-sm">{event.message}</div>
                                </div>
                            )}
                            <div className="flex gap-sm mt-md">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openForm(event)}
                                >
                                    {t.edit}
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(event)}
                                >
                                    {t.delete}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <div className="modal-overlay" onClick={closeForm}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingEvent ? t.editEvent : t.addEvent.replace('+ ', '')}
                            </h2>
                            <button className="modal-close" onClick={closeForm}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t.eventName}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onInput={(e) =>
                                        setFormData({ ...formData, name: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder={t.eventNamePlaceholder}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.staticSymbol}</label>
                                <input
                                    type="text"
                                    value={formData.staticSymbol}
                                    onInput={(e) =>
                                        setFormData({ ...formData, staticSymbol: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder={t.staticSymbolPlaceholder}
                                    required
                                />
                                <div className="form-help">
                                    {t.staticSymbolHelp1to4}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.variableSymbolMode}</label>
                                <select
                                    value={formData.vsMode}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            vsMode: (e.target as HTMLSelectElement).value as any,
                                        })
                                    }
                                >
                                    <option value="counter">{t.vsModeCounterDesc}</option>
                                    <option value="time">{t.vsModeTimeDesc}</option>
                                    <option value="static">{t.vsModeStaticDesc}</option>
                                </select>
                            </div>

                            {formData.vsMode === 'counter' && (
                                <div className="form-group">
                                    <label className="form-label">{t.startingCounter}</label>
                                    <input
                                        type="number"
                                        value={formData.vsCounter}
                                        onInput={(e) =>
                                            setFormData({
                                                ...formData,
                                                vsCounter: parseInt((e.target as HTMLInputElement).value) || 1,
                                            })
                                        }
                                        min="1"
                                    />
                                </div>
                            )}

                            {formData.vsMode === 'static' && (
                                <div className="form-group">
                                    <label className="form-label">{t.staticVsValue}</label>
                                    <input
                                        type="text"
                                        value={formData.vsStaticValue}
                                        onInput={(e) =>
                                            setFormData({ ...formData, vsStaticValue: (e.target as HTMLInputElement).value })
                                        }
                                        placeholder={t.staticVsValuePlaceholder}
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">{t.permanentAmountLabel}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.permanentAmount}
                                    onInput={(e) =>
                                        setFormData({ ...formData, permanentAmount: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder={t.permanentAmountPlaceholder}
                                />
                                <div className="form-help">
                                    {t.setStandardPrice}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.messageOptional}</label>
                                <textarea
                                    value={formData.message}
                                    onInput={(e) =>
                                        setFormData({ ...formData, message: (e.target as HTMLTextAreaElement).value })
                                    }
                                    placeholder={t.messageOptionalTextarea}
                                    rows={2}
                                />
                                <div className="form-help">
                                    {t.messageAutoIncluded}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="flex items-center gap-sm">
                                    <input
                                        type="checkbox"
                                        checked={formData.isDefault}
                                        onChange={(e) =>
                                            setFormData({ ...formData, isDefault: (e.target as HTMLInputElement).checked })
                                        }
                                    />
                                    <span className="form-label" style={{ marginBottom: 0 }}>
                                        {t.setAsDefaultEvent}
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-sm justify-between">
                                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                                    {t.cancel}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingEvent ? t.update : t.create} {t.event}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <ConfirmDialog
                    message={`${t.deleteEventConfirm} "${deleteConfirm.event.name}"?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
        </div>
    );
}
