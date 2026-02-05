import { LRUCache } from 'lru-cache';
import type { SearchResult } from './players';

export interface SearchCacheValue {
  results: SearchResult[];
  ms: number;
}

const cache = new LRUCache<string, SearchCacheValue>({
  max: 5000,
  ttl: 1000 * 60 * 60
});

export function getCache() {
  return cache;
}

export function makeCacheKey(query: string, league: string) {
  return `${league}:${query}`;
}
