export function deepFreeze<T extends object>(obj: T): T {
  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value && typeof value === 'object') {
      deepFreeze(value as object);
    }
  }
  return Object.freeze(obj);
}
