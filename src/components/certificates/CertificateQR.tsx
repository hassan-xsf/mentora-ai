import QRCode from "qrcode";
import { verifyUrl } from "./certificate-pdf";

/** Server-rendered QR pointing at the public verification page. */
export async function CertificateQR({ code }: { code: string }) {
  const url = verifyUrl(code);
  // SVG markup comes from the qrcode library for our own URL, not user HTML.
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-28 w-28 shrink-0 rounded-[8px] border border-[#d3cec6] bg-white p-1.5 [&>svg]:h-full [&>svg]:w-full"
        role="img"
        aria-label={`QR code linking to ${url}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#111111]">Scan to verify</p>
        <p className="mt-1 break-all font-mono text-[11.5px] text-[#9c9fa5]">{url}</p>
      </div>
    </div>
  );
}
