import { useState, useEffect } from 'preact/hooks';
import { JSX } from 'preact';
import { getEvents, addEvent, updateEvent, deleteEvent, type Event } from '../db';
import { ConfirmDialog } from './Dialog';

export function EventManager() {
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
                <h2>Payment Events</h2>
                <button className="btn btn-primary" onClick={() => openForm()}>
                    + Add Event
                </button>
            </div>

            {events.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <h3>No events yet</h3>
                    <p>Create your first payment event to organize payments</p>
                </div>
            ) : (
                <div className="grid grid-2">
                    {events.map((event) => (
                        <div key={event.id} className="card">
                            <div className="flex justify-between items-center mb-md">
                                <h3 className="text-lg">{event.name}</h3>
                                {event.isDefault && (
                                    <span className="badge badge-acked">Default</span>
                                )}
                            </div>
                            <div className="mb-sm">
                                <div className="text-sm text-secondary">Static Symbol (SS)</div>
                                <div className="font-mono text-sm">{event.staticSymbol}</div>
                            </div>
                            <div className="mb-sm">
                                <div className="text-sm text-secondary">VS Generation Mode</div>
                                <div className="text-sm">
                                    {event.vsMode === 'counter' && `Counter (current: ${event.vsCounter})`}
                                    {event.vsMode === 'time' && 'Time-based (YYYYMMDDHHmmss)'}
                                    {event.vsMode === 'static' && `Static (${event.vsStaticValue})`}
                                </div>
                            </div>
                            {event.permanentAmount && (
                                <div className="mb-sm">
                                    <div className="text-sm text-secondary">Permanent Amount</div>
                                    <div className="text-sm font-semibold">{event.permanentAmount} CZK</div>
                                </div>
                            )}
                            {event.message && (
                                <div className="mb-sm">
                                    <div className="text-sm text-secondary">Message</div>
                                    <div className="text-sm">{event.message}</div>
                                </div>
                            )}
                            <div className="flex gap-sm mt-md">
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => openForm(event)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(event)}
                                >
                                    Delete
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
                                {editingEvent ? 'Edit Event' : 'Add Event'}
                            </h2>
                            <button className="modal-close" onClick={closeForm}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Event Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onInput={(e) =>
                                        setFormData({ ...formData, name: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder="e.g., Workshop 2024"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Static Symbol (SS)</label>
                                <input
                                    type="text"
                                    value={formData.staticSymbol}
                                    onInput={(e) =>
                                        setFormData({ ...formData, staticSymbol: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder="e.g., 543"
                                    required
                                />
                                <div className="form-help">
                                    Event identifier that stays constant for all payments
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Variable Symbol Mode</label>
                                <select
                                    value={formData.vsMode}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            vsMode: (e.target as HTMLSelectElement).value as any,
                                        })
                                    }
                                >
                                    <option value="counter">Counter (Sequential: 1, 2, 3...)</option>
                                    <option value="time">Time-based (YYYYMMDDHHmmss)</option>
                                    <option value="static">Static (Same value)</option>
                                </select>
                            </div>

                            {formData.vsMode === 'counter' && (
                                <div className="form-group">
                                    <label className="form-label">Starting Counter Value</label>
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
                                    <label className="form-label">Static VS Value</label>
                                    <input
                                        type="text"
                                        value={formData.vsStaticValue}
                                        onInput={(e) =>
                                            setFormData({ ...formData, vsStaticValue: (e.target as HTMLInputElement).value })
                                        }
                                        placeholder="e.g., 123456"
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Permanent Amount (Optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.permanentAmount}
                                    onInput={(e) =>
                                        setFormData({ ...formData, permanentAmount: (e.target as HTMLInputElement).value })
                                    }
                                    placeholder="e.g., 450.00"
                                />
                                <div className="form-help">
                                    Set a recurring amount for quick payment generation
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Message (Optional)</label>
                                <textarea
                                    value={formData.message}
                                    onInput={(e) =>
                                        setFormData({ ...formData, message: (e.target as HTMLTextAreaElement).value })
                                    }
                                    placeholder="Optional message for all payments"
                                    rows={2}
                                />
                                <div className="form-help">
                                    This message will be automatically included in all payments for this event
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
                                        Set as default event
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-sm justify-between">
                                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingEvent ? 'Update' : 'Create'} Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <ConfirmDialog
                    message={`Are you sure you want to delete event "${deleteConfirm.event.name}"?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
        </div>
    );
}
