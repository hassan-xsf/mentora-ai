/**
 * Self-check for LinkedIn guest HTML parsing.
 * Run: npx tsx scraper/internships/sources/linkedin.test.ts
 */
import assert from "node:assert/strict";
import { parseJobPage, parseSearch } from "./linkedin";

const card = `<li><div class="base-card base-search-card job-search-card" data-entity-urn="urn:li:jobPosting:4490968002">
  <a class="base-card__full-link" href="https://pk.linkedin.com/jobs/view/hr-intern-recruitment-at-microagility-apac-4490968002?position=1&amp;refId=x"></a>
  <h3 class="base-search-card__title"> HR Intern (Recruitment) </h3>
  <h4 class="base-search-card__subtitle"><a>MicroAgility APAC</a></h4>
  <span class="job-search-card__location">Islamabad, Islāmābād, Pakistan</span>
  <time datetime="2026-11-17">4 days ago</time></div></li>`;
const [l] = parseSearch(card);
assert.equal(l.sourceId, "4490968002");
assert.equal(l.title, "HR Intern (Recruitment)");
assert.equal(l.company, "MicroAgility APAC");
assert.equal(l.applyUrl, "https://pk.linkedin.com/jobs/view/hr-intern-recruitment-at-microagility-apac-4490968002");
assert.equal(l.postedAt?.toISOString().slice(0, 10), "2026-11-17");

const page = `<section class="top-card-layout"><h1>HR Intern</h1></section>
  <div class="show-more-less-html__markup"> Assist the recruitment team. </div>
  <ul><li class="description__job-criteria-item"><h3>Employment type</h3><span>Internship</span></li></ul>
  <section class="similar-jobs">No longer accepting applications</section>`;
const d = parseJobPage(page);
assert.equal(d.description, "Assist the recruitment team.");
assert.equal(d.typeInternship, true);
assert.equal(d.closed, false); // the phrase on another (similar) job doesn't close this one
assert.equal(parseJobPage(`<figure class="closed-job">No longer accepting applications</figure>`).closed, true);

console.log("linkedin self-check passed");
