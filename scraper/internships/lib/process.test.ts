/**
 * Self-check for listing -> row conversion and cross-source dedupe.
 * Run: npx tsx scraper/internships/lib/process.test.ts
 */
import assert from "node:assert/strict";
import type { Internship, RawListing } from "../types";
import { dedupe, toInternship } from "./process";

const now = new Date("2026-11-21T06:00:00Z");
const base: RawListing = {
  source: "linkedin",
  sourceId: "1",
  title: "Frontend Intern",
  company: "Acme (Pvt) Ltd",
  location: "Lahore, Punjab, Pakistan",
  applyUrl: "https://www.linkedin.com/jobs/view/1",
  postedAt: new Date("2026-11-18T00:00:00Z"),
  description: "Monthly stipend of PKR 30,000. Last date to apply: 30 November 2026.",
};

const row = toInternship(base, now) as Internship;
assert.equal(typeof row, "object");
assert.equal(row.city, "Lahore");
assert.equal(row.field, "software");
assert.equal(row.is_paid, true);
assert.equal(row.stipend, "PKR 30,000");
assert.equal(row.deadline, "2026-11-30");

assert.equal(toInternship({ ...base, title: "Frontend Developer" }, now), "not_internship");
assert.equal(toInternship({ ...base, title: "Frontend Developer", typeInternship: true }, now) instanceof Object, true);
assert.equal(toInternship({ ...base, location: "Bengaluru, India" }, now), "not_pakistan");
assert.equal(toInternship({ ...base, closed: true }, now), "closed");
assert.equal(toInternship({ ...base, postedAt: new Date("2026-09-01T00:00:00Z") }, now), "stale");
assert.equal(toInternship({ ...base, description: "Deadline: 1 November 2026" }, now), "expired");

// Same internship on LinkedIn and the company's Greenhouse board: Greenhouse wins, keeps LinkedIn's stipend.
const gh = toInternship({ ...base, source: "greenhouse", sourceId: "g1", company: "Acme", applyUrl: "https://boards.greenhouse.io/acme/jobs/9", description: "" }, now) as Internship;
const { kept, duplicates } = dedupe([row, gh]);
assert.equal(kept.length, 1);
assert.equal(duplicates.length, 1);
assert.equal(kept[0].source, "greenhouse");
assert.equal(kept[0].stipend, "PKR 30,000");

// Same canonical URL with different titles also collapses.
const again = { ...row, title: "Frontend Internship (Paid)", dedupe_key: "other", apply_url: "https://pk.linkedin.com/jobs/view/1?trk=x" };
assert.equal(dedupe([row, again]).kept.length, 1);

console.log("process self-check passed");
