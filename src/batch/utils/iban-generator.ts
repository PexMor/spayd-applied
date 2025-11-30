import { CountryCode, IBAN } from 'ibankit';

export function generateRandomIBAN(countryCode: string = 'CZ'): string {
  if (countryCode !== 'CZ') {
    throw new Error('Only CZ IBAN generation is currently supported');
  }

  // Use ibankit to generate a random valid Czech IBAN
  const iban = IBAN.random(CountryCode.CZ);
  
  return iban.toString();
}

/**
 * Convert Czech IBAN to human-readable format
 * @param iban Czech IBAN in format: CZ + check(2) + bank-code(4) + prefix(6) + account(10)
 * @returns Human-readable format: [prefix-]account/bank-code
 * 
 * Examples:
 *   CZ6508000000192000145399 -> 000019-2000145399/0800 (with prefix)
 *   CZ9455000000001234567890 -> 1234567890/5500 (no prefix if all zeros)
 */
export function formatCzechIBANHumanReadable(iban: string): string {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  
  // Validate it's a Czech IBAN (CZ + 22 digits)
  if (!cleanIban.match(/^CZ\d{22}$/)) {
    return iban; // Return original if not valid Czech IBAN
  }
  
  // Extract parts: CZ + check(2) + bank-code(4) + prefix(6) + account(10)
  // const checkDigits = cleanIban.substring(2, 4);  // Not needed for display
  const bankCode = cleanIban.substring(4, 8);
  const prefix = cleanIban.substring(8, 14);
  const account = cleanIban.substring(14, 24);
  
  // Check if prefix is all zeros
  const prefixNum = parseInt(prefix, 10);
  
  if (prefixNum === 0) {
    // No prefix, just account/bank-code
    // Remove leading zeros from account for display
    const accountNum = parseInt(account, 10).toString();
    return `${accountNum}/${bankCode}`;
  } else {
    // With prefix: prefix-account/bank-code
    // Keep leading zeros in prefix, remove from account
    const accountNum = parseInt(account, 10).toString();
    return `${prefix}-${accountNum}/${bankCode}`;
  }
}

/**
 * Get both IBAN formats for display
 * @param iban Czech IBAN
 * @returns Object with both standard and human-readable format
 */
export function getIBANFormats(iban: string): { standard: string; humanReadable: string } {
  return {
    standard: iban,
    humanReadable: formatCzechIBANHumanReadable(iban)
  };
}

