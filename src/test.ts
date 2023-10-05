import spayd from "spayd";

const payment = {
  acc: "CZ2806000000000168540115",
  am: "450.00",
  cc: "CZK",
  msg: "Payment for some stuff",
  xvs: "1234567890",
  xss: "1234",
};

console.log(spayd(payment));

import { electronicFormatIBAN, isValidIBAN } from "ibantools";

// 'NL91ABNA0517164300'
const iban = electronicFormatIBAN("NL91 ABNA 0417 1643 00");
if (iban) console.log(isValidIBAN(iban));
