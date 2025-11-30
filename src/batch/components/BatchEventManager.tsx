import { useState } from 'preact/hooks';
import { useI18n } from '../../I18nContext';

export interface PaymentSplit {
    amount: number;
    dueDate?: string;     // Optional due date (YYYY-MM-DD)
    vsPrefix?: string;    // Optional VS prefix override for this split (digits only)
    ssPrefix?: string;    // Optional SS prefix override for this split (digits only)
    ksPrefix?: string;    // Optional KS prefix override for this split (digits only)
}

export interface EventConfig {
    id: string;
    description: string;
    vsPrefix: string;         // Default VS prefix for all splits (digits only)
    vsSuffixLength: number;   // Length for zero-padding VS suffix (configured once, applies to all splits)
    ssPrefix?: string;        // Default SS prefix for all splits (digits only)
    ssSuffixLength?: number;  // Length for zero-padding SS suffix (configured once, applies to all splits)
    ksPrefix?: string;        // Default KS prefix for all splits (digits only)
    ksSuffixLength?: number;  // Length for zero-padding KS suffix (configured once, applies to all splits)
    splits: PaymentSplit[];   // 1-3 payment splits
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
    const { t } = useI18n();
    const [isEditing, setIsEditing] = useState(false);
    const [editEvent, setEditEvent] = useState<EventConfig>({
        id: '',
        description: '',
        vsPrefix: '',
        vsSuffixLength: 6,  // Default: 6-digit suffix
        ssPrefix: '',
        ssSuffixLength: 6,
        ksPrefix: '',
        ksSuffixLength: 4,  // KS is typically 4 digits total
        splits: [{ amount: 100 }],  // Splits inherit from event by default
        emailTemplate: t.defaultEmailTemplate,
    });

    const handleAddEvent = () => {
        const newEvent: EventConfig = {
            id: crypto.randomUUID(),
            description: t.newEvent.replace('+ ', ''),
            vsPrefix: '',
            vsSuffixLength: 6,
            ssPrefix: '',
            ssSuffixLength: 6,
            ksPrefix: '',
            ksSuffixLength: 4,
            splits: [{ amount: 100 }],
            emailTemplate: t.defaultEmailTemplate,
        };
        setEditEvent(newEvent);
        setIsEditing(true);
    };

    const handleEditEvent = (event: EventConfig) => {
        setEditEvent({ ...event });
        setIsEditing(true);
    };

    const handleDeleteEvent = (id: string) => {
        if (confirm(`${t.deleteEventConfirm}?`)) {
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
            alert(t.required);
            return;
        }

        if (editEvent.splits.length === 0 || editEvent.splits.length > 3) {
            alert(t.paymentSplits);
            return;
        }

        // Validate each split
        for (let i = 0; i < editEvent.splits.length; i++) {
            const split = editEvent.splits[i];
            if (!split.amount || split.amount <= 0) {
                alert(`${t.split} ${i + 1}: ${t.invalidAmount}`);
                return;
            }
            // Validate VS prefix is numeric only
            if (split.vsPrefix && !/^\d*$/.test(split.vsPrefix)) {
                alert(`${t.split} ${i + 1}: VS prefix must be numeric only`);
                return;
            }
            // Validate KS prefix is numeric only (and 4 digits if provided)
            if (split.ksPrefix && !/^\d{0,4}$/.test(split.ksPrefix)) {
                alert(`${t.split} ${i + 1}: KS must be 4 digits or less`);
                return;
            }
            // Validate SS prefix is numeric only
            if (split.ssPrefix && !/^\d*$/.test(split.ssPrefix)) {
                alert(`${t.split} ${i + 1}: SS prefix must be numeric only`);
                return;
            }
        }
        
        // Validate event-level prefixes
        if (editEvent.vsPrefix && !/^\d*$/.test(editEvent.vsPrefix)) {
            alert('VS prefix must be numeric only');
            return;
        }
        if (editEvent.ksPrefix && !/^\d{0,4}$/.test(editEvent.ksPrefix)) {
            alert('KS must be 4 digits or less');
            return;
        }
        if (editEvent.ssPrefix && !/^\d*$/.test(editEvent.ssPrefix)) {
            alert('SS prefix must be numeric only');
            return;
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
        // Include UTF-8 BOM for better compatibility
        const dataBlob = new Blob(['\uFEFF' + dataStr], { type: 'application/json;charset=utf-8' });
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
                    alert(t.importedEventsSuccess.replace('{count}', importedEvents.length.toString()));
                } else {
                    alert(t.error);
                }
            } catch (error) {
                alert(t.error);
                console.error(error);
            }
        };
        // Explicitly specify UTF-8 encoding for proper character handling
        reader.readAsText(file, 'UTF-8');
    };

    if (isEditing) {
        return (
            <div className="space-y-4 border p-4 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-medium text-green-900">
                    {events.find((e) => e.id === editEvent.id) ? t.editEvent : t.newEvent.replace('+ ', '')}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-green-800">{t.description}</label>
                        <input
                            type="text"
                            value={editEvent.description}
                            onInput={(e) => setEditEvent({ ...editEvent, description: (e.target as HTMLInputElement).value })}
                            className="mt-1 block w-full rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2"
                            placeholder={t.descriptionPlaceholder}
                        />
                    </div>

                    {/* Symbol Configuration */}
                    <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30 space-y-3">
                        <div className="bg-blue-100 border border-blue-300 rounded p-2 mb-2">
                            <p className="text-xs text-blue-800 font-medium">ℹ️ Global Configuration for All Splits</p>
                            <p className="text-xs text-blue-700 mt-1">
                                Set <strong>default prefix</strong> and <strong>suffix length</strong> here. These apply to all splits.
                                Individual splits can override the prefix if needed (see split settings below).
                            </p>
                        </div>

                        <h4 className="text-sm font-semibold text-blue-900">Variable Symbol (VS) - Required</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-blue-700">VS Prefix (digits only, default for all splits)</label>
                                <input
                                    type="text"
                                    value={editEvent.vsPrefix}
                                    onInput={(e) => setEditEvent({ ...editEvent, vsPrefix: (e.target as HTMLInputElement).value })}
                                    className="mt-1 block w-full rounded border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-1.5"
                                    placeholder="e.g., 2025"
                                />
                                <p className="text-xs text-gray-500 mt-0.5">Default prefix (can override per split)</p>
                            </div>
                            {editEvent.vsPrefix && (
                                <div>
                                    <label className="block text-xs text-blue-700">VS Suffix Length (global for all splits)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={editEvent.vsSuffixLength}
                                        onInput={(e) => setEditEvent({ ...editEvent, vsSuffixLength: parseInt((e.target as HTMLInputElement).value) || 6 })}
                                        className="mt-1 block w-full rounded border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-1.5"
                                        placeholder="6"
                                    />
                                    <p className="text-xs text-gray-500 mt-0.5">Padding (6→000001). Use 0=no padding. Suffix: VS column or row #</p>
                                </div>
                            )}
                        </div>
                        
                        <h4 className="text-sm font-semibold text-blue-900 pt-2">Specific Symbol (SS) - Optional</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-blue-700">SS Prefix (digits only, default for all splits)</label>
                                <input
                                    type="text"
                                    value={editEvent.ssPrefix || ''}
                                    onInput={(e) => setEditEvent({ ...editEvent, ssPrefix: (e.target as HTMLInputElement).value })}
                                    className="mt-1 block w-full rounded border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-1.5"
                                    placeholder="e.g., 12345 (optional)"
                                />
                                <p className="text-xs text-gray-500 mt-0.5">Default prefix. SS composed only if people data has SS column</p>
                            </div>
                            <div>
                                <label className="block text-xs text-blue-700">SS Suffix Length (global for all splits)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={editEvent.ssSuffixLength !== undefined ? editEvent.ssSuffixLength : 6}
                                    onInput={(e) => setEditEvent({ ...editEvent, ssSuffixLength: parseInt((e.target as HTMLInputElement).value) || 6 })}
                                    className="mt-1 block w-full rounded border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-1.5"
                                    placeholder="6"
                                />
                                <p className="text-xs text-gray-500 mt-0.5">Padding (6→000001). Use 0=no padding. Suffix from SS column</p>
                            </div>
                        </div>
                        
                        <h4 className="text-sm font-semibold text-blue-900 pt-2">Constant Symbol (KS) - Optional</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-blue-700">KS Prefix (digits only, default for all splits)</label>
                                <input
                                    type="text"
                                    value={editEvent.ksPrefix || ''}
                                    onInput={(e) => setEditEvent({ ...editEvent, ksPrefix: (e.target as HTMLInputElement).value })}
                                    className="mt-1 block w-full rounded border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-1.5"
                                    placeholder="e.g., 0308 (optional)"
                                    maxLength={4}
                                />
                                <p className="text-xs text-gray-500 mt-0.5">Default prefix. KS composed only if people data has KS column</p>
                            </div>
                            <div>
                                <label className="block text-xs text-blue-700">KS Suffix Length (global for all splits)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="4"
                                    value={editEvent.ksSuffixLength !== undefined ? editEvent.ksSuffixLength : 4}
                                    onInput={(e) => setEditEvent({ ...editEvent, ksSuffixLength: parseInt((e.target as HTMLInputElement).value) })}
                                    className="mt-1 block w-full rounded border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm border p-1.5"
                                    placeholder="4"
                                />
                                <p className="text-xs text-gray-500 mt-0.5">Padding (2→08). Use 0=no padding, value as-is from KS column</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-green-800">{t.paymentSplits}</label>
                            <button
                                onClick={addSplit}
                                disabled={editEvent.splits.length >= 3}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-30"
                            >
                                {t.addSplit}
                            </button>
                        </div>
                        {editEvent.splits.map((split, index) => (
                            <div key={index} className="border border-green-200 rounded p-3 space-y-2 bg-green-50/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-green-700">{t.split} {index + 1}</span>
                                    {editEvent.splits.length > 1 && (
                                        <button
                                            onClick={() => removeSplit(index)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            {t.remove}
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-green-700">{t.amount} (CZK)</label>
                                        <input
                                            type="number"
                                            value={split.amount}
                                            onInput={(e) => updateSplit(index, 'amount', parseFloat((e.target as HTMLInputElement).value) || 0)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-green-700">{t.dueDate}</label>
                                        <input
                                            type="date"
                                            value={split.dueDate || ''}
                                            onInput={(e) => updateSplit(index, 'dueDate', (e.target as HTMLInputElement).value)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                        />
                                    </div>
                                    <div className="col-span-3 bg-green-50 border border-green-200 rounded p-2 mb-2">
                                        <p className="text-xs text-green-800">
                                            <strong>ℹ️ Split Overrides (Optional):</strong> Override prefix values below if this split needs different values.
                                            Suffix length always comes from event configuration above.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-green-700">VS Prefix Override</label>
                                        <input
                                            type="text"
                                            value={split.vsPrefix || ''}
                                            onInput={(e) => updateSplit(index, 'vsPrefix', (e.target as HTMLInputElement).value)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                            placeholder="e.g., 771 (digits only)"
                                        />
                                        <p className="text-xs text-gray-500 mt-0.5">Override event VS prefix for this split only</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-green-700">SS Prefix Override</label>
                                        <input
                                            type="text"
                                            value={split.ssPrefix || ''}
                                            onInput={(e) => updateSplit(index, 'ssPrefix', (e.target as HTMLInputElement).value)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                            placeholder="e.g., 12345 (optional)"
                                        />
                                        <p className="text-xs text-gray-500 mt-0.5">Override event SS prefix for this split only</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-green-700">KS Prefix Override</label>
                                        <input
                                            type="text"
                                            value={split.ksPrefix || ''}
                                            onInput={(e) => updateSplit(index, 'ksPrefix', (e.target as HTMLInputElement).value)}
                                            className="mt-1 block w-full rounded border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm border p-1.5"
                                            placeholder="e.g., 0308 (optional)"
                                            maxLength={4}
                                        />
                                        <p className="text-xs text-gray-500 mt-0.5">Override event KS prefix for this split only</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-green-800">{t.emailTemplate}</label>
                        <textarea
                            value={editEvent.emailTemplate}
                            onInput={(e) => setEditEvent({ ...editEvent, emailTemplate: (e.target as HTMLTextAreaElement).value })}
                            className="mt-1 block w-full rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm border p-2 font-mono text-xs"
                            rows={4}
                            placeholder={t.emailTemplatePlaceholder}
                        />
                        <p className="mt-1 text-xs text-gray-500">{t.emailTemplateHelp}</p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            {t.saveEvent}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-green-900">{t.selectEvent}</label>
                <div className="flex gap-2">
                    <label className="text-sm text-green-700 hover:text-green-900 font-medium bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition-colors cursor-pointer">
                        {t.import}
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
                        {t.export}
                    </button>
                    <button
                        onClick={handleAddEvent}
                        className="text-sm text-green-700 hover:text-green-900 font-medium bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                    >
                        {t.newEvent}
                    </button>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-6 text-green-600 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                    {t.noEventsCreated}
                    <br />
                    <button onClick={handleAddEvent} className="text-green-700 font-medium hover:underline mt-2">{t.createOne}</button>
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
                                    {event.splits.length} {t.payments} • {t.total}: {event.splits.reduce((sum, s) => sum + s.amount, 0)} CZK
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded"
                                    title={t.edit}
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title={t.delete}
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
