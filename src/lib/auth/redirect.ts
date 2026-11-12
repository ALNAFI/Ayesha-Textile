/** Shared redirect sanitizer — Edge/Node safe, no server-only import. */
export function sanitizeRedirectPath(
  candidate: string | null | undefined
): string {
  if (!candidate) return "/";
  if (!candidate.startsWith("/")) return "/";
  if (candidate.startsWith("//")) return "/";
  if (candidate.includes("\\")) return "/";
  if (candidate.startsWith("/login")) return "/";
  return candidate;
}
