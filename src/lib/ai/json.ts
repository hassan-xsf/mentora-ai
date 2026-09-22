/** Strip markdown fences / prose around a model's JSON reply. */
export function extractJSON(raw: string): string {
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  const firstObj = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  const candidates = [firstObj, firstArr].filter((i) => i !== -1);
  const first = candidates.length > 0 ? Math.min(...candidates) : -1;
  if (first > 0) cleaned = cleaned.slice(first);

  // Trailing prose after the document ("...} Hope that helps!") is only safely
  // removable when the JSON is actually balanced — on a truncated response the
  // last brace is mid-document, and cutting there would silently drop data.
  // repairTruncatedJSON owns that case instead.
  const last = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (last !== -1 && last < cleaned.length - 1) {
    const trimmed = cleaned.slice(0, last + 1);
    try {
      JSON.parse(trimmed);
      cleaned = trimmed;
    } catch {
      // Not balanced there — keep the full text for the repair pass.
    }
  }
  return cleaned;
}

/**
 * Salvage a JSON document that was cut off mid-generation.
 *
 * A model that hits its output limit stops mid-token, leaving an unterminated
 * string and a stack of unclosed brackets. Rather than discarding a response
 * that is 95% good, rewind to the last point where an element had cleanly
 * ended, then close whatever is still open.
 *
 * Returns null when there is nothing salvageable.
 */
export function repairTruncatedJSON(raw: string): string | null {
  const open: string[] = []; // pending closers, innermost last
  let inString = false;
  let escaped = false;
  // Cut point of the last complete element, plus the bracket stack at that moment.
  let safeEnd = -1;
  let safeStack: string[] = [];
  // True when the most recent structural event was a closed bracket, i.e. the
  // value that just ended was itself complete. A comma is only a safe cut point
  // in that case — a comma inside a half-written object (`{"a":1,"b` ) would
  // otherwise let us reconstruct a partial element with fields silently missing.
  let lastValueComplete = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }

    if (c === '"') {
      inString = true;
    } else if (c === "{" || c === "[") {
      open.push(c === "{" ? "}" : "]");
      lastValueComplete = false;
    } else if (c === "}" || c === "]") {
      open.pop();
      // A nested value just closed: everything through here is complete.
      safeEnd = i + 1;
      safeStack = [...open];
      lastValueComplete = true;
    } else if (c === ",") {
      if (lastValueComplete) {
        // A whole sibling just ended; cut here, dropping the comma itself.
        safeEnd = i;
        safeStack = [...open];
      }
      lastValueComplete = false;
    }
  }

  if (open.length === 0 && !inString) return raw; // already balanced
  if (safeEnd <= 0) return null;

  return raw.slice(0, safeEnd) + safeStack.reverse().join("");
}

/** extractJSON + JSON.parse, falling back to a truncation repair. */
export function parseJSONLoose<T>(raw: string): T {
  const cleaned = extractJSON(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    const repaired = repairTruncatedJSON(cleaned);
    if (repaired === null) throw err;
    const parsed = JSON.parse(repaired) as T;
    console.warn(
      `[ai] recovered truncated JSON: kept ${repaired.length} of ${cleaned.length} chars`
    );
    return parsed;
  }
}
