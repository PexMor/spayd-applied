import { render } from 'preact-render-to-string';
import { PaymentEmail } from '../templates/PaymentEmail';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';
import spayd from 'spayd';
import { IBAN } from 'ibankit';
import { BatchConfig, BatchData } from '../BatchApp';
import { formatCzechIBANHumanReadable } from '../utils/iban-generator';
import { composeVS, composeSS, composeKS, symbolToNumber, isValidNumericSymbol } from '../utils/symbol-composer';

export async function generateEmailHtml(
    row: any,
    config: BatchConfig,
    qrCodeDataUrls: string[],
    rowIndex: number,
    t: any,
    locale: string
): Promise<string> {
    if (!config.event) {
        throw new Error('No event configured');
    }

    const body = replacePlaceholders(config.event.emailTemplate, row);

    // Create payment details for each split
    const event = config.event!; // Already checked event exists above
    const paymentDetailsList = event.splits.map((split, splitIndex) => {
        const vs = composeVS(
            event.vsPrefix,
            event.vsSuffixLength,
            row['VS'] || '',
            rowIndex,
            split.vsPrefix  // Split can override prefix only, not length
        );
        const ss = composeSS(
            event.ssPrefix,
            event.ssSuffixLength,
            row['SS'] || '',
            rowIndex,
            split.ssPrefix  // Split can override prefix only, not length
        );
        const ks = composeKS(
            event.ksPrefix,
            event.ksSuffixLength,
            row['KS'] || '',
            rowIndex,
            split.ksPrefix  // Split can override prefix only, not length
        );
        
        return {
            amount: split.amount,
            currency: config.account.currency,
            variableSymbol: vs,
            staticSymbol: ss || '',
            constantSymbol: ks || '',
            iban: config.account.iban,
            ibanHumanReadable: formatCzechIBANHumanReadable(config.account.iban),
            accountName: config.account.name,
            description: event.description,
            qrCodeDataUrl: qrCodeDataUrls[splitIndex],
            dueDate: split.dueDate,  // Include due date if present
            logoUrl: config.account.logoUrl,
        };
    });

    const emailComponent = (
        <PaymentEmail
            subject={config.event.description}
            body={body}
            paymentDetailsList={paymentDetailsList}
            t={t}
            locale={locale}
        />
    );

    return render(emailComponent);
}

// Generate text-only version of payment details
function generateTextVersion(
    body: string,
    paymentDetailsList: any[],
    accountName: string,
    t: any,
    locale: string
): string {
    let text = `${accountName}\n\n${body}\n\n`;
    text += '═'.repeat(60) + '\n\n';

    paymentDetailsList.forEach((payment, index) => {
        if (paymentDetailsList.length > 1) {
            text += `${t.emailPaymentXofY.replace('{current}', index + 1).replace('{total}', paymentDetailsList.length)}\n`;
            text += '-'.repeat(60) + '\n';
        } else {
            text += `${t.emailPaymentDetails}\n`;
            text += '-'.repeat(60) + '\n';
        }

        text += `${t.amount}: ${payment.amount} ${payment.currency}\n`;
        if (payment.dueDate) {
            const date = new Date(payment.dueDate);
            text += `${t.emailDueDate}: ${date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        }
        text += `${t.account}: ${payment.ibanHumanReadable} (IBAN: ${payment.iban})\n`;
        text += `${t.variableSymbol}: ${payment.variableSymbol}\n`;
        if (payment.constantSymbol) {
            text += `${t.emailConstantSymbol}: ${payment.constantSymbol}\n`;
        }
        if (payment.staticSymbol) {
            text += `${t.emailSpecificSymbol}: ${payment.staticSymbol}\n`;
        }
        text += `${t.message}: ${payment.description}\n`;
        text += `\n${t.emailScanToPay}\n`;
        text += '\n';
    });

    text += '═'.repeat(60) + '\n';
    text += t.emailGeneratedBy;

    return text;
}

export function generateEmailEml(
    to: string,
    subject: string,
    htmlContent: string,
    qrCodeDataUrls: string[],
    paymentDetailsList: any[],
    body: string,
    accountName: string,
    t: any,
    locale: string
): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const altBoundary = `----=_Alt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Generate text version
    const textVersion = generateTextVersion(body, paymentDetailsList, accountName, t, locale);

    // Replace data URL QR codes with CID references in HTML
    let htmlWithCids = htmlContent;
    qrCodeDataUrls.forEach((dataUrl, index) => {
        const cid = `qrcode${index}@spayd.local`;
        htmlWithCids = htmlWithCids.replace(dataUrl, `cid:${cid}`);
    });

    // Build EML
    let eml = `X-Unsent: 1\n`;
    eml += `To: ${to}\n`;
    eml += `Subject: ${subject}\n`;
    eml += `MIME-Version: 1.0\n`;
    eml += `Content-Type: multipart/mixed; boundary="${boundary}"\n`;
    eml += `\n`;
    eml += `--${boundary}\n`;
    eml += `Content-Type: multipart/alternative; boundary="${altBoundary}"\n`;
    eml += `\n`;

    // Text version
    eml += `--${altBoundary}\n`;
    eml += `Content-Type: text/plain; charset="utf-8"\n`;
    eml += `Content-Transfer-Encoding: quoted-printable\n`;
    eml += `\n`;
    eml += textVersion + `\n`;
    eml += `\n`;

    // HTML version
    eml += `--${altBoundary}\n`;
    eml += `Content-Type: text/html; charset="utf-8"\n`;
    eml += `Content-Transfer-Encoding: quoted-printable\n`;
    eml += `\n`;
    eml += htmlWithCids + `\n`;
    eml += `--${altBoundary}--\n`;
    eml += `\n`;

    // Embedded QR code images
    qrCodeDataUrls.forEach((dataUrl, index) => {
        const cid = `qrcode${index}@spayd.local`;
        // Extract base64 data from data URL
        const base64Match = dataUrl.match(/^data:image\/(jpeg|png);base64,(.+)$/);
        if (base64Match) {
            const mimeType = base64Match[1];
            const base64Data = base64Match[2];

            eml += `--${boundary}\n`;
            eml += `Content-Type: image/${mimeType}; name="qrcode${index}.${mimeType}"\n`;
            eml += `Content-Transfer-Encoding: base64\n`;
            eml += `Content-ID: <${cid}>\n`;
            eml += `Content-Disposition: inline; filename="qrcode${index}.${mimeType}"\n`;
            eml += `\n`;
            // Split base64 into 76-character lines (RFC 2045)
            const lines = base64Data.match(/.{1,76}/g) || [];
            eml += lines.join('\n') + `\n`;
            eml += `\n`;
        }
    });

    eml += `--${boundary}--\n`;

    return eml;
}

function replacePlaceholders(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

/**
 * Generate CSV content for matching data
 * Includes VS, SS, KS columns (from first split) plus all original columns from people data
 * Compatible with MatchingDataUpload component format
 */
function generateMatchingCSV(data: BatchData, config: BatchConfig): string {
    if (!config.event || data.rows.length === 0 || config.event.splits.length === 0) {
        return '';
    }

    const event = config.event;
    const rows: string[][] = [];

    // Build header row: VS, SS, KS, then all original columns
    const headerRow = ['VS', 'SS'];
    if (event.ksPrefix !== undefined || data.headers.some(h => h.toUpperCase() === 'KS')) {
        headerRow.push('KS');
    }
    // Add all original columns (excluding VS, SS, KS if they exist to avoid duplicates)
    const originalHeaders = data.headers.filter(h => {
        const upper = h.toUpperCase();
        return upper !== 'VS' && upper !== 'SS' && upper !== 'KS';
    });
    headerRow.push(...originalHeaders);
    rows.push(headerRow);

    // Generate rows with composed symbols
    for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        const firstSplit = event.splits[0]; // Safe because we checked splits.length > 0

        // Compose symbols using first split (for CSV export, we use first split's values)
        const vs = composeVS(
            event.vsPrefix,
            event.vsSuffixLength,
            row['VS'] || '',
            i,
            firstSplit.vsPrefix
        );
        const ss = composeSS(
            event.ssPrefix,
            event.ssSuffixLength,
            row['SS'] || '',
            i,
            firstSplit.ssPrefix
        );
        const ks = composeKS(
            event.ksPrefix,
            event.ksSuffixLength,
            row['KS'] || '',
            i,
            firstSplit.ksPrefix
        );

        // Build CSV row: VS, SS, KS (if applicable), then original columns
        const csvRow: string[] = [vs, ss || ''];
        if (event.ksPrefix !== undefined || data.headers.some(h => h.toUpperCase() === 'KS')) {
            csvRow.push(ks || '');
        }
        // Add all original column values (excluding VS, SS, KS)
        originalHeaders.forEach(header => {
            csvRow.push(String(row[header] || ''));
        });
        rows.push(csvRow);
    }

    // Convert to CSV format (semicolon-separated, compatible with MatchingDataUpload)
    return rows.map(row => 
        row.map(cell => {
            // Escape semicolons and quotes in cell values
            const cellStr = String(cell || '');
            if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        }).join(';')
    ).join('\n');
}

// Removed - now using composeVS, composeSS, composeKS from symbol-composer.ts

export async function generateBatchZip(data: BatchData, config: BatchConfig, t: any, locale: string) {
    if (!config.event) {
        throw new Error('No event selected');
    }

    const zip = new JSZip();

    for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];

        // Generate SPAYD and QR codes for each split
        const ibanElectronic = IBAN.electronicFormat(config.account.iban);
        if (!ibanElectronic || !IBAN.isValid(config.account.iban)) continue;

        const qrCodes: string[] = [];
        const event = config.event!; // Already checked above
        for (let j = 0; j < event.splits.length; j++) {
            const split = event.splits[j];
            const vs = composeVS(
                event.vsPrefix,
                event.vsSuffixLength,
                row['VS'] || '',
                i,
                split.vsPrefix  // Split can override prefix only
            );
            const ss = composeSS(
                event.ssPrefix,
                event.ssSuffixLength,
                row['SS'] || '',
                i,
                split.ssPrefix  // Split can override prefix only
            );
            const ks = composeKS(
                event.ksPrefix,
                event.ksSuffixLength,
                row['KS'] || '',
                i,
                split.ksPrefix  // Split can override prefix only
            );

            const paymentDesc: any = {
                acc: ibanElectronic,
                am: split.amount.toFixed(2),
                cc: config.account.currency,
                xvs: symbolToNumber(vs),  // Convert to number
                msg: event.description || t.paymentFallback,
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

        // Generate HTML
        const html = await generateEmailHtml(row, config, qrCodes, i, t, locale);

        // Generate payment details list (same as in generateEmailHtml - event already declared above)
        const paymentDetailsList = event.splits.map((split, splitIndex) => {
            const vs = composeVS(
                event.vsPrefix,
                event.vsSuffixLength,
                row['VS'] || '',
                i,
                split.vsPrefix  // Split can override prefix only
            );
            const ss = composeSS(
                event.ssPrefix,
                event.ssSuffixLength,
                row['SS'] || '',
                i,
                split.ssPrefix  // Split can override prefix only
            );
            const ks = composeKS(
                event.ksPrefix,
                event.ksSuffixLength,
                row['KS'] || '',
                i,
                split.ksPrefix  // Split can override prefix only
            );
            
            return {
                amount: split.amount,
                currency: config.account.currency,
                variableSymbol: vs,
                staticSymbol: ss || '',
                constantSymbol: ks || '',
                iban: config.account.iban,
                ibanHumanReadable: formatCzechIBANHumanReadable(config.account.iban),
                accountName: config.account.name,
                description: event.description,
                qrCodeDataUrl: qrCodes[splitIndex],
                dueDate: split.dueDate,
                logoUrl: config.account.logoUrl,
            };
        });

        const body = replacePlaceholders(config.event.emailTemplate, row);

        // Generate EML
        const email = row['Email'] || `recipient_${i + 1}@example.com`;
        const eml = generateEmailEml(
            email,
            config.event.description,
            html,
            qrCodes,
            paymentDetailsList,
            body,
            config.account.name,
            t,
            locale
        );

        // Add to ZIP with organized folders
        const firstVS = composeVS(
            event.vsPrefix,
            event.vsSuffixLength,
            row['VS'] || '',
            i,
            event.splits[0].vsPrefix  // Split can override prefix only
        );
        const fileName = `payment_${firstVS || i + 1}`;

        // Create folders if they don't exist
        const htmlFolder = zip.folder('html');
        const emlFolder = zip.folder('eml');

        htmlFolder?.file(`${fileName}.html`, html);
        emlFolder?.file(`${fileName}.eml`, eml);
    }

    // Save configuration files
    const configFolder = zip.folder('config');

    // Save account used
    configFolder?.file('account_used.json', JSON.stringify(config.account, null, 2));

    // Save event details
    if (config.event) {
        configFolder?.file('event_details.json', JSON.stringify(config.event, null, 2));
    }

    // Save people data
    configFolder?.file('people_data.json', JSON.stringify({
        headers: data.headers,
        rows: data.rows
    }, null, 2));

    // Generate and save matching CSV
    const matchingCSV = generateMatchingCSV(data, config);
    if (matchingCSV) {
        // Add UTF-8 BOM for better Excel compatibility
        const csvWithBOM = '\uFEFF' + matchingCSV;
        zip.file('matching_data.csv', csvWithBOM);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'batch_payments.zip');
}

/**
 * Generate and download matching CSV file separately
 * Compatible with MatchingDataUpload component
 */
export function downloadMatchingCSV(data: BatchData, config: BatchConfig) {
    if (!config.event) {
        throw new Error('No event selected');
    }

    const csvContent = generateMatchingCSV(data, config);
    if (!csvContent) {
        throw new Error('No data to export');
    }

    // Add UTF-8 BOM for better Excel compatibility
    const csvWithBOM = '\uFEFF' + csvContent;
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'matching_data.csv');
}
