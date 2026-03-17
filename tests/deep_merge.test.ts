import { describe, expect, it } from 'vitest';
import { deepMerge } from '../src/deep_merge.js';

describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const result = deepMerge({ a: 1 }, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should override primitive values with later sources', () => {
    const result = deepMerge({ a: 1 }, { a: 2 });
    expect(result).toEqual({ a: 2 });
  });

  it('should deep merge nested objects', () => {
    const result = deepMerge(
      { db: { host: 'localhost', port: 5432 } },
      { db: { host: 'prod.db.com' } }
    );
    expect(result).toEqual({ db: { host: 'prod.db.com', port: 5432 } });
  });

  it('should replace arrays entirely', () => {
    const result = deepMerge({ arr: [1, 2, 3] }, { arr: [4, 5] });
    expect(result).toEqual({ arr: [4, 5] });
  });

  it('should merge three or more sources', () => {
    const result = deepMerge(
      { a: 1, b: 1, c: 1 },
      { b: 2, c: 2 },
      { c: 3 }
    );
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should handle empty objects', () => {
    const result = deepMerge({}, { a: 1 });
    expect(result).toEqual({ a: 1 });
  });

  it('should not mutate source objects', () => {
    const source1 = { a: { nested: 1 } };
    const source2 = { a: { other: 2 } };
    deepMerge(source1, source2);
    expect(source1).toEqual({ a: { nested: 1 } });
    expect(source2).toEqual({ a: { other: 2 } });
  });

  it('should handle null values', () => {
    const result = deepMerge({ a: 'hello' }, { a: null });
    expect(result).toEqual({ a: null });
  });

  it('should handle deeply nested merges', () => {
    const result = deepMerge(
      { l1: { l2: { l3: { value: 'default' } } } },
      { l1: { l2: { l3: { value: 'override' } } } }
    );
    expect(result).toEqual({ l1: { l2: { l3: { value: 'override' } } } });
  });
});
