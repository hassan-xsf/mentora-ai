import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import {
  FIELD_LABELS,
  SOURCE_LABELS,
  getCareerTitles,
  getSavedInternshipIds,
  listInternshipCities,
  listInternships,
  rankForCareers,
  type Internship,
  type InternshipFilters,
} from "@/lib/db/internships";
import { SaveButton } from "./SaveButton";

type Tab = "all" | "recommended" | "saved";
type Search = Record<string, string | string[] | undefined>;

const WITHIN = [
  { value: "", label: "Any time" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last week" },
  { value: "14", label: "Last 2 weeks" },
  { value: "30", label: "Last 30 days" },
];

export default async function InternshipsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const tab: Tab = one("tab") === "saved" ? "saved" : one("tab") === "recommended" ? "recommended" : "all";
  const within = Number(one("within"));
  const filters: InternshipFilters = {
    q: one("q").slice(0, 80) || undefined,
    city: one("city") || undefined,
    field: one("field") || undefined,
    remote: one("remote") === "1",
    paid: one("paid") === "1",
    withinDays: [3, 7, 14, 30].includes(within) ? within : undefined,
  };

  const [savedIds, cities, careers] = await Promise.all([
    getSavedInternshipIds(user.id),
    listInternshipCities(),
    tab === "recommended" ? getCareerTitles(user.id) : Promise.resolve([] as string[]),
  ]);
  const { rows, missing } = await listInternships(tab === "saved" ? { ...filters, ids: [...savedIds] } : filters);
  const shown = tab === "recommended" ? rankForCareers(rows, careers) : rows;
  const lastChecked = rows.reduce<string | null>((m, r) => (!m || r.last_checked_at > m ? r.last_checked_at : m), null);

  const tabHref = (t: Tab) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v && k !== "tab") p.set(k, v);
    if (t !== "all") p.set("tab", t);
    const s = p.toString();
    return s ? `/internships?${s}` : "/internships";
  };

  return (
    <div className="min-h-full bg-[#f5f1ec]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#9c9fa5]">Opportunities</p>
        <h1 className="mt-1 text-[28px] font-medium leading-tight tracking-[-0.5px] text-[#111111]">Internships in Pakistan</h1>
        <p className="mt-2 max-w-2xl text-[13px] text-[#626260]">
          Real, open internships collected every few hours from LinkedIn, Indeed, company career pages and
          newspaper ads. Only roles based in Pakistan or remote roles open to Pakistan, posted in the last 45 days.
          {lastChecked && <> Last checked {timeAgo(lastChecked)}.</>}
        </p>

        <nav className="mt-6 flex gap-1 border-b border-[#d3cec6]" aria-label="Internship lists">
          {(
            [
              ["all", "All"],
              ["recommended", "Recommended for you"],
              ["saved", `Saved${savedIds.size ? ` (${savedIds.size})` : ""}`],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <Link
              key={t}
              href={tabHref(t)}
              aria-current={tab === t ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                tab === t ? "border-[#111111] text-[#111111]" : "border-transparent text-[#7b7b78] hover:text-[#111111]"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* key: remount on every URL change, or Reset/tab links leave stale select/checkbox values (defaultValue only applies on mount). */}
        <form key={JSON.stringify(sp)} method="get" className="mt-4 grid gap-2 rounded-[12px] border border-[#d3cec6] bg-white p-3 sm:grid-cols-[1fr_auto_auto_auto]">
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search title or company"
            aria-label="Search title or company"
            className="h-9 rounded-[8px] border border-[#d3cec6] bg-white px-3 text-[13px] text-[#111111] placeholder:text-[#9c9fa5] focus:border-[#111111] focus:outline-none"
          />
          <Select name="city" label="City" value={filters.city} options={[["", "All cities"], ...cities.map((c) => [c, c] as [string, string])]} />
          <Select
            name="field"
            label="Field"
            value={filters.field}
            options={[["", "All fields"], ...Object.entries(FIELD_LABELS)]}
          />
          <Select name="within" label="Posted" value={one("within")} options={WITHIN.map((w) => [w.value, w.label])} />
          <div className="flex flex-wrap items-center gap-4 sm:col-span-4">
            <Check name="remote" label="Remote only" checked={filters.remote} />
            <Check name="paid" label="Paid only" checked={filters.paid} />
            <div className="ml-auto flex gap-2">
              <Link href={tab === "all" ? "/internships" : `/internships?tab=${tab}`} className="flex h-9 items-center rounded-[8px] px-3 text-[13px] font-medium text-[#626260] hover:text-[#111111]">
                Reset
              </Link>
              <button type="submit" className="h-9 rounded-[8px] bg-[#111111] px-4 text-[13px] font-medium text-white transition-colors hover:bg-black">
                Apply filters
              </button>
            </div>
          </div>
        </form>

        {tab === "recommended" && careers.length > 0 && shown.length > 0 && (
          <p className="mt-4 text-[12px] text-[#7b7b78]">Matched to: {careers.slice(0, 4).join(" · ")}</p>
        )}

        {shown.length === 0 ? (
          <Empty tab={tab} missing={missing} noCareers={tab === "recommended" && careers.length === 0} filtered={rows.length === 0 && Object.values(filters).some(Boolean)} />
        ) : (
          <ul className="mt-4 space-y-3">
            {shown.map((r) => (
              <Card key={r.id} r={r} saved={savedIds.has(r.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Card({ r, saved }: { r: Internship; saved: boolean }) {
  const place = r.city ? (r.is_remote ? `${r.city} · Remote` : r.city) : r.is_remote ? "Remote (Pakistan)" : "Pakistan";
  return (
    <li className="rounded-[12px] border border-[#d3cec6] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-snug text-[#111111]">{r.title}</h2>
          <p className="mt-0.5 text-[13px] text-[#626260]">
            {r.company} · {place}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill>{FIELD_LABELS[r.field]}</Pill>
            {r.is_paid === true && <Pill tone="green">{r.stipend ? `Paid · ${r.stipend}` : "Paid"}</Pill>}
            {r.is_paid === false && <Pill>Unpaid</Pill>}
            {r.is_trainee && <Pill>Trainee programme</Pill>}
            {r.deadline && <Pill tone="orange">Apply by {formatDay(r.deadline)}</Pill>}
          </div>
          {r.description && <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-[#7b7b78]">{r.description}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <SaveButton id={r.id} initial={saved} />
          <a
            href={r.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center rounded-[8px] bg-[#ff5600] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#e64d00]"
          >
            Apply ↗
          </a>
        </div>
      </div>
      <p className="mt-3 border-t border-[#ebe7e1] pt-2.5 text-[11.5px] text-[#9c9fa5]">
        {r.posted_at ? `Posted ${timeAgo(r.posted_at)}` : `Found ${timeAgo(r.first_seen_at)}`} · via {SOURCE_LABELS[r.source] ?? r.source} · link checked{" "}
        {timeAgo(r.last_checked_at)}
      </p>
    </li>
  );
}

function Empty({ tab, missing, noCareers, filtered }: { tab: Tab; missing: boolean; noCareers: boolean; filtered: boolean }) {
  const [title, body] = missing
    ? ["Internships are on their way", "The internship feed hasn't been switched on yet. Check back soon."]
    : tab === "saved"
      ? ["Nothing saved yet", "Tap Save on any internship to keep it here."]
      : noCareers
        ? ["No career picked yet", "Take the career assessment or start a roadmap and we'll match internships to it."]
        : filtered
          ? ["No internships match these filters", "Try a different city or field, or widen the date range."]
          : ["No matching internships right now", "New listings are added every few hours."];
  return (
    <div className="mt-6 rounded-[12px] border border-dashed border-[#d3cec6] bg-white px-6 py-12 text-center">
      <p className="text-[15px] font-medium text-[#111111]">{title}</p>
      <p className="mt-1 text-[13px] text-[#9c9fa5]">{body}</p>
      {noCareers && (
        <Link href="/assessment" className="mt-5 inline-block rounded-[8px] bg-[#111111] px-4 py-2 text-[13px] font-medium text-white hover:bg-black">
          Take the assessment
        </Link>
      )}
    </div>
  );
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <select
      name={name}
      aria-label={label}
      defaultValue={value ?? ""}
      className="h-9 rounded-[8px] border border-[#d3cec6] bg-white px-2 text-[13px] text-[#111111] focus:border-[#111111] focus:outline-none"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function Check({ name, label, checked }: { name: string; label: string; checked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#111111]">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="h-4 w-4 accent-[#111111]" />
      {label}
    </label>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: "green" | "orange" }) {
  const cls =
    tone === "green"
      ? "border-[#0bdf50]/30 bg-[#0bdf50]/10 text-[#0a7d30]"
      : tone === "orange"
        ? "border-[#ff5600]/30 bg-[#ff5600]/10 text-[#b34100]"
        : "border-[#d3cec6] bg-[#f5f1ec] text-[#626260]";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
