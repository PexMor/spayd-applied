import { useState } from 'preact/hooks';
import * as XLSX from 'xlsx';
import { BatchData } from '../BatchApp';

interface DataUploadProps {
    onDataLoaded: (data: BatchData) => void;
}

export function DataUpload({ onDataLoaded }: DataUploadProps) {
    const [fileName, setFileName] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [tsvData, setTsvData] = useState<string>('');

    const processData = (data: any[]) => {
        if (data.length === 0) {
            setError('Data is empty');
            return;
        }

        const headers = data[0] as string[];
        const rows = data.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, i) => {
                obj[header] = row[i];
            });
            return obj;
        });

        onDataLoaded({ headers, rows });
        setError('');
    };

    const handleFileUpload = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError('');

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                processData(data);
            } catch (err) {
                console.error(err);
                setError('Failed to parse file');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleTsvPaste = () => {
        if (!tsvData.trim()) return;
        try {
            const wb = XLSX.read(tsvData, { type: 'string', raw: true });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            processData(data);
            setFileName('Pasted Data');
        } catch (err) {
            console.error(err);
            setError('Failed to parse pasted data');
        }
    };

    const loadDemoData = () => {
        const demoHeaders = ['Amount', 'VS', 'Email', 'FirstName'];
        const demoRows = [
            ['100.50', '123456', 'john@example.com', 'John'],
            ['250.00', '789012', 'jane@example.com', 'Jane'],
            ['1500.00', '345678', 'bob@example.com', 'Bob'],
        ];
        processData([demoHeaders, ...demoRows]);
        setFileName('Demo Data');
    };

    return (
        <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                />
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                >
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-sm font-medium text-gray-700">
                        {fileName || 'Click to upload CSV or Excel file'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                        .xlsx, .xls, .csv supported
                    </span>
                </label>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-sm text-gray-500">OR</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paste Data (Excel/TSV)</label>
                <textarea
                    value={tsvData}
                    onInput={(e) => setTsvData((e.target as HTMLTextAreaElement).value)}
                    className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 font-mono text-xs"
                    placeholder={`Amount\tVS\tEmail\tFirstName\n100\t123\tjohn@doe.com\tJohn`}
                />
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={handleTsvPaste}
                        disabled={!tsvData.trim()}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
                    >
                        Load Pasted Data
                    </button>
                    <button
                        onClick={loadDemoData}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm ml-auto"
                    >
                        Load Demo Data
                    </button>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
}

