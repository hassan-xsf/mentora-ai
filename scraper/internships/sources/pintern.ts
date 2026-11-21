import type { RawListing, Source, SourceResult } from "../types";
import { checkInternshipTitle, checkPakistan } from "../lib/filters";
import { BlockedError, getJson, getText } from "../lib/http";
import { htmlToText, parseJobPostings } from "../lib/jsonld";

// pintern.net: a Pakistani internship / opportunity board (WordPress Job Manager). Its REST API
// lists the newest posts; each internship post page carries a schema.org JobPosting with
// location, date and deadline, which the shared filters then judge like any other source.

type Post = { id: number; date_gmt: string; link: string; title: { rendered: string } };

export const pinternSource: Source = {
  name: "pintern",
  async run(): Promise<SourceResult> {
    const notes: string[] = [];
    const listings: RawListing[] = [];
    const posts: Post[] = [];
    for (let page = 1; page <= 2; page++) {
      const batch = await getJson<Post[]>(`https://pintern.net/wp-json/wp/v2/job-listings?per_page=100&page=${page}&orderby=date`, { gapMs: 2000 }).catch(
        () => null,
      );
      if (!Array.isArray(batch)) break;
      posts.push(...batch);
    }
    const interns = posts.filter((p) => checkInternshipTitle(htmlToText(p.title.rendered)).ok);
    for (const p of interns) {
      try {
        const { status, text } = await getText(p.link, { gapMs: 2000 });
        if (status !== 200) continue;
        const [job] = parseJobPostings(text, p.link, "pintern");
        if (job) listings.push(normalize(job, String(p.id), new Date(`${p.date_gmt}Z`)));
      } catch (err) {
        if (err instanceof BlockedError) {
          notes.push(`stopped: ${err.message}`);
          break;
        }
      }
    }
    notes.push(`${posts.length} posts, ${interns.length} internship posts`);
    return { listings, notes };
  },
};

const FOREIGN = /\b(united kingdom|uk|england|scotland|usa|united states|canada|australia|germany|uae|dubai|saudi arabia|qatar|switzerland|europe|malaysia|turkey)\b/i;
const YEAR_NOISE = /\s*[(|]?\s*\b20\d\d\b\s*\)?|\bjobs?\b|\bapply (online|now|for)\b/gi;

/**
 * The site stamps every post with country "PK" and a free-text locality, and an automatic expiry
 * 90 days out. So: place comes from locality + title (which names the city), a post whose text
 * points abroad without a Pakistani city is dropped, the 90-day stamp is not a deadline, and the
 * SEO title ("X Intern at Y – Lahore 2026") is cut back to the role.
 */
export function normalize(job: RawListing, id: string, published: Date): RawListing {
  const locality = job.location.split(",")[0] ?? "";
  const titled = `${locality}; ${job.title}`;
  const abroad = !checkPakistan(titled).city && FOREIGN.test(`${job.title} ${job.description?.slice(0, 400) ?? ""}`);
  const postedAt = job.postedAt ?? published;
  const autoExpiry = job.deadline && Math.abs(job.deadline.getTime() - postedAt.getTime() - 90 * 864e5) < 3 * 864e5;
  return {
    ...job,
    sourceId: id,
    title: cleanTitle(job.title),
    location: abroad ? "" : titled,
    remote: job.remote || /\bremote\b/i.test(job.title),
    postedAt,
    deadline: autoExpiry ? null : job.deadline,
  };
}

export function cleanTitle(title: string): string {
  const role = title.split(/\s+(?:at|[–|-])\s+/)[0].replace(YEAR_NOISE, " ").replace(/\s+/g, " ").trim();
  return checkInternshipTitle(role).ok ? role : title.replace(YEAR_NOISE, " ").replace(/\s+/g, " ").trim();
}
