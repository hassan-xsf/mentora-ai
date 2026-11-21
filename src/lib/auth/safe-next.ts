// Only same-site paths: "//evil.com" or "/\evil.com" would be an open redirect.
export function safeNextPath(next: string | null, fallback = "/dashboard"): string {
  return next && next.startsWith("/") && next[1] !== "/" && next[1] !== "\\" ? next : fallback;
}
