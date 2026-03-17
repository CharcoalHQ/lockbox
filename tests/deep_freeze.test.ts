import { describe, expect, it } from 'vitest';
import { deepFreeze } from '../src/deep_freeze.js';

describe('deepFreeze', () => {
  it('should freeze a flat object', () => {
    const obj = deepFreeze({ a: 1, b: 'hello' });
    expect(Object.isFrozen(obj)).toBe(true);
  });

  it('should freeze nested objects', () => {
    const obj = deepFreeze({ outer: { inner: { value: 42 } } });
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.outer)).toBe(true);
    expect(Object.isFrozen(obj.outer.inner)).toBe(true);
  });

  it('should throw on mutation in strict mode', () => {
    const obj = deepFreeze({ a: 1 });
    expect(() => {
      (obj as Record<string, unknown>).a = 2;
    }).toThrow();
  });

  it('should throw on nested mutation in strict mode', () => {
    const obj = deepFreeze({ outer: { value: 'hello' } });
    expect(() => {
      (obj.outer as Record<string, unknown>).value = 'world';
    }).toThrow();
  });

  it('should return the same object reference', () => {
    const original = { a: 1 };
    const frozen = deepFreeze(original);
    expect(frozen).toBe(original);
  });
});
