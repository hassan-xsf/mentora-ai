/**
 * Self-check for resource link classification (mocked fetch, no network).
 * Run: npx tsx src/lib/resources/links.test.ts
 */
import assert from "node:assert/strict";
import { displayLink, isHomepage, isYouTubeMedia, parseHttpUrl, searchUrl, verifyLinks } from "./links";

const U = (s: string) => new URL(s);

// URL parsing rejects non-http schemes (XSS via href).
assert.equal(parseHttpUrl("javascript:alert(1)"), null);
assert.equal(parseHttpUrl("/relative"), null);
assert.equal(parseHttpUrl(null), null);
assert.ok(parseHttpUrl(" https://a.dev/x "));

// Homepages.
assert.ok(isHomepage(U("https://react.dev/")));
assert.ok(isHomepage(U("https://developer.mozilla.org/en-US/")));
assert.ok(isHomepage(U("https://x.com/index.html")));
assert.ok(!isHomepage(U("https://react.dev/reference/react/useEffect")));
assert.ok(!isHomepage(U("https://docs.python.org/3/")));
assert.ok(!isHomepage(U("https://site.com/?page=1")));

// YouTube routing.
assert.ok(isYouTubeMedia(U("https://www.youtube.com/watch?v=abc")));
assert.ok(isYouTubeMedia(U("https://youtu.be/abc")));
assert.ok(isYouTubeMedia(U("https://m.youtube.com/playlist?list=PL1")));
assert.ok(!isYouTubeMedia(U("https://www.youtube.com/@freecodecamp")));

// Search links.
assert.equal(searchUrl("CS50 & you", "video"), "https://www.youtube.com/results?search_query=CS50%20%26%20you");
assert.equal(searchUrl("MDN fetch", "article"), "https://www.google.com/search?q=MDN%20fetch");

// displayLink: legacy rows (no link_kind) never render their raw URL as direct.
assert.deepEqual(displayLink({ title: "T", type: "article", url: "https://dead.example/x" }), {
  href: searchUrl("T", "article"),
  verified: false,
});
assert.deepEqual(displayLink({ title: "T", type: "video", url: "https://y.dev/a", link_kind: "direct" }), {
  href: "https://y.dev/a",
  verified: true,
});
assert.equal(displayLink({ title: "T", type: "note", url: null }), null);
assert.equal(displayLink({ title: "T", type: "note", url: null, link_kind: "none" }), null);

// verifyLinks with a mock fetch.
const calls: string[] = [];
const mock = async (input: string, init?: RequestInit): Promise<Response> => {
  calls.push(`${init?.method ?? "GET"} ${input}`);
  if (init?.signal?.aborted) throw new Error("aborted"); // like real fetch
  if (input.startsWith("https://www.youtube.com/oembed")) {
    return new Response(null, { status: input.includes("good") ? 200 : 404 });
  }
  if (input === "https://ok.dev/doc") return new Response(null, { status: 200 });
  // HEAD not allowed, GET fine.
  if (input === "https://nohead.dev/doc") return new Response(null, { status: init?.method === "HEAD" ? 405 : 200 });
  if (input === "https://dead.dev/doc") return new Response(null, { status: 404 });
  if (input === "https://hang.dev/doc") {
    return new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
  }
  throw new TypeError("fetch failed");
};

// AbortSignal.timeout timers are unref'd; keep the loop alive while mocks hang.
const keepAlive = setInterval(() => {}, 1_000);
(async () => {
  const started = Date.now();
  const out = await verifyLinks(
    [
      { title: "Good video", type: "video", url: "https://www.youtube.com/watch?v=good" },
      { title: "Bad video", type: "video", url: "https://youtu.be/bad" },
      { title: "OK doc", type: "article", url: "https://ok.dev/doc" },
      { title: "No HEAD", type: "article", url: "https://nohead.dev/doc" },
      { title: "Dead", type: "article", url: "https://dead.dev/doc" },
      { title: "Hangs", type: "article", url: "https://hang.dev/doc" },
      { title: "Homepage", type: "article", url: "https://react.dev/" },
      { title: "No url", type: "video", url: null },
      { title: "My note", type: "note", url: null },
      { title: "Evil", type: "article", url: "javascript:alert(1)" },
      { title: "OK doc again", type: "article", url: "https://ok.dev/doc" },
    ],
    { fetchFn: mock, budgetMs: 1_000, requestMs: 400, concurrency: 3 }
  );
  const kinds = out.map((o) => o.link_kind);
  assert.deepEqual(kinds, ["direct", "search", "direct", "direct", "search", "search", "search", "search", "none", "search", "direct"]);
  assert.equal(out[0].url, "https://www.youtube.com/watch?v=good");
  assert.equal(out[1].url, searchUrl("Bad video", "video"));
  assert.equal(out[4].link_status, 404);
  assert.equal(out[5].link_status, 0); // timed out
  assert.equal(out[6].url, searchUrl("Homepage", "article")); // homepage never fetched
  assert.equal(out[9].url, searchUrl("Evil", "article"));
  assert.equal(out[8].url, null);
  assert.ok(Date.now() - started < 1_500, "stays within budget");
  // Duplicate URL checked once; homepage and javascript: never fetched.
  assert.equal(calls.filter((c) => c.includes("ok.dev")).length, 1);
  assert.ok(!calls.some((c) => c.includes("react.dev") || c.includes("javascript")));

  // Budget exhausted: remaining links fall back to search without fetching.
  const slow = await verifyLinks(
    [
      { title: "A", type: "article", url: "https://hang.dev/doc" },
      { title: "B", type: "article", url: "https://ok.dev/doc" },
    ],
    { fetchFn: mock, budgetMs: 500, requestMs: 5_000, concurrency: 1 }
  );
  assert.deepEqual(slow.map((s) => s.link_kind), ["search", "search"]);

  clearInterval(keepAlive);
  console.log("links self-check: OK");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
