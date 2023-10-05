// import { useState } from "preact/hooks";
import { createRef } from "preact";
import "./app.css";
import spayd from "spayd";
import QRCode from "qrcode";
import {
  composeIBAN,
  friendlyFormatIBAN,
  electronicFormatIBAN,
} from "ibantools";
import PaymentDescription from "spayd/dist/types/PaymentDescription";

export function App() {
  // const [count, setCount] = useState(0);
  let refImg = createRef<HTMLImageElement>();
  let country = "CZ";
  let bankNo = 2010;
  let bankCode = bankNo.toString().padStart(4, "0");
  let prefix = 23;
  let acc = 4159;
  let prefixCode = prefix.toString().padStart(6, "0");
  let accCode = acc.toString().padStart(10, "0");
  let bban = bankCode + prefixCode + accCode;
  let iban = composeIBAN({ countryCode: country, bban: bban });
  let iban_f = "CZ2806000000000168540115";
  if (typeof iban === "string")
    iban_f = friendlyFormatIBAN(iban, "-") as string;
  let am: number = 450;
  let amCode = am.toFixed(2);
  let iban_e = electronicFormatIBAN(
    typeof iban === "string" ? iban : undefined
  );
  let xvs = (124).toString();
  let xss = (543).toString();
  let txt = "Platím cosi, kdesi";
  let cur = "CZK";
  console.log(amCode);
  const payment: PaymentDescription = {
    acc: typeof iban_e === "string" ? iban_e : "",
    am: amCode,
    cc: cur,
    msg: txt,
    xvs: xvs,
    xss: xss,
  };

  const spaydString = spayd(payment);
  const spaydStringB64 = btoa(spaydString);
  const spaydStringB64pfx = `data:application/x-shortpaymentdescriptor;base64,${spaydStringB64}`;

  // generate and assign qr-payment to an image element
  QRCode.toDataURL(spaydString, { errorCorrectionLevel: "H" })
    .then((url: string) => {
      refImg.current?.setAttribute("src", url);
    })
    .catch(console.error);
  return (
    <>
      <h1>Test</h1>
      <img ref={refImg} />
      <br />
      <a href="https://github.com/tajnymag/spayd-js">
        https://github.com/tajnymag/spayd-js
      </a>
      <hr />
      <div>iban:{iban_f}</div>
      <div>{JSON.stringify(payment)}</div>
      <div>
        data:application/x-shortpaymentdescriptor;base64,{spaydStringB64}
        <br />
        <a href={spaydStringB64pfx}>data/url</a>
      </div>
      <hr />
      <a href="https://www.kutac.cz/pocitace-a-internety/generovani-a-kontrola-ibanu-pro-cz-i-sk-ucty">
        https://www.kutac.cz/pocitace-a-internety/generovani-a-kontrola-ibanu-pro-cz-i-sk-ucty
      </a>
    </>
  );
}
