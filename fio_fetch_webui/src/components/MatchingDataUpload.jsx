import { useState, useCallback, useEffect } from 'preact/hooks';
import { uploadMatchingData, getMatchingStats, getMatchingData } from '../services/api';
import useAppStore from '../store/useAppStore';
import * as XLSX from 'xlsx';

function MatchingDataUpload() {
    const { matchingStats, setMatchingStats, setMatchingData } = useAppStore();
    
    // Load matching data on mount
    useEffect(() => {
        const loadMatchingData = async () => {
            try {
                const [stats, data] = await Promise.all([getMatchingStats(), getMatchingData()]);
                setMatchingStats(stats);
                setMatchingData(data);
            } catch (error) {
                console.error('Failed to load matching data:', error);
            }
        };
        loadMatchingData();
    }, [setMatchingStats, setMatchingData]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const processFile = useCallback(async (file) => {
        setError('');
        setSuccess('');
        setUploading(true);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target.result;
                    let parsedData;

                    // Parse file based on extension
                    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        const wb = XLSX.read(data, {
                            type: 'array',
                            codepage: 65001, // UTF-8
                            cellDates: false,
                            cellNF: false,
                            cellText: false,
                        });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        parsedData = XLSX.utils.sheet_to_json(ws, {
                            header: 1,
                            raw: false,
                            defval: '',
                        });
                    } else if (file.name.endsWith('.csv')) {
                        const wb = XLSX.read(data, {
                            type: 'string',
                            codepage: 65001,
                            raw: false,
                            cellDates: false,
                            cellNF: false,
                            cellText: false,
                        });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        parsedData = XLSX.utils.sheet_to_json(ws, {
                            header: 1,
                            raw: false,
                            defval: '',
                        });
                    } else if (file.name.endsWith('.tsv')) {
                        // TSV is tab-separated, treat as CSV with different delimiter
                        const text = new TextDecoder('utf-8').decode(data);
                        const wb = XLSX.read(text, {
                            type: 'string',
                            codepage: 65001,
                            raw: false,
                            cellDates: false,
                            cellNF: false,
                            cellText: false,
                            FS: '\t', // Tab separator
                        });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        parsedData = XLSX.utils.sheet_to_json(ws, {
                            header: 1,
                            raw: false,
                            defval: '',
                        });
                    } else {
                        throw new Error('Unsupported file format. Please use CSV, TSV, or XLSX.');
                    }

                    if (!parsedData || parsedData.length === 0) {
                        throw new Error('File is empty or could not be parsed.');
                    }

                    // Find header row (look for VS, SS, KS columns)
                    let headerRowIndex = -1;
                    let vsIndex = -1;
                    let ssIndex = -1;
                    let ksIndex = -1;

                    for (let i = 0; i < Math.min(5, parsedData.length); i++) {
                        const row = parsedData[i].map((cell) => String(cell || '').toLowerCase().trim());
                        const vsIdx = row.findIndex((cell) =>
                            ['vs', 'variable symbol', 'variabilní symbol', 'variable_symbol'].includes(cell)
                        );
                        const ssIdx = row.findIndex((cell) =>
                            ['ss', 'specific symbol', 'specifický symbol', 'specific_symbol'].includes(cell)
                        );
                        const ksIdx = row.findIndex((cell) =>
                            ['ks', 'constant symbol', 'konstantní symbol', 'constant_symbol'].includes(cell)
                        );

                        if (vsIdx !== -1 && ssIdx !== -1) {
                            headerRowIndex = i;
                            vsIndex = vsIdx;
                            ssIndex = ssIdx;
                            ksIndex = ksIdx !== -1 ? ksIdx : -1;
                            break;
                        }
                    }

                    if (headerRowIndex === -1 || vsIndex === -1 || ssIndex === -1) {
                        throw new Error(
                            'Could not find VS and SS columns. Please ensure your file has headers: VS (Variable Symbol) and SS (Specific Symbol). KS (Constant Symbol) is optional.'
                        );
                    }

                    // Process data rows
                    const rows = [];
                    for (let i = headerRowIndex + 1; i < parsedData.length; i++) {
                        const row = parsedData[i];
                        if (!row || row.length === 0) continue;

                        const vs = String(row[vsIndex] || '').trim();
                        const ss = String(row[ssIndex] || '').trim();
                        const ks = ksIndex !== -1 ? String(row[ksIndex] || '').trim() : null;

                        if (!vs && !ss) continue; // Skip empty rows

                        rows.push({
                            variable_symbol: vs || null,
                            specific_symbol: ss || null,
                            constant_symbol: ks || null,
                            row_data: row.reduce((acc, val, idx) => {
                                acc[`col_${idx}`] = String(val || '');
                                return acc;
                            }, {}),
                        });
                    }

                    if (rows.length === 0) {
                        throw new Error('No valid data rows found. Please check your file format.');
                    }

                    // Upload to backend
                    const result = await uploadMatchingData(rows);
                    setSuccess(result.message || `Successfully uploaded ${rows.length} matching data row(s)`);

                    // Refresh stats and data from API
                    const [matchingStatsResult, matchingDataResult] = await Promise.all([getMatchingStats(), getMatchingData()]);
                    setMatchingStats(matchingStatsResult);
                    setMatchingData(matchingDataResult);

                    // Clear success message after 5 seconds
                    setTimeout(() => setSuccess(''), 5000);
                } catch (err) {
                    console.error('File processing error:', err);
                    setError(err.message || 'Failed to process file. Please check the format.');
                } finally {
                    setUploading(false);
                }
            };

            if (file.name.endsWith('.tsv')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        } catch (err) {
            console.error('File upload error:', err);
            setError(err.message || 'Failed to upload file.');
            setUploading(false);
        }
    }, [setMatchingStats, setMatchingData]);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    if (matchingStats && matchingStats.total_matching_rows > 0) {
        return (
            <div className="card mb-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="card-header">
                    <h3>Matching Data</h3>
                </div>
                <div className="flex flex-col gap-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-secondary mb-xs">Matching Statistics</div>
                            <div className="font-medium">
                                {matchingStats.matched_transactions} of {matchingStats.total_transactions} transactions
                                matched
                            </div>
                            <div className="text-sm text-secondary mt-xs">
                                {matchingStats.total_matching_rows} matching row(s) loaded
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="badge badge-danger" style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="badge badge-success" style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>
                            {success}
                        </div>
                    )}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-lg)',
                            textAlign: 'center',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                        }}
                    >
                        <input
                            type="file"
                            accept=".csv,.tsv,.xlsx,.xls"
                            onChange={handleFileChange}
                            disabled={uploading}
                            style={{ display: 'none' }}
                            id="matching-file-input"
                        />
                        <label htmlFor="matching-file-input" style={{ cursor: 'pointer' }}>
                            <div className="text-lg mb-sm">📁</div>
                            <div className="font-medium mb-xs">
                                {uploading ? 'Processing...' : 'Drop file here or click to upload'}
                            </div>
                            <div className="text-sm text-secondary">
                                Supports CSV, TSV, or XLSX files with VS, SS, and optional KS columns
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card mb-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="card-header">
                <h3>Upload Matching Data</h3>
            </div>
            <div className="flex flex-col gap-md">
                <p className="text-sm text-secondary">
                    Upload a file (CSV, TSV, or XLSX) with VS (Variable Symbol) and SS (Specific Symbol) columns to
                    match transactions. KS (Constant Symbol) is optional.
                </p>
                {error && (
                    <div className="badge badge-danger" style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="badge badge-success" style={{ padding: 'var(--space-md)', fontSize: '0.875rem' }}>
                        {success}
                    </div>
                )}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-lg)',
                        textAlign: 'center',
                        background: 'var(--bg-primary)',
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="file"
                        accept=".csv,.tsv,.xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={uploading}
                        style={{ display: 'none' }}
                        id="matching-file-input"
                    />
                    <label htmlFor="matching-file-input" style={{ cursor: 'pointer' }}>
                        <div className="text-lg mb-sm">📁</div>
                        <div className="font-medium mb-xs">
                            {uploading ? 'Processing...' : 'Drop file here or click to upload'}
                        </div>
                        <div className="text-sm text-secondary">
                            Supports CSV, TSV, or XLSX files with VS, SS, and optional KS columns
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}

export default MatchingDataUpload;

