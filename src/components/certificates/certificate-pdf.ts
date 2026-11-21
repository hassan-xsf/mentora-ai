import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import type { Certificate } from "@/types";

export const ISSUER = "Mentora AI";

const SEAL: Record<string, string> = {
  Beginner: "#0bdf50",
  Intermediate: "#ff5600",
  Advanced: "#111111",
};

export function verifyUrl(code: string): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${site}/verify/${encodeURIComponent(code)}`;
}

/** LinkedIn's documented "Add to profile" certification link. */
export function linkedInAddUrl(cert: Pick<Certificate, "title" | "code" | "issued_at">): string {
  // Same calendar (Pakistan) as the date printed on the certificate.
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" })
    .format(new Date(cert.issued_at))
    .split("-");
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.title,
    organizationName: ISSUER,
    issueYear: year,
    issueMonth: String(Number(month)),
    certUrl: verifyUrl(cert.code),
    certId: cert.code,
  });
  return `https://www.linkedin.com/profile/add?${params}`;
}

export function formatIssued(issuedAt: string): string {
  return new Date(issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Karachi",
  });
}

// shortcut: standard PDF fonts only cover WinAnsi (Latin-1), so other scripts
// become "?"; embed a Unicode TTF via @pdf-lib/fontkit if non-Latin names matter.
export function toWinAnsi(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
}

function hex(color: string) {
  const n = parseInt(color.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Largest size <= max at which text fits in width. */
function fitSize(font: PDFFont, text: string, max: number, width: number): number {
  return Math.min(max, (max * width) / Math.max(font.widthOfTextAtSize(text, max), 1));
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color: string) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color: hex(color) });
}

type CertificatePdfInput = Pick<
  Certificate,
  "recipient_name" | "title" | "level" | "issued_at" | "code"
>;

/** A4 landscape certificate with a QR code to its public verification page. */
export async function renderCertificatePdf(cert: CertificatePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(toWinAnsi(`${cert.title} - Certificate of Completion`));
  pdf.setAuthor(ISSUER);
  pdf.setSubject(`Verification code ${cert.code}`);

  const page = pdf.addPage([841.89, 595.28]);
  const W = page.getWidth();
  const H = page.getHeight();
  const [regular, bold, serif] = await Promise.all([
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
    pdf.embedFont(StandardFonts.TimesRomanBold),
  ]);
  const seal = SEAL[cert.level] ?? SEAL.Beginner;

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hex("#ffffff") });
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: hex(seal), borderWidth: 3 });
  page.drawRectangle({ x: 34, y: 34, width: W - 68, height: H - 68, borderColor: hex("#d3cec6"), borderWidth: 0.8 });

  centered(page, "M E N T O R A   A I", H - 90, bold, 14, "#111111");
  centered(page, "CERTIFICATE OF COMPLETION", H - 128, regular, 12, "#7b7b78");
  page.drawRectangle({ x: W / 2 - 30, y: H - 146, width: 60, height: 1.5, color: hex(seal) });

  centered(page, "This certifies that", H - 186, regular, 13, "#7b7b78");
  const name = toWinAnsi(cert.recipient_name);
  centered(page, name, H - 238, serif, fitSize(serif, name, 40, W - 160), "#111111");

  centered(page, "has successfully completed the learning roadmap", H - 280, regular, 13, "#7b7b78");
  const title = toWinAnsi(cert.title);
  centered(page, title, H - 316, bold, fitSize(bold, title, 22, W - 160), "#111111");

  const levelText = `${cert.level.toUpperCase()} LEVEL`;
  const levelW = bold.widthOfTextAtSize(levelText, 10) + 28;
  page.drawRectangle({ x: (W - levelW) / 2, y: H - 358, width: levelW, height: 22, color: hex(seal), opacity: 0.12 });
  centered(page, levelText, H - 351, bold, 10, seal === "#0bdf50" ? "#0a7d30" : seal);

  // Footer: issued date, code + issuer, QR.
  const footY = 92;
  page.drawText("ISSUED", { x: 70, y: footY + 18, size: 8, font: regular, color: hex("#9c9fa5") });
  page.drawText(formatIssued(cert.issued_at), { x: 70, y: footY, size: 12, font: bold, color: hex("#111111") });
  page.drawText(`Issued by ${ISSUER}`, { x: 70, y: footY - 18, size: 9, font: regular, color: hex("#7b7b78") });

  centered(page, "VERIFICATION CODE", footY + 18, regular, 8, "#9c9fa5");
  centered(page, cert.code, footY, bold, 13, "#111111");
  const url = verifyUrl(cert.code);
  centered(page, toWinAnsi(url), footY - 18, regular, 8, "#7b7b78");

  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const box = 96;
  const cell = box / size;
  const qx = W - 70 - box;
  const qy = footY - 30;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (qr.modules.get(r, c)) {
        // PDF y grows upwards, QR rows go down.
        page.drawRectangle({ x: qx + c * cell, y: qy + box - (r + 1) * cell, width: cell, height: cell, color: hex("#111111") });
      }
    }
  }
  page.drawText("Scan to verify", {
    x: qx + (box - regular.widthOfTextAtSize("Scan to verify", 8)) / 2,
    y: qy - 12,
    size: 8,
    font: regular,
    color: hex("#9c9fa5"),
  });

  return pdf.save();
}

export async function certificatePdfResponse(cert: CertificatePdfInput): Promise<Response> {
  const bytes = await renderCertificatePdf(cert);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mentora-certificate-${cert.code}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
