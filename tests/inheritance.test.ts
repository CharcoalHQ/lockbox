import { describe, expect, it } from 'vitest';
import { deepMerge } from '../src/deep_merge.js';
import {
  extractExtends,
  resolveInheritanceChain,
} from '../src/cli/inheritance.js';

describe('extractExtends', () => {
  it('should return null extendsEnv when no _extends present', () => {
    const input = { host: 'localhost', port: 3000 };
    const result = extractExtends(input);
    expect(result.extendsEnv).toBeNull();
    expect(result.config).toEqual({ host: 'localhost', port: 3000 });
  });

  it('should extract and strip _extends', () => {
    const input = { _extends: 'production', logging: { level: 'debug' } };
    const result = extractExtends(input);
    expect(result.extendsEnv).toBe('production');
    expect(result.config).toEqual({ logging: { level: 'debug' } });
    expect('_extends' in result.config).toBe(false);
  });

  it('should not modify the original object', () => {
    const input = { _extends: 'production', key: 'value' };
    extractExtends(input);
    expect(input._extends).toBe('production');
  });

  it('should throw if _extends is not a string', () => {
    expect(() => extractExtends({ _extends: 123 })).toThrow(
      '_extends must be a string'
    );
  });
});

describe('resolveInheritanceChain', () => {
  it('should return empty chain for env without _extends', () => {
    const map = { test: null, production: null };
    const chain = resolveInheritanceChain('test', map, ['test', 'production']);
    expect(chain).toEqual([]);
  });

  it('should resolve single-level inheritance', () => {
    const map = { staging: 'production', production: null };
    const chain = resolveInheritanceChain('staging', map, [
      'staging',
      'production',
    ]);
    expect(chain).toEqual(['production']);
  });

  it('should resolve multi-level inheritance (most distant first)', () => {
    const map = { dev: 'staging', staging: 'production', production: null };
    const chain = resolveInheritanceChain('dev', map, [
      'dev',
      'staging',
      'production',
    ]);
    expect(chain).toEqual(['production', 'staging']);
  });

  it('should detect circular dependency (a -> b -> a)', () => {
    const map = { a: 'b', b: 'a' };
    expect(() => resolveInheritanceChain('a', map, ['a', 'b'])).toThrow(
      'Circular _extends detected'
    );
  });

  it('should detect self-referential _extends', () => {
    const map = { a: 'a' };
    expect(() => resolveInheritanceChain('a', map, ['a'])).toThrow(
      'Circular _extends detected'
    );
  });

  it('should throw if _extends target does not exist', () => {
    const map = { staging: 'nonexistent' };
    expect(() =>
      resolveInheritanceChain('staging', map, ['staging'])
    ).toThrow('does not exist');
  });
});

describe('inheritance merge behavior', () => {
  it('should merge ancestor layers in correct order', () => {
    const defaults = { app: 'myapp', db: { host: 'localhost', port: 5432 } };
    const prodClear = { db: { host: 'prod.db.com' } };
    const prodSecret = { db: { password: 'prodpass' } };
    const stagingClear = { _extends: 'production', logging: { level: 'debug' } };

    const { config: strippedStaging } = extractExtends(stagingClear);

    const merged = deepMerge(defaults, prodClear, prodSecret, strippedStaging);

    expect(merged).toEqual({
      app: 'myapp',
      db: { host: 'prod.db.com', port: 5432, password: 'prodpass' },
      logging: { level: 'debug' },
    });
  });

  it('should let child override parent values', () => {
    const prodClear = { api: { url: 'https://api.example.com', timeout: 30000 } };
    const stagingClear = { _extends: 'production', api: { timeout: 5000 } };

    const { config: strippedStaging } = extractExtends(stagingClear);

    const merged = deepMerge(prodClear, strippedStaging);

    expect(merged).toEqual({
      api: { url: 'https://api.example.com', timeout: 5000 },
    });
  });
});
