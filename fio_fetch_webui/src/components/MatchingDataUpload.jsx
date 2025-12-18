import { useState, useCallback, useEffect } from 'preact/hooks';
import { uploadMatchingData, getMatchingStats, getMatchingData, fetchMatchingDataFromUrl } from '../services/api';
import useAppStore from '../store/useAppStore';
import * as XLSX from 'xlsx';

// Matching Data Viewer Modal
function MatchingDataViewerModal({ isOpen, onClose, data }) {
    const [page, setPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const pageSize = 20;

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Filter data based on search term
    const filteredData = searchTerm
        ? data.filter(item => 
            (item.variable_symbol && item.variable_symbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.specific_symbol && item.specific_symbol.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.constant_symbol && item.constant_symbol.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : data;

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredData.length);
    const currentPageData = filteredData.slice(startIndex, endIndex);

    // Reset to first page when search changes
    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    return (
        <div className="matching-viewer-overlay" onClick={onClose}>
            <div className="matching-viewer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="matching-viewer-header">
                    <h3>📋 Matching Data ({filteredData.length} entries)</h3>
                    <button onClick={onClose} className="matching-viewer-close">✕</button>
                </div>
                
                <div className="matching-viewer-toolbar">
                    <input
                        type="text"
                        placeholder="Search VS, SS, or KS..."
                        value={searchTerm}
                        onInput={(e) => setSearchTerm(e.target.value)}
                        className="matching-viewer-search"
                    />
                    <div className="matching-viewer-pagination">
                        <button 
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="btn-secondary"
                        >
                            ← Prev
                        </button>
                        <span className="matching-viewer-page-info">
                            {startIndex + 1}-{endIndex} of {filteredData.length}
                        </span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="btn-secondary"
                        >
                            Next →
                        </button>
                    </div>
                </div>

                <div className="matching-viewer-content">
                    {currentPageData.length === 0 ? (
                        <div className="matching-viewer-empty">
                            {searchTerm ? 'No matching entries found' : 'No matching data loaded'}
                        </div>
                    ) : (
                        <>
                            {/* Desktop table view */}
                            <table className="matching-viewer-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Variable Symbol (VS)</th>
                                        <th>Specific Symbol (SS)</th>
                                        <th>Constant Symbol (KS)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPageData.map((item, idx) => (
                                        <tr key={item.id || startIndex + idx}>
                                            <td className="text-secondary">{startIndex + idx + 1}</td>
                                            <td>
                                                <code className="matching-viewer-code">{item.variable_symbol || '-'}</code>
                                            </td>
                                            <td>
                                                <code className="matching-viewer-code">{item.specific_symbol || '-'}</code>
                                            </td>
                                            <td>
                                                <code className="matching-viewer-code">{item.constant_symbol || '-'}</code>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Mobile card view */}
                            <div className="matching-viewer-cards">
                                {currentPageData.map((item, idx) => (
                                    <div key={item.id || startIndex + idx} className="matching-viewer-card">
                                        <div className="matching-viewer-card-header">
                                            <span className="text-secondary">#{startIndex + idx + 1}</span>
                                        </div>
                                        <div className="matching-viewer-card-body">
                                            <div className="matching-viewer-card-row">
                                                <span className="matching-viewer-card-label">VS:</span>
                                                <code className="matching-viewer-code">{item.variable_symbol || '-'}</code>
                                            </div>
                                            <div className="matching-viewer-card-row">
                                                <span className="matching-viewer-card-label">SS:</span>
                                                <code className="matching-viewer-code">{item.specific_symbol || '-'}</code>
                                            </div>
                                            <div className="matching-viewer-card-row">
                                                <span className="matching-viewer-card-label">KS:</span>
                                                <code className="matching-viewer-code">{item.constant_symbol || '-'}</code>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="matching-viewer-footer">
                    <span className="text-sm text-secondary">
                        Page {totalPages > 0 ? page + 1 : 0} of {totalPages}
                    </span>
                </div>
            </div>
        </div>
    );
}

function MatchingDataUpload() {
    const { matchingStats, setMatchingStats, setMatchingData, matchingDataUrl, matchingData } = useAppStore();
    
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
    const [fetchingFromUrl, setFetchingFromUrl] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showViewer, setShowViewer] = useState(false);

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

    const handleFetchFromUrl = useCallback(async () => {
        if (!matchingDataUrl) return;

        setError('');
        setSuccess('');
        setFetchingFromUrl(true);

        try {
            // Fetch data from the external URL
            const data = await fetchMatchingDataFromUrl(matchingDataUrl);

            // Validate the data format
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format: expected an array');
            }

            // Upload to our backend
            const result = await uploadMatchingData(data);
            setSuccess(result.message || `Successfully imported ${data.length} matching entries from URL`);

            // Refresh stats and data from API
            const [matchingStatsResult, matchingDataResult] = await Promise.all([getMatchingStats(), getMatchingData()]);
            setMatchingStats(matchingStatsResult);
            setMatchingData(matchingDataResult);

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Failed to fetch matching data from URL:', err);
            setError(err.message || 'Failed to fetch matching data from URL');
        } finally {
            setFetchingFromUrl(false);
        }
    }, [matchingDataUrl, setMatchingStats, setMatchingData]);

    if (matchingStats && matchingStats.total_matching_rows > 0) {
        return (
            <>
            <MatchingDataViewerModal 
                isOpen={showViewer} 
                onClose={() => setShowViewer(false)} 
                data={matchingData || []} 
            />
            <div className="card mb-lg" style={{ background: 'var(--bg-secondary)' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Matching Data</h3>
                    <button
                        onClick={() => setShowViewer(true)}
                        className="btn-secondary"
                        style={{ padding: 'var(--space-xs) var(--space-sm)', fontSize: '0.75rem' }}
                    >
                        👁️ View Data
                    </button>
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
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            border: '2px dashed var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-md)',
                            textAlign: 'center',
                            background: 'var(--bg-primary)',
                            cursor: 'pointer',
                        }}
                    >
                        <input
                            type="file"
                            accept=".csv,.tsv,.xlsx,.xls"
                            onChange={handleFileChange}
                            disabled={uploading || fetchingFromUrl}
                            style={{ display: 'none' }}
                            id="matching-file-input"
                        />
                        <label htmlFor="matching-file-input" style={{ cursor: 'pointer' }}>
                            <div className="text-lg mb-xs">📁</div>
                            <div className="font-medium text-sm mb-xs">
                                {uploading ? 'Processing...' : 'Drop file or click'}
                            </div>
                            <div className="text-xs text-secondary">
                                CSV, TSV, XLSX
                            </div>
                        </label>
                    </div>
                    {matchingDataUrl && (
                        <button
                            onClick={handleFetchFromUrl}
                            disabled={fetchingFromUrl || uploading}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 'var(--space-md)',
                                minWidth: '120px',
                            }}
                        >
                            {fetchingFromUrl ? (
                                <>
                                    <div className="spinner" style={{ width: '1.5rem', height: '1.5rem', borderWidth: '2px', marginBottom: 'var(--space-xs)' }}></div>
                                    <span className="text-sm">Fetching...</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>📥</span>
                                    <span className="text-sm font-medium">Fetch from URL</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
        </>
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
                {matchingDataUrl && ' Or fetch from the configured URL.'}
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
            <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                        flex: 1,
                        minWidth: '200px',
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
                        disabled={uploading || fetchingFromUrl}
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
                {matchingDataUrl && (
                    <button
                        onClick={handleFetchFromUrl}
                        disabled={fetchingFromUrl || uploading}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'var(--space-lg)',
                            minWidth: '150px',
                        }}
                    >
                        {fetchingFromUrl ? (
                            <>
                                <div className="spinner" style={{ width: '2rem', height: '2rem', borderWidth: '2px', marginBottom: 'var(--space-sm)' }}></div>
                                <span>Fetching...</span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '1.5rem', marginBottom: 'var(--space-sm)' }}>📥</span>
                                <span className="font-medium">Fetch from URL</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    </div>
);
}

export default MatchingDataUpload;

