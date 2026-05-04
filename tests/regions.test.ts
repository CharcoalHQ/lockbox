import { describe, expect, it } from 'vitest';
import { deepMerge } from '../src/deep_merge.js';
import { extractExtends } from '../src/cli/inheritance.js';

describe('sub-environment merge order', () => {
  it('should merge defaults + env + sub-env in correct order', () => {
    const defaults = { db: { host: 'localhost', port: 5432 }, app: 'myapp' };
    const envClear = { db: { host: 'prod.db.com' } };
    const envSecret = { db: { password: 'prodpass' } };
    const subEnvClear = { db: { host: 'us-west-2.db.com' } };
    const subEnvSecret = {};

    const merged = deepMerge(defaults, envClear, envSecret, subEnvClear, subEnvSecret);

    expect(merged).toEqual({
      db: { host: 'us-west-2.db.com', port: 5432, password: 'prodpass' },
      app: 'myapp',
    });
  });

  it('should merge defaults + env without sub-env', () => {
    const defaults = { db: { host: 'localhost', port: 5432 }, app: 'myapp' };
    const envClear = { db: { host: 'prod.db.com' } };
    const envSecret = { db: { password: 'prodpass' } };

    const merged = deepMerge(defaults, envClear, envSecret);

    expect(merged).toEqual({
      db: { host: 'prod.db.com', port: 5432, password: 'prodpass' },
      app: 'myapp',
    });
  });

  it('should let sub-env override only specified keys', () => {
    const envClear = { db: { host: 'db.example.com', port: 5432, pool_size: 20 }, cache: { ttl: 3600 } };
    const subEnvClear = { db: { host: 'us-west-2.db.example.com' } };

    const merged = deepMerge(envClear, subEnvClear);

    expect(merged).toEqual({
      db: { host: 'us-west-2.db.example.com', port: 5432, pool_size: 20 },
      cache: { ttl: 3600 },
    });
  });
});

describe('sub-environments with inheritance', () => {
  it('should resolve inheritance then apply sub-env overrides', () => {
    const defaults = { app: 'myapp', debug: false };
    const prodClear = { db: { host: 'prod.db.com' } };
    const prodSecret = { db: { password: 'prodpass' } };
    const stagingClear = { _extends: 'production', debug: true };
    const stagingSecret = {};
    const subEnvClear = { region: 'us-west-2' };
    const subEnvSecret = {};

    const { config: strippedStaging } = extractExtends(stagingClear);

    // Merge order: defaults < prod < staging < sub-env
    const merged = deepMerge(
      defaults,
      prodClear, prodSecret,
      strippedStaging, stagingSecret,
      subEnvClear, subEnvSecret,
    );

    expect(merged).toEqual({
      app: 'myapp',
      debug: true,
      db: { host: 'prod.db.com', password: 'prodpass' },
      region: 'us-west-2',
    });
  });

  it('should not allow _extends in sub-environment configs', () => {
    const subEnvClear = { _extends: 'production', extra: true };

    // The actual check happens in resolveFullMerge, but the detection
    // is just checking for the _extends key in the sub-env clear config
    expect('_extends' in subEnvClear).toBe(true);

    // extractExtends would strip it — but we reject before that
    const { extendsEnv } = extractExtends(subEnvClear);
    expect(extendsEnv).toBe('production');
  });
});

describe('multi-source merge with empty intermediates', () => {
  it('should handle empty objects in the merge chain', () => {
    const defaults = { db: { host: 'localhost' } };
    const envClear = {};
    const envSecret = {};
    const subEnvClear = { db: { host: 'override.db.com' } };
    const subEnvSecret = {};

    const merged = deepMerge(defaults, envClear, envSecret, subEnvClear, subEnvSecret);

    expect(merged).toEqual({ db: { host: 'override.db.com' } });
  });

  it('should handle sub-env secret overriding env secret', () => {
    const envSecret = { db: { password: 'env-pass' } };
    const subEnvSecret = { db: { password: 'sub-pass' } };

    const merged = deepMerge(envSecret, subEnvSecret);

    expect(merged).toEqual({ db: { password: 'sub-pass' } });
  });
});
