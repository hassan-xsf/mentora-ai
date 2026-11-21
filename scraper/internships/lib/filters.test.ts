/**
 * Self-check for the internship filters.
 * Run: npx tsx scraper/internships/lib/filters.test.ts
 */
import assert from "node:assert/strict";
import {
  canonicalUrl,
  checkInternshipTitle,
  checkPakistan,
  classifyField,
  dedupeKey,
  detectDeadline,
  detectPay,
  looksClosed,
  parseDate,
} from "./filters";

// Location: Pakistani cities, diacritics, provinces.
assert.deepEqual(checkPakistan("Islamabad, Islāmābād, Pakistan"), { ok: true, city: "Islamabad", remote: false });
assert.deepEqual(checkPakistan("Lahore"), { ok: true, city: "Lahore", remote: false });
assert.deepEqual(checkPakistan("Karachi Division, Sindh"), { ok: true, city: "Karachi", remote: false });
assert.deepEqual(checkPakistan("Pakistan"), { ok: true, city: null, remote: false });
assert.deepEqual(checkPakistan("Remote - Pakistan"), { ok: true, city: null, remote: true });
assert.deepEqual(checkPakistan("Pakistan", true), { ok: true, city: null, remote: true });
assert.equal(checkPakistan("Rawalpindi, Punjab, PK").city, "Rawalpindi");
// Ambiguous names need a Pakistan marker.
assert.equal(checkPakistan("Hyderabad, Telangana, India").ok, false);
assert.deepEqual(checkPakistan("Hyderabad, Sindh, Pakistan"), { ok: true, city: "Hyderabad", remote: false });
assert.equal(checkPakistan("Mirpur, Dhaka, Bangladesh").ok, false);
// Remote without Pakistan, other countries, Indian Punjab: rejected.
assert.equal(checkPakistan("Remote").ok, false);
assert.equal(checkPakistan("Worldwide").ok, false);
assert.equal(checkPakistan("Dubai, United Arab Emirates").ok, false);
assert.equal(checkPakistan("Amritsar, Punjab, India").ok, false);
assert.equal(checkPakistan("Spark, Nevada").ok, false); // "pk" only counts as a trailing country code
// Multi-location keeps the first Pakistani city.
assert.equal(checkPakistan("Dubai, UAE; Karachi, Pakistan").city, "Karachi");

// Internship titles.
assert.deepEqual(checkInternshipTitle("HR Intern (Recruitment)"), { ok: true, trainee: false });
assert.deepEqual(checkInternshipTitle("Summer Internship Program 2026"), { ok: true, trainee: false });
assert.deepEqual(checkInternshipTitle("Internee - Finance"), { ok: true, trainee: false });
assert.deepEqual(checkInternshipTitle("Management Trainee Officer"), { ok: true, trainee: true });
assert.deepEqual(checkInternshipTitle("Trainee Engineer (Internship to Hire Program)"), { ok: true, trainee: false });
assert.equal(checkInternshipTitle("Internal Auditor").ok, false);
assert.equal(checkInternshipTitle("International Sales Manager").ok, false);
assert.equal(checkInternshipTitle("Corporate Trainer").ok, false);
assert.equal(checkInternshipTitle("Internship Coordinator").ok, false);
assert.equal(checkInternshipTitle("FCPS Part II Trainee").ok, false);
assert.equal(checkInternshipTitle("Post Graduate Trainee").ok, false);
assert.equal(checkInternshipTitle("House Job Internship").ok, true);
assert.equal(checkInternshipTitle("Senior Software Engineer").ok, false);

// Dedupe key: suffixes, internship/intern, noise words and punctuation collapse.
assert.equal(
  dedupeKey("Code & Content (Pvt.) Ltd", "Social Media Intern (Paid - 3 Months)", "Lahore", false),
  dedupeKey("Code and Content", "Social Media Internship", "Lahore", false),
);
assert.notEqual(dedupeKey("Acme", "Frontend Intern", "Lahore", false), dedupeKey("Acme", "Backend Intern", "Lahore", false));
assert.notEqual(dedupeKey("Acme", "Frontend Intern", "Lahore", false), dedupeKey("Acme", "Frontend Intern", "Karachi", false));
assert.equal(dedupeKey("Acme", "QA Intern", null, true), "acme|qa intern|remote");

// Canonical URLs drop tracking and LinkedIn slugs.
assert.equal(
  canonicalUrl("https://pk.linkedin.com/jobs/view/hr-intern-recruitment-at-microagility-apac-4490968002?position=1&refId=x"),
  "https://linkedin.com/jobs/view/4490968002",
);
assert.equal(canonicalUrl("https://www.Example.com/jobs/1/?utm_source=x&id=2#top"), "https://example.com/jobs/1?id=2");

// Field classifier.
assert.equal(classifyField("Software Engineering Intern"), "software");
assert.equal(classifyField("Data Scientist Intern"), "data_ai");
assert.equal(classifyField("AI/ML Intern"), "data_ai");
assert.equal(classifyField("Data Entry Intern"), "other");
assert.equal(classifyField("UI/UX Design Intern"), "design");
assert.equal(classifyField("Graphic Designer Internship"), "design");
assert.equal(classifyField("Mechanical Design Intern"), "engineering");
assert.equal(classifyField("Electrical Engineering Internee"), "engineering");
assert.equal(classifyField("Social Media Intern"), "marketing");
assert.equal(classifyField("Business Development Intern"), "marketing");
assert.equal(classifyField("Accounts & Finance Intern"), "finance");
assert.equal(classifyField("HR Intern (Recruitment)"), "hr");
assert.equal(classifyField("IT Support Intern"), "software");
assert.equal(classifyField("Summer Internship 2026", "Interns will build web apps with React and work on web performance."), "software");
assert.equal(classifyField("Summer Internship 2026", "It is a great place. Send us your CV."), "other");
assert.equal(classifyField("Medical Coding Intern"), "other");
assert.equal(classifyField("Management Trainee", "Rural Support Programme invites applications. Programme staff wanted."), "other");
assert.equal(classifyField("Python Programming Intern"), "software");

// Pay.
assert.deepEqual(detectPay("", "Rs 35,000 - Rs 45,000 a month"), { isPaid: true, stipend: "Rs 35,000 - Rs 45,000 a month" });
assert.equal(detectPay("This is an unpaid internship").isPaid, false);
assert.equal(detectPay("Social Media Intern (Paid – 3 Months)").isPaid, true);
assert.equal(detectPay("Monthly stipend of PKR 25,000 will be provided").stipend, "PKR 25,000");
assert.equal(detectPay("You will run paid social campaigns").isPaid, null);

// Dates and deadlines.
assert.equal(parseDate("30 November 2026")?.toISOString().slice(0, 10), "2026-11-30");
assert.equal(parseDate("Nov 30, 2026")?.toISOString().slice(0, 10), "2026-11-30");
assert.equal(parseDate("05/12/2026")?.toISOString().slice(0, 10), "2026-12-05");
assert.equal(parseDate("31/02/2026"), null);
assert.equal(detectDeadline("Last Date to Apply: 15 December 2026.")?.toISOString().slice(0, 10), "2026-12-15");
assert.equal(detectDeadline("Apply soon"), null);

// Closed markers.
assert.ok(looksClosed("No longer accepting applications"));
assert.ok(looksClosed("Sorry, this job has expired."));
assert.ok(!looksClosed("Apply now"));

console.log("filters self-check passed");
