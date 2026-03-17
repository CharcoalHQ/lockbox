import { describe, it, expect } from 'vitest';
import { setNestedValue } from '../src/cli/set.js';

describe('setNestedValue', () => {
  it('sets a top-level key', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'port', 3000);
    expect(obj).toEqual({ port: 3000 });
  });

  it('sets a nested key with dot notation', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'database.host', 'localhost');
    expect(obj).toEqual({ database: { host: 'localhost' } });
  });

  it('sets a deeply nested key', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'a.b.c.d', 'deep');
    expect(obj).toEqual({ a: { b: { c: { d: 'deep' } } } });
  });

  it('preserves existing sibling keys', () => {
    const obj: Record<string, unknown> = { database: { host: 'localhost' } };
    setNestedValue(obj, 'database.port', 5432);
    expect(obj).toEqual({ database: { host: 'localhost', port: 5432 } });
  });

  it('overwrites existing value', () => {
    const obj: Record<string, unknown> = { port: 3000 };
    setNestedValue(obj, 'port', 8080);
    expect(obj).toEqual({ port: 8080 });
  });

  it('overwrites non-object intermediate with object', () => {
    const obj: Record<string, unknown> = { database: 'old' };
    setNestedValue(obj, 'database.host', 'localhost');
    expect(obj).toEqual({ database: { host: 'localhost' } });
  });
});
