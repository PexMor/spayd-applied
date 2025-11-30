import { useState, useEffect } from 'preact/hooks';
import { useI18n } from '../../I18nContext';
import { BatchConfig, BatchData } from '../BatchApp';
import { generateEmailHtml, generateBatchZip } from '../services/email-generator';
import QRCode from 'qrcode';
import spayd from 'spayd';
import { IBAN } from 'ibankit';
import { composeVS, composeSS, composeKS, symbolToNumber, isValidNumericSymbol } from '../utils/symbol-composer';

interface EmailPreviewProps {
    data: BatchData;
    config: BatchConfig;
}

export function EmailPreview({ data, config }: EmailPreviewProps) {
    const { t, locale } = useI18n();
    const [selectedRowIndex, setSelectedRowIndex] = useState(0);
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        generatePreview();
    }, [data, config, selectedRowIndex, t, locale]);

    // Removed - now using composeVS, composeSS, composeKS from symbol-composer.ts

    const generatePreview = async () => {
        if (!data || data.rows.length === 0) {
            setPreviewHtml('');
            return;
        }

        if (!config.account.iban) {
            setPreviewHtml(`<div class="p-8 text-center text-gray-500">${t.pleaseSelectAccountFirst}</div>`);
            return;
        }

        if (!config.event) {
            setPreviewHtml(`<div class="p-8 text-center text-gray-500">${t.pleaseSelectEventFirst}</div>`);
            return;
        }

        if (config.event.splits.length === 0) {
            setPreviewHtml(`<div class="p-8 text-center text-orange-500">${t.eventHasNoSplits}</div>`);
            return;
        }

        const row = data.rows[selectedRowIndex];

        try {
            // Use ibankit's electronicFormat method to validate and convert
            const ibanElectronic = IBAN.electronicFormat(config.account.iban);
            if (!ibanElectronic || !IBAN.isValid(config.account.iban)) {
                setPreviewHtml(`<div class="p-8 text-center text-red-500">${t.invalidIbanFormat}</div>`);
                return;
            }

            // Generate QR codes for each split
            const qrCodes: string[] = [];
            for (let i = 0; i < config.event.splits.length; i++) {
                const split = config.event.splits[i];
                const vs = composeVS(
                    config.event.vsPrefix,
                    config.event.vsSuffixLength,
                    row['VS'] || '',
                    selectedRowIndex,
                    split.vsPrefix  // Split can override prefix only
                );
                const ss = composeSS(
                    config.event.ssPrefix,
                    config.event.ssSuffixLength,
                    row['SS'] || '',
                    selectedRowIndex,
                    split.ssPrefix  // Split can override prefix only
                );
                const ks = composeKS(
                    config.event.ksPrefix,
                    config.event.ksSuffixLength,
                    row['KS'] || '',
                    selectedRowIndex,
                    split.ksPrefix  // Split can override prefix only
                );

                const paymentDesc: any = {
                    acc: ibanElectronic,
                    am: split.amount.toFixed(2),
                    cc: config.account.currency,
                    xvs: symbolToNumber(vs),  // Convert to number
                    msg: config.event.description || t.paymentDescriptionFallback,
                };

                // Only include SS if provided and valid numeric
                if (ss && isValidNumericSymbol(ss)) {
                    paymentDesc.xss = symbolToNumber(ss);
                }

                // Only include KS if provided and valid numeric
                if (ks && isValidNumericSymbol(ks)) {
                    paymentDesc.xks = symbolToNumber(ks);
                }

                const spaydString = spayd(paymentDesc);
                const qrCodeDataUrl = await QRCode.toDataURL(spaydString, {
                    errorCorrectionLevel: 'H',
                    width: 512,
                    margin: 2,
                    type: 'image/jpeg',
                });

                qrCodes.push(qrCodeDataUrl);
            }

            const html = await generateEmailHtml(row, config, qrCodes, selectedRowIndex, t, locale);
            setPreviewHtml(html);
        } catch (err) {
            console.error('Preview generation error:', err);
            console.error('Config at error:', config);
            setPreviewHtml(`<div class="p-8 text-center text-red-500">${t.errorGeneratingPreview}: ${err instanceof Error ? err.message : t.unknownError}<br/><small>Check console for details</small></div>`);
        }
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            await generateBatchZip(data, config, t, locale);
        } catch (err) {
            console.error(err);
            alert(t.failedToGenerateZip);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedRowIndex(Math.max(0, selectedRowIndex - 1))}
                        disabled={selectedRowIndex === 0}
                        className="p-2 rounded-full hover:bg-purple-200 disabled:opacity-30 transition-colors text-purple-700"
                    >
                        ←
                    </button>
                    <span className="text-sm font-medium text-purple-900">
                        {selectedRowIndex + 1} / {data.rows.length}
                    </span>
                    <button
                        onClick={() => setSelectedRowIndex(Math.min(data.rows.length - 1, selectedRowIndex + 1))}
                        disabled={selectedRowIndex === data.rows.length - 1}
                        className="p-2 rounded-full hover:bg-purple-200 disabled:opacity-30 transition-colors text-purple-700"
                    >
                        →
                    </button>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 shadow-sm transition-all font-medium flex items-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <span className="animate-spin">⏳</span> {t.generatingZip}
                        </>
                    ) : (
                        <>
                            <span>📦</span> {t.downloadZip}
                        </>
                    )}
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden shadow-lg bg-gray-900 min-h-[600px] flex flex-col ring-4 ring-purple-50">
                <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-gray-700">
                    <div className="flex space-x-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 text-center text-xs text-gray-400 font-mono">
                        {t.previewFor} {data.rows[selectedRowIndex]?.['Email'] || t.recipientFallback}
                    </div>
                </div>
                <iframe
                    srcDoc={previewHtml}
                    className="w-full flex-1 bg-white"
                    title="Email Preview"
                />
            </div>
        </div>
    );
}
