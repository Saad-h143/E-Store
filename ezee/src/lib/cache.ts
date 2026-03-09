/**
 * Simple in-memory cache with TTL support.
 * Cached data persists across page navigations (SPA) but
 * clears on hard refresh. Mutations invalidate relevant keys.
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
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (isValid(entry)) return entry.data;
  if (entry) store.delete(key);
  return null;
}

export function cacheSet<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  store.set(key, { data, timestamp: Date.now(), ttl });
}

export function cacheInvalidate(...patterns: string[]): void {
  for (const pattern of patterns) {
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) store.delete(key);
      }
    } else {
      store.delete(pattern);
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
}

export { DEFAULT_TTL, ADMIN_TTL };
