import { useState } from 'preact/hooks';

interface ManualPaymentEntryProps {
    onAddPayment: (payment: any) => void;
    headers: string[];
}

export function ManualPaymentEntry({ onAddPayment, headers }: ManualPaymentEntryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [payment, setPayment] = useState<any>({});

    // Default fields if headers are empty
    const fields = headers.length > 0 ? headers : ['Amount', 'VS', 'Email', 'FirstName'];

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        onAddPayment(payment);
        setPayment({});
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
                + Add Single Payment Manually
            </button>
        );
    }

    return (
        <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-3">Add Manual Payment</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fields.map((field) => (
                        <div key={field}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{field}</label>
                            <input
                                type="text"
                                value={payment[field] || ''}
                                onInput={(e) => setPayment({ ...payment, [field]: (e.target as HTMLInputElement).value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Add Payment
                    </button>
                </div>
            </form>
        </div>
    );
}
