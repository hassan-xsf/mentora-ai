import type { Field } from "../types";

/** Lowercase, strip diacritics ("Islāmābād" -> "islamabad"). */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ─── Location ────────────────────────────────────────────────────────────────

// [display name, pattern]. Patterns run on folded text.
const CITIES: [string, RegExp][] = [
  ["Karachi", /\bkarachi\b/],
  ["Lahore", /\blahore\b/],
  ["Islamabad", /\bislamabad\b/],
  ["Rawalpindi", /\brawalpindi\b|\bpindi\b/],
  ["Faisalabad", /\bfaisalabad\b|\blyallpur\b/],
  ["Multan", /\bmultan\b/],
  ["Peshawar", /\bpeshawar\b/],
  ["Quetta", /\bquetta\b/],
  ["Sialkot", /\bsialkot\b/],
  ["Gujranwala", /\bgujranwala\b/],
  ["Hyderabad", /\bhyderabad\b/],
  ["Abbottabad", /\babbott?abad\b/],
  ["Bahawalpur", /\bbahawalpur\b/],
  ["Sargodha", /\bsargodha\b/],
  ["Sukkur", /\bsukkur\b/],
  ["Larkana", /\blarkana\b/],
  ["Sahiwal", /\bsahiwal\b/],
  ["Okara", /\bokara\b/],
  ["Sheikhupura", /\bsheikhupura\b/],
  ["Kasur", /\bkasur\b/],
  ["Gujrat", /\bgujrat\b/],
  ["Jhelum", /\bjhelum\b/],
  ["Wah Cantt", /\bwah cantt?\b|\bwah cantonment\b/],
  ["Taxila", /\btaxila\b/],
  ["Attock", /\battock\b/],
  ["Chakwal", /\bchakwal\b/],
  ["Mardan", /\bmardan\b/],
  ["Nowshera", /\bnowshera\b/],
  ["Swabi", /\bswabi\b/],
  ["Kohat", /\bkohat\b/],
  ["Mingora", /\bmingora\b|\bswat\b/],
  ["Mansehra", /\bmansehra\b/],
  ["Haripur", /\bharipur\b/],
  ["Dera Ismail Khan", /\bdera ismail khan\b|\bd\.? ?i\.? ?khan\b/],
  ["Dera Ghazi Khan", /\bdera ghazi khan\b|\bd\.? ?g\.? ?khan\b/],
  ["Rahim Yar Khan", /\brahim ?yar ?khan\b/],
  ["Muzaffarabad", /\bmuzaffarabad\b/],
  ["Mirpur", /\bmirpur\b(?! ?khas)/],
  ["Mirpur Khas", /\bmirpur ?khas\b/],
  ["Gilgit", /\bgilgit\b/],
  ["Skardu", /\bskardu\b/],
  ["Gwadar", /\bgwadar\b/],
  ["Turbat", /\bturbat\b/],
  ["Khuzdar", /\bkhuzdar\b/],
  ["Nawabshah", /\bnawabshah\b|\bshaheed benazirabad\b/],
  ["Jacobabad", /\bjacobabad\b/],
  ["Chiniot", /\bchiniot\b/],
  ["Jhang", /\bjhang\b/],
  ["Khanewal", /\bkhanewal\b/],
  ["Vehari", /\bvehari\b/],
  ["Hafizabad", /\bhafizabad\b/],
  ["Narowal", /\bnarowal\b/],
  ["Mandi Bahauddin", /\bmandi bahauddin\b/],
  ["Mianwali", /\bmianwali\b/],
  ["Bannu", /\bbannu\b/],
  ["Murree", /\bmurree\b/],
  ["Kharian", /\bkharian\b/],
  ["Daska", /\bdaska\b/],
  ["Burewala", /\bburewala\b/],
  ["Muzaffargarh", /\bmuzaffargarh\b/],
  ["Thatta", /\bthatta\b/],
  ["Chitral", /\bchitral\b/],
];

// Same names exist elsewhere (Hyderabad India, Mirpur Dhaka): only trust them next to a Pakistan marker.
const AMBIGUOUS = new Set(["Hyderabad", "Mirpur", "Gujrat"]);

const PK_MARKER =
  /\bpakistan\b|\bsindh\b|\bkhyber ?pakhtunkhwa\b|\bkpk\b|\bbalochistan\b|\bbaluchistan\b|\bgilgit[- ]baltistan\b|\bazad (jammu and )?kashmir\b|\bajk\b|\bislamabad capital territory\b|(?:^|[\s,(])pk\)?\s*$/;

const REMOTE = /\bremote\b|\bwork from home\b|\bwfh\b|\btelecommute\b/;

export interface PkLocation {
  ok: boolean;
  city: string | null;
  remote: boolean;
}

/**
 * Onsite: a known Pakistani city (ambiguous names need a Pakistan marker) or "Pakistan".
 * Remote: only when the location itself names Pakistan or a Pakistani city; "Remote"/"Worldwide" alone is rejected.
 */
export function checkPakistan(location: string, remoteFlag = false): PkLocation {
  const t = fold(location);
  const remote = remoteFlag || REMOTE.test(t);
  const marker = PK_MARKER.test(t);
  let best: { name: string; at: number } | null = null;
  for (const [name, re] of CITIES) {
    const m = re.exec(t);
    if (!m || (AMBIGUOUS.has(name) && !marker)) continue;
    if (!best || m.index < best.at) best = { name, at: m.index };
  }
  if (best) return { ok: true, city: best.name, remote };
  return { ok: marker, city: null, remote };
}

// ─── Internship title ────────────────────────────────────────────────────────

const INTERN = /\b(intern|interns|internship|internships|internee|internees|interne)\b/;
const TRAINEE = /\b(trainee|trainees|apprentice|apprentices|apprenticeship)\b/;
// Staff roles that run internship programmes are not internships.
const STAFF =
  /\b(internship|intern)s? (program |programme )?(coordinator|manager|lead|supervisor|recruiter|officer|specialist|director)\b|\b(manager|coordinator|head|director|supervisor|recruiter)\b.*\b(of|for) (the )?(internships?|interns|trainees)\b/;
// Specialist training for qualified doctors (FCPS/MCPS residency), not a student internship.
const RESIDENCY = /\b(fcps|mcps|post ?graduate (medical )?trainee|pgr|residency)\b/;

export function checkInternshipTitle(title: string): { ok: boolean; trainee: boolean } {
  const t = fold(title);
  if (STAFF.test(t) || RESIDENCY.test(t)) return { ok: false, trainee: false };
  if (INTERN.test(t)) return { ok: true, trainee: false };
  if (TRAINEE.test(t)) return { ok: true, trainee: true };
  return { ok: false, trainee: false };
}

// ─── Dedupe ──────────────────────────────────────────────────────────────────

function words(s: string): string {
  return fold(s)
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const COMPANY_NOISE = new Set(["pvt", "private", "ltd", "limited", "inc", "llc", "llp", "plc", "co", "company", "smc", "the", "pakistan", "pk", "corp", "corporation", "group"]);
const TITLE_NOISE = new Set(["hiring", "urgent", "urgently", "paid", "unpaid", "remote", "onsite", "on", "site", "hybrid", "we", "are", "now", "job", "opportunity", "position", "months", "month", "weeks", "fulltime", "full", "time", "parttime", "part"]);

export function normCompany(c: string): string {
  return words(c).split(" ").filter((w) => w && !COMPANY_NOISE.has(w)).join(" ");
}

export function normTitle(t: string): string {
  return words(t)
    .replace(/\binter(nship|nships|nee|nees|ns|ne)\b/g, "intern")
    .split(" ")
    .filter((w) => w && !TITLE_NOISE.has(w) && !/^\d+$/.test(w))
    .join(" ");
}

/** Same company + role + place across sources = one listing. */
export function dedupeKey(company: string, title: string, city: string | null, remote: boolean): string {
  const place = city ? fold(city) : remote ? "remote" : "pakistan";
  return `${normCompany(company)}|${normTitle(title)}|${place}`;
}

const TRACKING = /^(utm_|refid$|trackingid$|position$|pagenum$|trk|gh_src$|source$|ref$|from$|lever-|src$|bb$|xkcb$|vjs$)/i;

export function canonicalUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^[a-z]{2}\.linkedin\.com$/, "linkedin.com");
    const li = /\/jobs\/view\/(?:.*-)?(\d{6,})\/?$/.exec(url.pathname);
    if (url.hostname === "linkedin.com" && li) return `https://linkedin.com/jobs/view/${li[1]}`;
    for (const k of [...url.searchParams.keys()]) if (TRACKING.test(k)) url.searchParams.delete(k);
    url.searchParams.sort();
    return url.toString().replace(/\/(\?|$)/, "$1");
  } catch {
    return u;
  }
}

// ─── Field ───────────────────────────────────────────────────────────────────

// Order matters: first match wins, so the narrower field comes first.
const FIELDS: [Field, RegExp][] = [
  ["engineering", /\b(mechanical|electrical|civil|chemical|mechatronics|electronics?|biomedical|petroleum|textile|industrial|metallurg\w*|aerospace|telecom\w*) (engineer\w*|design\w*|intern\w*|trainee)\b/],
  ["data_ai", /\b(data (scien|analy|engineer|visuali)\w*|machine learning|\bml\b|\bai\b|artificial intelligence|deep learning|\bnlp\b|computer vision|\bllm|generative|analytics|business intelligence|power ?bi|tableau|data mining|big data|mlops)\b/],
  ["design", /\b(design(er|ing)?|\bux\b|ui ?\/ ?ux|graphic|illustrat\w*|animat\w*|motion|video edit\w*|creative|figma|3d artist|art director)\b/],
  ["software", /\b(software|developer|app development|programm(er|ers|ing)|coder|frontend|front[- ]end|backend|back[- ]end|full[- ]?stack|web|mobile|android|ios|flutter|react|angular|vue|node(js)?|python|java\b|javascript|typescript|\.net|dotnet|php|laravel|django|golang|qa|sqa|quality assurance|test automation|devops|cloud|cyber ?security|security analyst|penetration|soc analyst|network|\bit\b|information technology|wordpress|shopify|game dev\w*|unity|blockchain|salesforce|odoo|erp|sap\b|database|sql|computer science|cs intern)\b/],
  ["marketing", /\b(marketing|seo|sem\b|social media|content (writ|creat|market)\w*|copywrit\w*|digital media|brand(ing)?|public relations|\bpr\b|communications?|advertis\w*|growth|sales|business development|lead generation|e-?commerce|amazon|community)\b/],
  ["finance", /\b(financ\w*|accounting|accountant|accounts|audit\w*|tax\w*|banking|bank|investment|treasury|credit|acca|chartered|actuar\w*|bookkeep\w*|payroll|fintech|economics?)\b/],
  ["hr", /\b(hr|human resources?|talent acquisition|recruit\w*|people (ops|operations)|people & culture|hrbp)\b/],
  ["engineering", /\b(engineer\w*|mechanical|electrical|electronics?|civil|chemical|industrial|mechatronics|telecom\w*|biomedical|production|manufacturing|automation|plc|scada|textile|petroleum|mining|robotics|embedded|hardware|construction|architect\w*)\b/],
];

const NOT_DATA = /\bdata entry\b/g;

function fieldOf(text: string, minHits: number): Field | null {
  const t = fold(text).replace(NOT_DATA, "clerical");
  for (const [field, re] of FIELDS) {
    if ((t.match(new RegExp(re.source, "g")) ?? []).length >= minHits) return field;
  }
  return null;
}

/** Deterministic: title keywords first; the description only counts when a field is mentioned at least twice. */
export function classifyField(title: string, description = ""): Field {
  // "it" is a pronoun in prose; only trust it in a title.
  return fieldOf(title, 1) ?? fieldOf(description.slice(0, 600).replace(/\bit\b/gi, ""), 2) ?? "other";
}

// ─── Pay ─────────────────────────────────────────────────────────────────────

const UNPAID = /\bunpaid\b|\bnon[- ]paid\b|\bno stipend\b|\bwithout (any )?stipend\b|\bvoluntary\b|\bvolunteer\b|\bnot paid\b/;
// Bare "paid" is avoided: marketing ads say "paid social", "paid campaigns".
const PAID = /\bpaid (internship|intern|position|opportunity|role|program(me)?)\b|\(paid\)|\bpaid\s*[–-]|\bstipend\b|\bsalary\b|\bremunerat\w*|\ballowance\b/;
const AMOUNT =
  /((?:pkr|rs\.?|usd|\$)\s?\d(?:[\d,.]*\d)?\s?k?(?:\s?(?:-|to|–)\s?(?:pkr|rs\.?|usd|\$)?\s?\d(?:[\d,.]*\d)?\s?k?)?(?:\s?(?:per|a|\/)\s?(?:month|week|hour))?)/i;

export function detectPay(text: string, stipend?: string | null): { isPaid: boolean | null; stipend: string | null } {
  const t = fold(`${stipend ?? ""} ${text}`);
  const amount = stipend?.trim() || AMOUNT.exec(text)?.[1]?.trim() || null;
  if (UNPAID.test(t)) return { isPaid: false, stipend: amount };
  if (amount || PAID.test(t)) return { isPaid: true, stipend: amount };
  return { isPaid: null, stipend: null };
}

// ─── Dates ───────────────────────────────────────────────────────────────────

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Parses "30 November 2026", "Nov 30, 2026", "30/11/2026", "2026-11-30". Day-first for slashes (Pakistan). */
export function parseDate(s: string): Date | null {
  const t = fold(s).trim();
  let m = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m) return utc(+m[1], +m[2], +m[3]);
  m = /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(t);
  if (m) return utc(+m[3], +m[2], +m[1]);
  m = /(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3})[a-z]*[\s,-]+(\d{4})/.exec(t);
  if (m && MONTHS.includes(m[2])) return utc(+m[3], MONTHS.indexOf(m[2]) + 1, +m[1]);
  m = /([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/.exec(t);
  if (m && MONTHS.includes(m[1])) return utc(+m[3], MONTHS.indexOf(m[1]) + 1, +m[2]);
  return null;
}

function utc(y: number, mo: number, d: number): Date | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCDate() === d ? date : null;
}

const DEADLINE = /(?:last date(?: to apply)?|deadline(?: to apply)?|apply by|apply before|closing date|applications close(?:s)?(?: on)?)\s*(?:is|:|-|–|on)?\s*([^\n.;|]{6,40})/i;

export function detectDeadline(text: string): Date | null {
  const m = DEADLINE.exec(text);
  return m ? parseDate(m[1]) : null;
}

const CLOSED =
  /no longer accepting applications|this job (has )?(expired|is closed|is no longer)|job (is )?(closed|expired)|position (has been )?filled|applications? (are |is )?(now )?closed|posting (has )?expired|vacancy (is )?closed|no longer available|this job is no longer/i;

export function looksClosed(text: string): boolean {
  return CLOSED.test(text);
}
