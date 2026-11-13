/** Shared ranking for customer/file search. Name always outranks location. */

export type SearchableFields = {
  name: string;
  location?: string | null;
};

export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function words(value: string): string[] {
  return normalizeSearchText(value)
    .split(/[\s\-_/,]+/)
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0)
  );

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function fuzzyHits(text: string, query: string, maxDistance: number): boolean {
  if (!text || !query) return false;
  if (levenshtein(text, query) <= maxDistance) return true;
  return words(text).some((word) => {
    if (Math.abs(word.length - query.length) > maxDistance) return false;
    return levenshtein(word, query) <= maxDistance;
  });
}

/**
 * Higher is better. Returns 0 when there is no match.
 * Name tiers are always above location tiers. Fuzzy is last (queries of 3+ chars).
 */
export function getSearchScore(
  item: SearchableFields,
  rawQuery: string
): number {
  const query = normalizeSearchText(rawQuery);
  if (!query) return 0;

  const name = normalizeSearchText(item.name || "");
  const location = normalizeSearchText(item.location || "");
  let score = 0;

  if (name) {
    if (name === query) score = Math.max(score, 120);
    else if (name.startsWith(query)) score = Math.max(score, 100);
    else if (words(name).some((word) => word.startsWith(query))) {
      score = Math.max(score, 90);
    } else if (name.includes(query)) score = Math.max(score, 80);
  }

  if (location) {
    if (
      location.startsWith(query) ||
      words(location).some((word) => word.startsWith(query))
    ) {
      score = Math.max(score, 60);
    } else if (location.includes(query)) {
      score = Math.max(score, 50);
    }
  }

  if (score === 0 && query.length >= 3) {
    const maxDistance = query.length >= 6 ? 2 : 1;
    if (fuzzyHits(name, query, maxDistance)) score = 30;
    else if (fuzzyHits(location, query, maxDistance)) score = 25;
  }

  return score;
}

export function compareSearchResults(
  a: SearchableFields & { score: number },
  b: SearchableFields & { score: number }
): number {
  if (b.score !== a.score) return b.score - a.score;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

/** Highlight the first case-insensitive occurrence of the query. */
export function highlightSearchMatch(
  text: string,
  rawQuery: string
): { before: string; match: string; after: string } | null {
  const query = rawQuery.trim();
  if (!query || !text) return null;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return null;
  return {
    before: text.slice(0, index),
    match: text.slice(index, index + query.length),
    after: text.slice(index + query.length),
  };
}
