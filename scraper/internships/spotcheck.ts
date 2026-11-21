/**
 * Re-open N random kept listings from out/latest.json and report whether each page is live,
 * open and mentions Pakistan. Run: npx tsx scraper/internships/spotcheck.ts [N]
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import type { Internship } from "./types";
import { checkPakistan, looksClosed } from "./lib/filters";
import { UA } from "./lib/http";
import { verifyUrl } from "./lib/verify";

const n = Number(process.argv[2] ?? 15);
const { listings } = JSON.parse(readFileSync(join(import.meta.dirname, "out", "latest.json"), "utf8")) as { listings: Internship[] };
const sample = [...listings].sort(() => Math.random() - 0.5).slice(0, n);

async function main() {
  const browser = sample.some((s) => s.source === "indeed") ? await chromium.launch({ headless: true }) : null;
  const rows = [];
  for (const l of sample) {
    let verdict: string;
    let pakistan: boolean | undefined;
    if (l.source === "indeed" && browser) {
      const page = await browser.newPage({ userAgent: UA });
      const res = await page.goto(l.apply_url, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null);
      await page.waitForTimeout(3000);
      const text = await page.locator("body").innerText().catch(() => "");
      verdict = !res ? "unknown" : res.status() === 404 ? "gone" : looksClosed(text) ? "closed" : /just a moment|security check/i.test(await page.title()) ? "unknown" : "open";
      pakistan = checkPakistan(text.slice(0, 3000)).ok;
      await page.close();
    } else {
      ({ verdict, pakistan } = await verifyUrl(l.apply_url));
    }
    rows.push({ source: l.source, title: l.title.slice(0, 40), company: l.company.slice(0, 24), city: l.city ?? (l.is_remote ? "remote" : "PK"), verdict, pakistanOnPage: pakistan, url: l.apply_url });
  }
  await browser?.close();
  console.table(rows.map(({ url, ...r }) => r)); // eslint-disable-line @typescript-eslint/no-unused-vars
  for (const r of rows) console.log(r.verdict.padEnd(7), r.url);
  const open = rows.filter((r) => r.verdict === "open").length;
  console.log(`${open}/${rows.length} open, ${rows.filter((r) => r.pakistanOnPage).length}/${rows.length} mention Pakistan on the page`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
