/** What a source adapter returns before any filtering. */
export interface RawListing {
  source: string;
  sourceId: string;
  title: string;
  company: string;
  /** Location exactly as the source shows it, e.g. "Lahore, Punjab, Pakistan" or "Remote - Pakistan". */
  location: string;
  /** Source says the role is remote (workplace type), independent of the location text. */
  remote?: boolean;
  description?: string;
  applyUrl: string;
  postedAt?: Date | null;
  deadline?: Date | null;
  stipend?: string | null;
  /** Source itself marks the listing closed / no longer accepting applications. */
  closed?: boolean;
  /** The source's own job-type field says Internship (counts even when the title doesn't). */
  typeInternship?: boolean;
}

export type Field = "software" | "data_ai" | "design" | "marketing" | "finance" | "hr" | "engineering" | "other";

/** A listing that passed every filter; shape matches the `internships` table. */
export interface Internship {
  source: string;
  source_id: string;
  title: string;
  company: string;
  city: string | null;
  is_remote: boolean;
  is_trainee: boolean;
  field: Field;
  stipend: string | null;
  is_paid: boolean | null;
  description: string | null;
  apply_url: string;
  posted_at: string | null;
  deadline: string | null;
  dedupe_key: string;
}

export type Reject =
  | "not_internship"
  | "not_pakistan"
  | "stale"
  | "expired"
  | "closed"
  | "duplicate"
  | "bad_url";

export interface SourceResult {
  listings: RawListing[];
  /** Non-fatal problems (blocked host, failed board) for the run summary. */
  notes: string[];
}

export interface Source {
  name: string;
  run(): Promise<SourceResult>;
}
