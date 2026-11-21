# Pakistan internships scraper

Collects currently open internships located in Pakistan (onsite in a Pakistani city, or remote
roles whose location names Pakistan) and syncs them into the `internships` table
(migration `supabase/migrations/013_internships.sql`). The app reads them at `/internships`.

```bash
npx tsx scraper/internships/run.ts --dry-run              # all sources -> out/latest.json, no DB
npx tsx scraper/internships/run.ts --dry-run --source=ats # one source: web | ats | linkedin | indeed | pintern | jobzpk (-> out/latest-<source>.json)
npx tsx scraper/internships/run.ts                        # live: sync the table
npx tsx scraper/internships/spotcheck.ts 15               # re-open N random kept listings from out/latest.json
npx tsx scraper/internships/lib/filters.test.ts           # self-checks (also lib/process.test.ts, sources/pintern.test.ts)
```

Env (read from `.env.local`, or the environment in CI): `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SECRET_KEY` (live mode only), `SEARXNG_URL` (optional; DuckDuckGo is the fallback).

## Sources

| name | what | how |
|---|---|---|
| `linkedin` | LinkedIn public job search, location Pakistan, last 30 days, keywords intern / internship / internee / trainee | guest HTML + public job page (description, employment type, "no longer accepting applications") |
| `indeed` | pk.indeed.com, same keywords, last 30 days | headless Chromium (plain HTTP gets 403), reads the job-card JSON on the page. Often met by a Cloudflare challenge; the source then stops for that run |
| `ats` | public job-board APIs: Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Breezy, Recruitee, Pinpoint, JazzHR, Workday | curated boards of companies hiring in Pakistan + boards found by SearXNG `site:` searches every run |
| `web` | open-web discovery (city / programme searches, `site:rozee.pk`, `site:zohorecruit.com`, ...) | pages kept only when they carry a schema.org `JobPosting`; ATS links go to `ats` |
| `pintern` | pintern.net, a Pakistani internship board: newest 200 posts via its WordPress API | each internship post's `JobPosting`; its default country stamp and 90-day auto-expiry are ignored, the city comes from the title |
| `jobzpk` | jobz.pk newspaper ads (government, banks, universities, NGOs) listed under internship / internee / trainee / apprenticeship | list pages + each ad's `JobPosting` and "Expected Last Date" |

Not reachable without bypassing bot protection, so not scraped: Rozee.pk, Bayt, Glassdoor,
Jooble (Cloudflare 403). Mustakbil answers HTTP 410 (gone).

## Rules

- Title (or the source's own job-type field) must say intern / internship / internee; trainee and
  apprentice roles are kept and flagged `is_trainee`. Staff roles like "Internship Coordinator" are dropped.
- Location: a known Pakistani city (Hyderabad / Mirpur / Gujrat only next to a Pakistan marker) or
  "Pakistan" / a province. "Remote" or "Worldwide" without Pakistan is dropped.
- Posted within 45 days when the date is known; deadline not passed (Asia/Karachi); not marked closed.
- Dedupe: normalized company + title + city, and canonical apply URL. The source closest to the
  employer wins (ATS > company site > LinkedIn > Indeed > Jobz.pk); missing fields are filled from the loser.
- Field (software, data_ai, design, marketing, finance, hr, engineering, other) from title keywords,
  falling back to the description only when a field is mentioned twice. Paid/unpaid, stipend and
  deadline are read from the text when stated, otherwise left null.
- Politeness: one request at a time per host with a 1.2-4 s gap, backoff on 5xx, one 60 s
  pause on a first 429, and a host that answers 403 (or 429 again) is not contacted again for the rest
  of the run. Generic browser User-Agent.

## Live sync

New dedupe keys are inserted; listings seen again get `last_seen_at`/`last_checked_at` refreshed.
A listing not seen in a run whose source ran cleanly gets `missed_runs + 1` and its URL re-checked:
it is deactivated on 404/410, a "closed" page, or after 2 missed runs. A blocked source never
deactivates its listings. Each live run writes `out/run-<timestamp>.json` with per-source
found / kept / rejected-by-reason counts.

## Scheduling

**GitHub Actions**: `.github/workflows/internships.yml` runs every 6 hours. Add repository secrets
`SUPABASE_URL`, `SUPABASE_SERVICE_KEY` and (optionally) `SEARXNG_URL`.

**Oracle VM instead** (the box that already runs SearXNG): clone the repo, `npm ci`,
`npx playwright install --with-deps chromium`, put the three env vars in `.env.local`, then

```cron
17 */6 * * * cd /home/ubuntu/mentora && /usr/bin/npx tsx scraper/internships/run.ts >> /home/ubuntu/internships.log 2>&1
```

On the VM, `SEARXNG_URL=http://127.0.0.1:8888` works. One run takes roughly 15-30 minutes,
mostly polite waiting, so it fits on the 1-vCPU box.
