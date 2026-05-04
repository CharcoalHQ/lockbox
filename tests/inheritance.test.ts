import { describe, expect, it } from 'vitest';
import {
  buildInheritanceMap,
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

describe('buildInheritanceMap', () => {
  it('should build map from filesystem', async () => {
    const { mkdirSync, writeFileSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');

    const dir = join(tmpdir(), `lockbox-test-inheritance-${Date.now()}`);
    mkdirSync(join(dir, 'production'), { recursive: true });
    mkdirSync(join(dir, 'staging'), { recursive: true });
    mkdirSync(join(dir, 'test'), { recursive: true });

    writeFileSync(join(dir, 'production', 'clear.json'), '{}');
    writeFileSync(
      join(dir, 'staging', 'clear.json'),
      JSON.stringify({ _extends: 'production', extra: true })
    );
    writeFileSync(join(dir, 'test', 'clear.json'), '{}');

    try {
      const map = buildInheritanceMap(dir, ['production', 'staging', 'test']);
      expect(map).toEqual({
        production: null,
        staging: 'production',
        test: null,
      });
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
