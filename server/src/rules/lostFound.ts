import type { DatabaseSync } from 'node:sqlite';
import type { LostFoundItem } from '../types.js';

export interface LostFoundSearchResult {
  items: LostFoundItem[];
  matchCount: number;
}

/**
 * Search lost & found items by keyword matching against description.
 * Simple keyword-based search, no LLM.
 */
export function searchLostFound(
  db: DatabaseSync,
  description: string,
): LostFoundSearchResult {
  // Extract meaningful keywords (>2 chars)
  const keywords = description
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .filter((w) => !['the', 'and', 'for', 'was', 'has', 'have', 'with', 'that', 'this', 'from'].includes(w));

  if (keywords.length === 0) {
    // Return all unmatched items
    const items = db
      .prepare('SELECT * FROM lost_found WHERE matched = 0 ORDER BY timestamp DESC')
      .all() as unknown as LostFoundItem[];
    return { items, matchCount: items.length };
  }

  // Build LIKE clauses for keyword matching
  const allItems = db
    .prepare('SELECT * FROM lost_found WHERE matched = 0 ORDER BY timestamp DESC')
    .all() as unknown as LostFoundItem[];

  const scored = allItems.map((item) => {
    const desc = item.description.toLowerCase();
    const score = keywords.filter((k) => desc.includes(k)).length;
    return { item, score };
  });

  // Return items with at least one keyword match, sorted by relevance
  const matches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);

  return { items: matches, matchCount: matches.length };
}
