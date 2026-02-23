/**
 * Memoization utility
 * Cache function results to avoid expensive recomputation
 */

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: {
    maxSize?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  },
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  const maxSize = options?.maxSize ?? 100;

  const getKey = options?.keyGenerator ?? ((...args: unknown[]) => JSON.stringify(args));

  return ((...args: Parameters<T>) => {
    const key = getKey(...args);

    const cached = cache.get(key);
    if (cached) {
      return cached.value;
    }

    const result = fn(...args) as ReturnType<T>;

    // Implement LRU eviction if over size
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  }) as T;
}
