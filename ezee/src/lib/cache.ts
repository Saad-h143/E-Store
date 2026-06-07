/**
 * In-memory cache with TTL support, backed by localStorage.
 *
 * - In-memory Map keeps data instant during a session (SPA navigations).
 * - localStorage persists entries across hard refreshes / return visits, so
 *   pages render immediately from cache instead of waiting on Supabase.
 * - Freshness is governed by each entry's TTL; stale entries are dropped on read.
 * - Mutations invalidate the relevant keys (in memory and in localStorage).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Default TTL: 2 minutes for store data, 30s for admin
const DEFAULT_TTL = 2 * 60 * 1000;
const ADMIN_TTL = 30 * 1000;

// ---- localStorage backing -------------------------------------------------
const LS_PREFIX = "ezc:";
const canLS = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};
function lsWrite(key: string, entry: CacheEntry<unknown>): void {
  if (!canLS()) return;
  try {
    window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota exceeded / serialization issue — ignore; in-memory cache still works.
  }
}
function lsRead(key: string): CacheEntry<unknown> | undefined {
  if (!canLS()) return undefined;
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<unknown>) : undefined;
  } catch {
    return undefined;
  }
}
function lsRemove(key: string): void {
  if (!canLS()) return;
  try {
    window.localStorage.removeItem(LS_PREFIX + key);
  } catch {
    /* ignore */
  }
}
function lsRemovePrefix(prefix: string): void {
  if (!canLS()) return;
  try {
    for (const k of Object.keys(window.localStorage)) {
      if (k.startsWith(LS_PREFIX + prefix)) window.localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

export const CACHE_KEYS = {
  PRODUCTS_ACTIVE: "products:active",
  PRODUCTS_ALL: "products:all",
  CATEGORIES: "categories",
  SUBCATEGORIES: "subcategories",
  SUBCATEGORIES_BY_CAT: (catId: string) => `subcategories:${catId}`,
  BANNERS: "banners",
  BANNERS_ALL: "banners:all",
  ORDERS: "orders",
  PRODUCT_BY_SLUG: (slug: string) => `product:slug:${slug}`,
  PRODUCT_BY_ID: (id: string) => `product:id:${id}`,
} as const;

function isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < entry.ttl;
}

export function cacheGet<T>(key: string): T | null {
  let entry = store.get(key) as CacheEntry<T> | undefined;

  // On a fresh page load the Map is empty — hydrate from localStorage.
  if (!entry) {
    const persisted = lsRead(key) as CacheEntry<T> | undefined;
    if (persisted) {
      store.set(key, persisted);
      entry = persisted;
    }
  }

  if (isValid(entry)) return entry.data;
  if (entry) {
    store.delete(key);
    lsRemove(key);
  }
  return null;
}

export function cacheSet<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  const entry = { data, timestamp: Date.now(), ttl };
  store.set(key, entry);
  // ttl <= 0 is used as an invalidation signal — clear the persisted copy too.
  if (ttl > 0) lsWrite(key, entry);
  else lsRemove(key);
}

export function cacheInvalidate(...patterns: string[]): void {
  for (const pattern of patterns) {
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
      lsRemovePrefix(prefix);
    } else {
      store.delete(pattern);
      lsRemove(pattern);
    }
  }
}

export function cacheInvalidateProducts(): void {
  cacheInvalidate(
    CACHE_KEYS.PRODUCTS_ACTIVE,
    CACHE_KEYS.PRODUCTS_ALL,
    "product:*"
  );
}

export function cacheInvalidateCategories(): void {
  cacheInvalidate(
    CACHE_KEYS.CATEGORIES,
    CACHE_KEYS.SUBCATEGORIES,
    "subcategories:*"
  );
}

export function cacheInvalidateAll(): void {
  store.clear();
  lsRemovePrefix("");
}

export { DEFAULT_TTL, ADMIN_TTL };
