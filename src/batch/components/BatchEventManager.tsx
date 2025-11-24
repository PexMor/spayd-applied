import { useState } from 'preact/hooks';

export interface PaymentSplit {
    amount: number;
    dueDate?: string;     // Optional due date (YYYY-MM-DD)
    vsPrefix?: string;    // Optional override, inherits from event if not set
    ss?: string;          // Optional override, inherits from event if not set
    ks?: string;          // Optional override, inherits from event if not set
}

export interface EventConfig {
    id: string;
    description: string;
    vsPrefix: string;     // Default VS prefix for all splits
    ss?: string;          // Default SS for all splits
    ks?: string;          // Default KS for all splits
    splits: PaymentSplit[];  // 1-3 payment splits
    emailTemplate: string;
}

interface BatchEventManagerProps {
    events: EventConfig[];
    onEventsChange: (events: EventConfig[]) => void;
    selectedEventId: string;
    onSelectEvent: (id: string) => void;
}

export function BatchEventManager({
    events,
    onEventsChange,
    selectedEventId,
    onSelectEvent,
}: BatchEventManagerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editEvent, setEditEvent] = useState<EventConfig>({
        id: '',
        description: '',
        vsPrefix: '',
        ss: '',
        ks: '',
        splits: [{ amount: 100 }],  // Splits inherit from event by default
        emailTemplate: 'Hello {{FirstName}} {{SecondName}},\n\nPlease find your payment details below.\n\nBest regards',
    });

    const handleAddEvent = () => {
        const newEvent: EventConfig = {
            id: crypto.randomUUID(),
            description: 'New Event',
            vsPrefix: '',
            ss: '',
            ks: '',
            splits: [{ amount: 100 }],
            emailTemplate: 'Hello {{FirstName}} {{SecondName}},\n\nPlease find your payment details below.\n\nBest regards',
        };
        setEditEvent(newEvent);
        setIsEditing(true);
    };

    const handleEditEvent = (event: EventConfig) => {
        setEditEvent({ ...event });
        setIsEditing(true);
    };

    const handleDeleteEvent = (id: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            const newEvents = events.filter((e) => e.id !== id);
            onEventsChange(newEvents);
            if (selectedEventId === id && newEvents.length > 0) {
                onSelectEvent(newEvents[0].id);
            } else if (newEvents.length === 0) {
                onSelectEvent('');
            }
        }
    };

    const handleSave = () => {
        if (!editEvent.description) {
            alert('Description is required');
            return;
        }

        if (editEvent.splits.length === 0 || editEvent.splits.length > 3) {
            alert('Must have 1-3 payment splits');
            return;
        }

        // Validate each split
        for (let i = 0; i < editEvent.splits.length; i++) {
            const split = editEvent.splits[i];
            if (!split.amount || split.amount <= 0) {
                alert(`Split ${i + 1}: Amount must be greater than 0`);
                return;
            }
            if (split.ks && !/^\d{4}$/.test(split.ks)) {
                alert(`Split ${i + 1}: KS must be exactly 4 digits or empty`);
                return;
            }
            if (split.ss && !/^\d{1,10}$/.test(split.ss)) {
                alert(`Split ${i + 1}: SS must be up to 10 digits or empty`);
                return;
            }
        }

        const existingIndex = events.findIndex((e) => e.id === editEvent.id);
        let newEvents;
        if (existingIndex >= 0) {
            newEvents = [...events];
            newEvents[existingIndex] = editEvent;
        } else {
            newEvents = [...events, editEvent];
        }

        onEventsChange(newEvents);
        onSelectEvent(editEvent.id);
        setIsEditing(false);
    };

    const addSplit = () => {
        if (editEvent.splits.length < 3) {
            setEditEvent({
                ...editEvent,
                splits: [...editEvent.splits, { amount: 100 }]  // Inherit symbols from event
            });
        }
    };

    const removeSplit = (index: number) => {
        if (editEvent.splits.length > 1) {
            setEditEvent({
                ...editEvent,
                splits: editEvent.splits.filter((_, i) => i !== index)
            });
        }
    };

    const updateSplit = (index: number, field: keyof PaymentSplit, value: any) => {
        const newSplits = [...editEvent.splits];
        newSplits[index] = { ...newSplits[index], [field]: value };
        setEditEvent({ ...editEvent, splits: newSplits });
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(events, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'events.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const importedEvents = JSON.parse(evt.target?.result as string);
                if (Array.isArray(importedEvents)) {
                    onEventsChange(importedEvents);
                    if (importedEvents.length > 0) {
                        onSelectEvent(importedEvents[0].id);
                    }
                    alert(`Imported ${importedEvents.length} event(s) successfully!`);
                } else {
                    alert('Invalid file format');
                }
            } catch (error) {
                alert('Failed to parse JSON file');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    if (isEditing) {
        return (
            <div className="space-y-4 border p-4 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-medium text-green-900">
                    {events.find((e) => e.id === editEvent.id) ? 'Edit Event' : 'New Event'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-green-800">Description</label>
                        <input
                            type="text"
                            value={editEvent.description}
                            onInput={(e) => setEditEvent({ ...editEvent, description: (e.target as HTMLInputElement).value })}
                            className="mt-1 block w-full rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2"
                            placeholder="e.g. Summer Camp 2024"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-green-800">Payment Splits (1-3)</label>
                            <button
                                onClick={addSplit}
                                disabled={editEvent.splits.length >= 3}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-30"
                            >
                                + Add Split
                            </button>
                        </div>
                        {editEvent.splits.map((split, index) => (
                            <div key={index} className="border border-green-200 rounded p-3 space-y-2 bg-green-50/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-green-700">Split {index + 1}</span>
                                    {editEvent.splits.length > 1 && (
                                        <button
                                            onClick={() => removeSplit(index)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            × Remove
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-green-700">Amount (CZK)</label>
                                        <input
                                            type="number"
                                            value={split.amount}
                                            onInput={(e) => updateSplit(index, 'amount', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-green-700">Due Date (optional)</label>
                                        <input
                                            type="date"
                                            value={split.dueDate || ''}
                                            onInput={(e) => updateSplit(index, 'dueDate', (e.target as HTMLInputElement).value)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-green-700">VS Prefix (optional)</label>
                                        <input
                                            type="text"
                                            value={split.vsPrefix || ''}
                                            onInput={(e) => updateSplit(index, 'vsPrefix', (e.target as HTMLInputElement).value)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                            placeholder="e.g. 2024"
                                        />
                                        <p className="text-xs text-gray-500 mt-0.5">Max 10 digits total</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-green-700">SS (optional)</label>
                                        <input
                                            type="text"
                                            value={split.ss || ''}
                                            onInput={(e) => updateSplit(index, 'ss', (e.target as HTMLInputElement).value)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                            placeholder="1-10 digits"
                                        />
                                        <p className="text-xs text-gray-500 mt-0.5">Specific Symbol, 1-10 digits</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-green-700">KS (optional)</label>
                                        <input
                                            type="text"
                                            value={split.ks || ''}
                                            onInput={(e) => updateSplit(index, 'ks', (e.target as HTMLInputElement).value)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                            placeholder="4 digits"
                                        />
                                        <p className="text-xs text-gray-500 mt-0.5">Constant Symbol, exactly 4 digits</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-green-800">Email Template</label>
                        <textarea
                            value={editEvent.emailTemplate}
                            onInput={(e) => setEditEvent({ ...editEvent, emailTemplate: (e.target as HTMLTextAreaElement).value })}
                            className="mt-1 block w-full rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 font-mono text-xs"
                            rows={4}
                            placeholder="Use {{FirstName}}, {{SecondName}}, {{Email}}, etc."
                        />
                        <p className="mt-1 text-xs text-gray-500">Use placeholders like {'{{'} FirstName {'}}'},  {'{{'} Second Name {'}}'},  etc.</p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Save Event
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-green-900">Select Event</label>
                <div className="flex gap-2">
                    <label className="text-sm text-green-700 hover:text-green-900 font-medium bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition-colors cursor-pointer">
                        📥 Import
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={handleExport}
                        disabled={events.length === 0}
                        className="text-sm text-green-700 hover:text-green-900 font-medium bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        📤 Export
                    </button>
                    <button
                        onClick={handleAddEvent}
                        className="text-sm text-green-700 hover:text-green-900 font-medium bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                    >
                        + New Event
                    </button>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-6 text-green-600 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                    No events created yet.
                    <br />
                    <button onClick={handleAddEvent} className="text-green-700 font-medium hover:underline mt-2">Create one</button>
                </div>
            ) : (
                <div className="space-y-2">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${selectedEventId === event.id
                                ? 'border-green-500 bg-green-50 ring-1 ring-green-500 shadow-sm'
                                : 'border-green-100 bg-white hover:border-green-300 hover:bg-green-50/30'
                                } `}
                            onClick={() => onSelectEvent(event.id)}
                        >
                            <div>
                                <div className="font-medium text-gray-900">{event.description}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {event.splits.length} payment{event.splits.length > 1 ? 's' : ''} • Total: {event.splits.reduce((sum, s) => sum + s.amount, 0)} CZK
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded"
                                    title="Edit"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
