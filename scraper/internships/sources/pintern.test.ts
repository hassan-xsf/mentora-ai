/**
 * Self-check for pintern.net clean-up.
 * Run: npx tsx scraper/internships/sources/pintern.test.ts
 */
import assert from "node:assert/strict";
import { checkPakistan } from "../lib/filters";
import { cleanTitle, normalize } from "./pintern";

assert.equal(cleanTitle("Laravel Intern – 365 Care Group – Lahore, Pakistan 2026"), "Laravel Intern");
assert.equal(cleanTitle("HR Intern (Graduate) at Cybernet Lahore 2026"), "HR Intern (Graduate)");
assert.equal(cleanTitle("Devsinc Software Engineering Intern Lahore Jobs 2026"), "Devsinc Software Engineering Intern Lahore");
// Cutting at "at" would lose the internship word: keep the whole title.
assert.equal(cleanTitle("Work at Acme – Internship 2026"), "Work at Acme – Internship");

const posted = new Date("2026-11-19T00:00:00Z");
const base = { source: "pintern", sourceId: "x", company: "Co", applyUrl: "https://pintern.net/job/x/", postedAt: posted };

const lahore = normalize({ ...base, title: "Video Editor Intern at Monks Media Lahore 2026", location: "8th Floor, PK", deadline: new Date("2027-02-17T00:00:00Z") }, "1", posted);
assert.equal(checkPakistan(lahore.location).city, "Lahore");
assert.equal(lahore.deadline, null); // automatic 90-day expiry is not a deadline

const real = normalize({ ...base, title: "Trainee Officer at NPPMC Kasur", location: "Kasur, PK", deadline: new Date("2026-12-03T00:00:00Z") }, "2", posted);
assert.equal(real.deadline?.toISOString().slice(0, 10), "2026-12-03");

const abroad = normalize({ ...base, title: "Agri Graduate Trainee Scheme – Mole Valley Farmers", location: "Pakistan, PK", description: "Mole Valley Farmers in the UK offers a graduate scheme." }, "3", posted);
assert.equal(checkPakistan(abroad.location).ok, false);

const remote = normalize({ ...base, title: "Data Entry Intern – Ikonic Solution (Remote, Pakistan) 2026", location: "Pakistan, PK" }, "4", posted);
assert.deepEqual(checkPakistan(remote.location, remote.remote), { ok: true, city: null, remote: true });

console.log("pintern self-check passed");
