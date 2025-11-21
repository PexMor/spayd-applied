import spayd from 'spayd';
import QRCode from 'qrcode';
import { electronicFormatIBAN } from 'ibantools';
import {
  getAccount,
  getEvent,
  updateEvent,
  addPayment,
  addToSyncQueue,
  type Event,
  type Payment,
} from '../db';

/**
 * Generate Variable Symbol based on event's VS mode
 */
export function generateVariableSymbol(event: Event): string {
  switch (event.vsMode) {
    case 'counter':
      return event.vsCounter.toString();
    
    case 'time':
      // Generate time-based VS: YYYYMMDDHHmmss
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    case 'static':
      return event.vsStaticValue || '0';
    
    default:
      return '0';
  }
}

/**
 * Generate a complete payment with SPAYD string and QR code
 */
export async function generatePayment(
  accountId: number,
  eventId: number,
  amount: number,
  overrides?: {
    message?: string;
    variableSymbol?: string;
    staticSymbol?: string;
  }
): Promise<Payment> {
  console.log('[PaymentGenerator] Starting payment generation', { accountId, eventId, amount });
  
  // Fetch account and event data
  const account = await getAccount(accountId);
  const event = await getEvent(eventId);
  console.log('[PaymentGenerator] Fetched account and event', { account, event });

  if (!account) {
    throw new Error('Account not found');
  }
  if (!event) {
    throw new Error('Event not found');
  }

  try {
    // Generate or use provided VS
    let variableSymbol = overrides?.variableSymbol;
    if (!variableSymbol) {
      variableSymbol = generateVariableSymbol(event);
      console.log('[PaymentGenerator] Generated VS:', variableSymbol);
      
      // Increment counter for counter-based VS
      if (event.vsMode === 'counter') {
        event.vsCounter += 1;
        await updateEvent(event);
        console.log('[PaymentGenerator] Incremented VS counter to:', event.vsCounter);
      }
    }

    // Use event's SS or override
    const staticSymbol = overrides?.staticSymbol || event.staticSymbol;
    console.log('[PaymentGenerator] Using SS:', staticSymbol);

    // Format IBAN for SPAYD
    const ibanElectronic = electronicFormatIBAN(account.iban);
    console.log('[PaymentGenerator] Formatted IBAN:', ibanElectronic);
    if (!ibanElectronic) {
      throw new Error('Invalid IBAN format');
    }

    // Create SPAYD payment description
    const paymentDesc: any = {
      acc: ibanElectronic,
      am: amount.toFixed(2),
      cc: account.currency,
      xvs: variableSymbol,
      xss: staticSymbol,
    };

    // Add message if provided
    if (overrides?.message) {
      paymentDesc.msg = overrides.message;
    }

    console.log('[PaymentGenerator] Created payment description:', paymentDesc);

    // Generate SPAYD string
    const spaydString = spayd(paymentDesc);
    console.log('[PaymentGenerator] Generated SPAYD string:', spaydString);

    // Generate QR code
    console.log('[PaymentGenerator] Generating QR code...');
    const qrCodeDataUrl = await QRCode.toDataURL(spaydString, {
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2,
    });
    console.log('[PaymentGenerator] QR code generated successfully');

    // Create payment record
    const payment: Omit<Payment, 'id'> = {
      accountId,
      eventId,
      amount,
      currency: account.currency,
      variableSymbol,
      staticSymbol,
      message: overrides?.message,
      spaydString,
      qrCodeDataUrl,
      createdAt: Date.now(),
    };

    // Store payment
    console.log('[PaymentGenerator] Storing payment to IndexedDB', payment);
    const paymentId = await addPayment(payment);
    console.log('[PaymentGenerator] Payment stored with ID:', paymentId);

    // Queue for backend sync if webhook is configured
    if (account.webhookUrl) {
      console.log('[PaymentGenerator] Queuing for sync to webhook:', account.webhookUrl);
      await addToSyncQueue({
        paymentId,
        webhookUrl: account.webhookUrl,
        payload: {
          paymentId,
          accountId,
          eventId,
          amount,
          currency: account.currency,
          variableSymbol,
          staticSymbol,
          message: overrides?.message,
          spaydString,
          createdAt: payment.createdAt,
        },
        status: 'pending',
        attempts: 0,
        createdAt: Date.now(),
      });
    }

    const finalPayment = {
      ...payment,
      id: paymentId,
    };
    console.log('[PaymentGenerator] Payment generation complete', finalPayment);
    return finalPayment;
  } catch (error) {
    console.error('[PaymentGenerator] ERROR during payment generation:', error);
    console.error('[PaymentGenerator] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Regenerate QR code for an existing payment (useful if SPAYD string was edited)
 */
export async function regenerateQRCode(spaydString: string): Promise<string> {
  return QRCode.toDataURL(spaydString, {
    errorCorrectionLevel: 'H',
    width: 512,
    margin: 2,
  });
}
