import { CountryCode, IBAN } from 'ibankit';

export function generateRandomIBAN(countryCode: string = 'CZ'): string {
  if (countryCode !== 'CZ') {
    throw new Error('Only CZ IBAN generation is currently supported');
  }

  // Use ibankit to generate a random valid Czech IBAN
  const iban = IBAN.random(CountryCode.CZ);
  
  return iban.toString();
}

