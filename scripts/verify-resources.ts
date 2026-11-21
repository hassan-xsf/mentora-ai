/**
 * Backfill link verification for existing `resources` rows (migration 012).
 * Every unverified row is checked; live links become link_kind='direct', the
 * rest become an honest search link (link_kind='search') or 'none' for notes.
 *
 *   npx tsx scripts/verify-resources.ts --dry-run   # report only, writes nothing
 *   npx tsx scripts/verify-resources.ts             # verify and update rows
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (read from .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { isHomepage, parseHttpUrl, verifyLinks } from "../src/lib/resources/links";

try {
  process.loadEnvFile(".env.local");
} catch {
  // env may already be set by the shell
}

const DRY = process.argv.includes("--dry-run");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

type Row = { id: string; title: string; type: string; url: string | null; link_kind?: string | null };

async function main() {
  const probe = await db.from("resources").select("id, link_kind").limit(1);
  const hasColumns = !probe.error;
  if (!hasColumns) {
    if (!DRY) {
      console.error(
        "resources.link_kind does not exist yet — apply supabase/migrations/012_resources_and_roadmap_rpc.sql first " +
          `(${probe.error!.message}). Use --dry-run to only report.`
      );
      process.exit(1);
    }
    console.log("Columns from migration 012 not found; dry run checks every row.");
  }

  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db
      .from("resources")
      .select(hasColumns ? "id, title, type, url, link_kind" : "id, title, type, url")
      .order("id")
      .range(from, from + 999);
    if (hasColumns) q = q.is("link_kind", null);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < 1000) break;
  }

  const withUrl = rows.filter((r) => r.url);
  const invalid = withUrl.filter((r) => !parseHttpUrl(r.url)).length;
  const homepages = withUrl.filter((r) => {
    const u = parseHttpUrl(r.url);
    return u && isHomepage(u);
  }).length;
  console.log(`${rows.length} unverified rows (${withUrl.length} with a URL). Checking…`);

  let live = 0;
  let dead = 0;
  let written = 0;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const results = await verifyLinks(batch, { budgetMs: 180_000, concurrency: 8, requestMs: 8_000 });
    batch.forEach((r, j) => {
      const u = parseHttpUrl(r.url);
      if (!u || isHomepage(u)) return;
      if (results[j].link_kind === "direct") live++;
      else dead++;
    });
    if (!DRY) {
      const errors = await Promise.all(
        batch.map((r, j) => db.from("resources").update(results[j]).eq("id", r.id).then((res) => res.error))
      );
      const failed = errors.filter(Boolean);
      written += batch.length - failed.length;
      if (failed.length) console.error(`${failed.length} updates failed, e.g. ${failed[0]!.message}`);
    }
    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  console.log(
    [
      `Checked URLs: ${live + dead}`,
      `  live (would be Verified): ${live}`,
      `  dead or unverifiable: ${dead}`,
      `Homepage-only links rejected: ${homepages}`,
      `Invalid / non-http URLs: ${invalid}`,
      `Rows without a URL: ${rows.length - withUrl.length}`,
      DRY ? "Dry run: nothing written." : `Rows updated: ${written}`,
    ].join("\n")
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
