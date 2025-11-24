import { useState } from 'preact/hooks';
import { useI18n } from '../../I18nContext';
import * as XLSX from 'xlsx';
import { BatchData } from '../BatchApp';

interface PeopleDataManagerProps {
    data: BatchData | null;
    onDataChange: (data: BatchData | null) => void;
}

export function PeopleDataManager({ data, onDataChange }: PeopleDataManagerProps) {
    const { t } = useI18n();
    const [isUploadOpen, setIsUploadOpen] = useState(!data);
    const [error, setError] = useState<string>('');
    const [tsvData, setTsvData] = useState<string>('');

    // Ensure we have data to work with if null
    const currentData = data || { headers: [], rows: [] };

    const processData = (newData: any[]) => {
        if (newData.length === 0) {
            setError(t.dataIsEmpty);
            return;
        }

        const headers = newData[0] as string[];
        const rows = newData.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, i) => {
                obj[header] = row[i];
            });
            return obj;
        });

        onDataChange({ headers, rows });
        setError('');
        setIsUploadOpen(false);
    };

    const handleFileUpload = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        setError('');
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const parsedData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                processData(parsedData);
            } catch (err) {
                console.error(err);
                setError(t.failedToParseFile);
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
            const parsedData = XLSX.utils.sheet_to_json(ws, { header: 1 });
            processData(parsedData);
        } catch (err) {
            console.error(err);
            setError(t.failedToParsePastedData);
        }
    };

    const loadDemoData = () => {
        const demoHeaders = ['VS', 'FirstName', 'SecondName', 'Email'];
        const demoRows = [
            ['', 'John', 'Doe', 'john.doe@example.com'],
            ['456', 'Jane', 'Smith', 'jane.smith@example.com'],
            ['', 'Bob', 'Johnson', 'bob.johnson@example.com'],
        ];
        processData([demoHeaders, ...demoRows]);
    };

    const updateCell = (rowIndex: number, header: string, value: string) => {
        const newRows = [...currentData.rows];
        newRows[rowIndex] = { ...newRows[rowIndex], [header]: value };
        onDataChange({ ...currentData, rows: newRows });
    };

    const deleteRow = (rowIndex: number) => {
        const newRows = currentData.rows.filter((_, i) => i !== rowIndex);
        onDataChange({ ...currentData, rows: newRows });
    };

    const addRow = () => {
        const newRow: any = {};
        currentData.headers.forEach(h => newRow[h] = '');
        onDataChange({ ...currentData, rows: [...currentData.rows, newRow] });
    };

    const clearData = () => {
        if (confirm(t.clearAllConfirm)) {
            onDataChange(null);
            setIsUploadOpen(true);
        }
    };

    const handleExport = () => {
        if (!data) return;
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'people_data.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJson = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const importedData = JSON.parse(evt.target?.result as string);
                if (importedData && Array.isArray(importedData.headers) && Array.isArray(importedData.rows)) {
                    onDataChange(importedData);
                    setIsUploadOpen(false);
                    alert(t.importedRecipientsSuccess.replace('{count}', importedData.rows.length.toString()));
                } else {
                    alert(t.error);
                }
            } catch (error) {
                alert(t.error);
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    if (!data || isUploadOpen) {
        return (
            <div className="space-y-6">
                <div className="flex gap-4">
                    <button
                        onClick={loadDemoData}
                        className="flex-1 py-8 border-2 border-dashed border-orange-300 bg-orange-50 rounded-lg text-orange-700 hover:bg-orange-100 hover:border-orange-400 transition-colors flex flex-col items-center justify-center gap-2"
                    >
                        <span className="text-2xl">🎲</span>
                        <span className="font-medium">{t.loadDemoData}</span>
                    </button>

                    <label className="flex-1 py-8 border-2 border-dashed border-orange-300 bg-orange-50 rounded-lg text-orange-700 hover:bg-orange-100 hover:border-orange-400 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer">
                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                        <span className="text-2xl">📂</span>
                        <span className="font-medium">{t.uploadExcelCsv}</span>
                    </label>

                    <label className="flex-1 py-8 border-2 border-dashed border-orange-300 bg-orange-50 rounded-lg text-orange-700 hover:bg-orange-100 hover:border-orange-400 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer">
                        <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                        <span className="text-2xl">📥</span>
                        <span className="font-medium">{t.importJson}</span>
                    </label>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-orange-200" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-sm text-orange-400">{t.orPasteData}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <textarea
                        value={tsvData}
                        onInput={(e) => setTsvData((e.target as HTMLTextAreaElement).value)}
                        className="w-full h-32 rounded-md border-orange-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm border p-3 font-mono text-xs bg-orange-50/30 placeholder-orange-300"
                        placeholder={t.placeholderTsv}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsUploadOpen(false)}
                            disabled={!data}
                            className="flex-1 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                            {t.cancel}
                        </button>
                        <button
                            onClick={handleTsvPaste}
                            disabled={!tsvData.trim()}
                            className="flex-1 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                        >
                            {t.loadPastedData}
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="text-sm text-orange-800">
                    <strong>{data.rows.length}</strong> {t.recipientsLoaded}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                    >
                        {t.export}
                    </button>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                    >
                        {t.importMore}
                    </button>
                    <button
                        onClick={clearData}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                    >
                        {t.clearAll}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border border-orange-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-orange-200">
                    <thead className="bg-orange-50">
                        <tr>
                            {data.headers.map((header) => (
                                <th key={header} className="px-3 py-2 text-left text-xs font-medium text-orange-800 uppercase tracking-wider whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                            <th className="px-3 py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-orange-100">
                        {data.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-orange-50/30 transition-colors group">
                                {data.headers.map((header) => (
                                    <td key={`${rowIndex}-${header}`} className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-700">
                                        <input
                                            type="text"
                                            value={row[header] || ''}
                                            onInput={(e) => updateCell(rowIndex, header, (e.target as HTMLInputElement).value)}
                                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-orange-500 rounded px-1 py-0.5 -mx-1"
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-1.5 text-right whitespace-nowrap">
                                    <button
                                        onClick={() => deleteRow(rowIndex)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        title={t.delete}
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                onClick={addRow}
                className="w-full py-2 border-2 border-dashed border-orange-200 rounded-lg text-orange-400 hover:border-orange-400 hover:text-orange-600 transition-all text-sm font-medium"
            >
                {t.addRow}
            </button>
        </div>
    );
}
