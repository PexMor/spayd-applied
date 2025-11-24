import { render } from 'preact-render-to-string';
import { PaymentEmail } from '../templates/PaymentEmail';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';
import spayd from 'spayd';
import { IBAN } from 'ibankit';
import { BatchConfig, BatchData } from '../BatchApp';

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
    const paymentDetailsList = config.event.splits.map((split, splitIndex) => {
        const vs = generateVS(rowIndex, row['VS'], split.vsPrefix);
        return {
            amount: split.amount,
            currency: config.account.currency,
            variableSymbol: vs,
            staticSymbol: split.ss || '',
            constantSymbol: split.ks || '',
            iban: config.account.iban,
            accountName: config.account.name,
            description: config.event!.description,
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
        text += `${t.account}: ${payment.iban}\n`;
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

function generateVS(rowIndex: number, rowVS?: string, splitVSPrefix?: string): string {
    // If row has VS, use it with the split's VS prefix
    if (rowVS && rowVS.trim()) {
        return (splitVSPrefix || '') + rowVS;
    }
    // Otherwise, generate sequential: splitVSPrefix + zero-padded index
    const sequential = (rowIndex + 1).toString().padStart(3, '0');
    return (splitVSPrefix || '') + sequential;
}

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
        for (let j = 0; j < config.event.splits.length; j++) {
            const split = config.event.splits[j];
            const vs = generateVS(i, row['VS'], split.vsPrefix);

            const paymentDesc: any = {
                acc: ibanElectronic,
                am: split.amount.toFixed(2),
                cc: config.account.currency,
                xvs: parseInt(vs, 10),  // Convert to number
                msg: config.event.description || 'Payment',
            };

            // Only include SS if provided and valid (up to 10 digits)
            if (split.ss && /^\d{1,10}$/.test(split.ss)) {
                paymentDesc.xss = parseInt(split.ss, 10);
            }

            // Only include KS if it's exactly 4 digits
            if (split.ks && /^\d{4}$/.test(split.ks)) {
                paymentDesc.xks = parseInt(split.ks, 10);
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

        // Generate payment details list (same as in generateEmailHtml)
        const paymentDetailsList = config.event.splits.map((split, splitIndex) => {
            const vs = generateVS(i, row['VS'], split.vsPrefix);
            return {
                amount: split.amount,
                currency: config.account.currency,
                variableSymbol: vs,
                staticSymbol: split.ss || '',
                constantSymbol: split.ks || '',
                iban: config.account.iban,
                accountName: config.account.name,
                description: config.event!.description,
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
        const firstVS = generateVS(i, row['VS'], config.event.splits[0].vsPrefix);
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

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'batch_payments.zip');
}
