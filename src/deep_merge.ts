function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep merge multiple objects. Later sources override earlier ones.
 * Plain objects are merged recursively. All other values (arrays,
 * primitives, null) are replaced entirely by later sources.
 */
export function deepMerge<T = Record<string, unknown>>(
  ...sources: Record<string, unknown>[]
): T {
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (isPlainObject(value) && isPlainObject(result[key])) {
        result[key] = deepMerge(result[key] as Record<string, unknown>, value);
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}
