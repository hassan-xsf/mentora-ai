/**
 * Pakistan internships scraper.
 *   npx tsx scraper/internships/run.ts                 scrape every source, sync the `internships` table
 *   npx tsx scraper/internships/run.ts --dry-run       write scraper/internships/out/latest.json instead
 *   npx tsx scraper/internships/run.ts --source=linkedin   one source (linkedin|indeed|ats|pintern|jobzpk|web)
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (live mode), SEARXNG_URL (optional search).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Internship, RawListing, Reject, Source } from "./types";
import { dedupe, toInternship } from "./lib/process";
import { verifyUrl } from "./lib/verify";
import { atsSource } from "./sources/ats";
import { indeedSource } from "./sources/indeed";
import { jobzSource } from "./sources/jobzpk";
import { linkedinSource } from "./sources/linkedin";
import { pinternSource } from "./sources/pintern";
import { webSource } from "./sources/web";

try {
  process.loadEnvFile(".env.local");
} catch {
  // CI passes env directly
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.find((a) => a.startsWith("--source="))?.split("=")[1];

// web first: it hands discovered ATS boards to the ats source.
const SOURCES: Source[] = [webSource, atsSource, linkedinSource, indeedSource, pinternSource, jobzSource];
const MAX_MISSED_RUNS = 2;

type Stats = { found: number; kept: number; rejected: Partial<Record<Reject, number>> };

async function main() {
  const started = new Date();
  const chosen = SOURCES.filter((s) => !only || s.name === only);
  if (!chosen.length) throw new Error(`unknown --source=${only}`);

  const raw: RawListing[] = [];
  const notes: Record<string, string[]> = {};
  const healthy = new Set<string>(); // listing sources that finished without being stopped
  for (const s of chosen) {
    const t0 = Date.now();
    try {
      const { listings, notes: n } = await s.run();
      raw.push(...listings);
      notes[s.name] = [...n, `${Math.round((Date.now() - t0) / 1000)}s`];
      if (listings.length && !n.some((x) => /stopped/.test(x))) for (const l of listings) healthy.add(l.source);
    } catch (err) {
      notes[s.name] = [`failed: ${(err as Error).message}`];
    }
    console.log(`[${s.name}] ${notes[s.name].join(" · ")}`);
  }

  const stats: Record<string, Stats> = {};
  const stat = (src: string) => (stats[src] ??= { found: 0, kept: 0, rejected: {} });
  const clean: Internship[] = [];
  for (const l of raw) {
    stat(l.source).found++;
    const r = toInternship(l, started);
    if (typeof r === "string") stat(l.source).rejected[r] = (stat(l.source).rejected[r] ?? 0) + 1;
    else clean.push(r);
  }
  const { kept, duplicates } = dedupe(clean);
  for (const d of duplicates) stat(d.source).rejected.duplicate = (stat(d.source).rejected.duplicate ?? 0) + 1;
  for (const k of kept) stat(k.source).kept++;

  const summary = { startedAt: started.toISOString(), finishedAt: new Date().toISOString(), dryRun, total: kept.length, perSource: stats, notes };
  console.table(
    Object.fromEntries(Object.entries(stats).map(([s, v]) => [s, { found: v.found, kept: v.kept, ...v.rejected }])),
  );

  const outDir = join(import.meta.dirname, "out");
  mkdirSync(outDir, { recursive: true });
  if (dryRun) {
    const file = only ? `latest-${only}.json` : "latest.json"; // a one-source test run never clobbers the full result
    writeFileSync(join(outDir, file), JSON.stringify({ summary, listings: kept }, null, 2));
    console.log(`dry run: ${kept.length} internships -> scraper/internships/out/${file}`);
    return;
  }
  const sync = await syncDb(kept, healthy, started);
  writeFileSync(join(outDir, `run-${started.toISOString().replace(/[:.]/g, "-")}.json`), JSON.stringify({ summary, sync }, null, 2));
  console.log("db sync:", sync);
}

/** Insert new rows, refresh seen ones, count misses and deactivate gone/closed listings. */
async function syncDb(kept: Internship[], healthy: Set<string>, now: Date) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required (or use --dry-run)");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const ts = now.toISOString();

  type Row = { id: string; dedupe_key: string; source: string; apply_url: string; is_active: boolean; missed_runs: number };
  const existing: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("internships").select("id, dedupe_key, source, apply_url, is_active, missed_runs").range(from, from + 999);
    if (error) throw new Error(`read internships: ${error.message}`);
    existing.push(...(data as Row[]));
    if (!data || data.length < 1000) break;
  }
  const byKey = new Map(existing.map((r) => [r.dedupe_key, r]));

  const fresh = kept.filter((k) => !byKey.has(k.dedupe_key)).map((k) => ({ ...k, first_seen_at: ts, last_seen_at: ts, last_checked_at: ts }));
  for (let i = 0; i < fresh.length; i += 500) {
    const { error } = await db.from("internships").upsert(fresh.slice(i, i + 500), { onConflict: "dedupe_key", ignoreDuplicates: true });
    if (error) throw new Error(`insert: ${error.message}`);
  }

  const seenIds = kept.map((k) => byKey.get(k.dedupe_key)?.id).filter((id): id is string => !!id);
  for (let i = 0; i < seenIds.length; i += 200) {
    const { error } = await db
      .from("internships")
      .update({ last_seen_at: ts, last_checked_at: ts, missed_runs: 0, is_active: true })
      .in("id", seenIds.slice(i, i + 200));
    if (error) throw new Error(`refresh: ${error.message}`);
  }

  // Misses only count for sources that ran cleanly this run (a blocked or skipped source says nothing about its listings).
  const seen = new Set(seenIds);
  let deactivated = 0;
  let missed = 0;
  for (const r of existing) {
    if (!r.is_active || seen.has(r.id) || !healthy.has(r.source)) continue;
    const missedRuns = r.missed_runs + 1;
    const { verdict } = await verifyUrl(r.apply_url);
    const off = missedRuns >= MAX_MISSED_RUNS || verdict === "gone" || verdict === "closed";
    const { error } = await db
      .from("internships")
      .update({ missed_runs: missedRuns, last_checked_at: ts, ...(off ? { is_active: false } : {}) })
      .eq("id", r.id);
    if (error) throw new Error(`deactivate: ${error.message}`);
    if (off) deactivated++;
    else missed++;
  }
  return { inserted: fresh.length, refreshed: seenIds.length, missedOnce: missed, deactivated };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
