/**
 * Self-check for the certificate PDF + share links, and study-route detection.
 * Run: npx tsx src/components/certificates/certificate-pdf.test.ts
 */
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { linkedInAddUrl, renderCertificatePdf, toWinAnsi, verifyUrl } from "./certificate-pdf";
import { studyKindForPath } from "../progress/study-kind";

process.env.NEXT_PUBLIC_SITE_URL = "https://mentora.example/";

const cert = {
  recipient_name: "Zoë Ahmed Khan",
  title: "Full-Stack Web Development with a very long roadmap title that must shrink to fit",
  level: "Intermediate" as const,
  issued_at: "2026-11-20T21:30:00Z",
  code: "MNT-7F3K-9QB2",
};

(async () => {
  const bytes = await renderCertificatePdf(cert);
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString("latin1"), "%PDF-");
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 1);
  const { width, height } = doc.getPage(0).getSize();
  assert.ok(width > height, "landscape");
  assert.ok(Math.abs(width - 841.89) < 0.01);

  // Non-Latin names must not crash the standard-font encoder.
  const urdu = await renderCertificatePdf({ ...cert, recipient_name: "علی", level: "Advanced" as const });
  assert.equal(Buffer.from(urdu.slice(0, 4)).toString("latin1"), "%PDF");
  assert.equal(toWinAnsi("Zoë"), "Zoe");
  assert.equal(toWinAnsi("علی"), "???");

  assert.equal(verifyUrl("MNT-7F3K-9QB2"), "https://mentora.example/verify/MNT-7F3K-9QB2");
  const li = new URL(linkedInAddUrl(cert));
  assert.equal(li.origin + li.pathname, "https://www.linkedin.com/profile/add");
  assert.equal(li.searchParams.get("startTask"), "CERTIFICATION_NAME");
  assert.equal(li.searchParams.get("organizationName"), "Mentora AI");
  assert.equal(li.searchParams.get("issueYear"), "2026");
  assert.equal(li.searchParams.get("issueMonth"), "11");
  assert.equal(li.searchParams.get("certId"), cert.code);
  assert.equal(li.searchParams.get("certUrl"), "https://mentora.example/verify/MNT-7F3K-9QB2");

  assert.equal(studyKindForPath("/roadmap/abc"), "roadmap");
  assert.equal(studyKindForPath("/roadmap/abc/test/t1"), "test");
  assert.equal(studyKindForPath("/practice/challenge/c1"), "practice");
  assert.equal(studyKindForPath("/practice"), null);
  assert.equal(studyKindForPath("/review"), "review");
  assert.equal(studyKindForPath("/build"), null);
  assert.equal(studyKindForPath("/build/b1"), "build");
  assert.equal(studyKindForPath("/dashboard"), null);
  assert.equal(studyKindForPath("/reviewer"), null);

  console.log("certificate-pdf: all checks passed");
})();
