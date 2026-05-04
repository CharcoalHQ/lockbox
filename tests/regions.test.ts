import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  discoverSubEnvironments,
  loadSubEnvConfig,
  resolveFullMerge,
} from '../src/cli/utils.js';

describe('discoverSubEnvironments', () => {
  let dir: string;

  beforeAll(() => {
    dir = join(tmpdir(), `lockbox-test-subenvs-${Date.now()}`);
    mkdirSync(join(dir, 'production', 'us-west-2'), { recursive: true });
    mkdirSync(join(dir, 'production', 'eu-central-1'), { recursive: true });
    mkdirSync(join(dir, 'test'), { recursive: true });

    writeFileSync(join(dir, 'production', 'clear.json'), '{}');
    writeFileSync(join(dir, 'production', 'secret.json'), '{}');
    writeFileSync(
      join(dir, 'production', 'us-west-2', 'clear.json'),
      JSON.stringify({ region: 'us-west-2' })
    );
    writeFileSync(join(dir, 'production', 'us-west-2', 'secret.json'), '{}');
    writeFileSync(
      join(dir, 'production', 'eu-central-1', 'clear.json'),
      JSON.stringify({ region: 'eu-central-1' })
    );
    writeFileSync(join(dir, 'production', 'eu-central-1', 'secret.json'), '{}');
    writeFileSync(join(dir, 'test', 'clear.json'), '{}');
    writeFileSync(join(dir, 'test', 'secret.json'), '{}');
  });

  afterAll(() => {
    rmSync(dir, { recursive: true });
  });

  it('should discover sub-environments within an environment', () => {
    const subEnvs = discoverSubEnvironments(dir, 'production');
    expect(subEnvs).toEqual(['eu-central-1', 'us-west-2']);
  });

  it('should return empty array for env without sub-environments', () => {
    const subEnvs = discoverSubEnvironments(dir, 'test');
    expect(subEnvs).toEqual([]);
  });

  it('should return empty array for nonexistent env', () => {
    const subEnvs = discoverSubEnvironments(dir, 'nonexistent');
    expect(subEnvs).toEqual([]);
  });
});

describe('loadSubEnvConfig', () => {
  let dir: string;

  beforeAll(() => {
    dir = join(tmpdir(), `lockbox-test-subenvload-${Date.now()}`);
    mkdirSync(join(dir, 'production', 'us-west-2'), { recursive: true });
    writeFileSync(
      join(dir, 'production', 'us-west-2', 'clear.json'),
      JSON.stringify({ endpoint: 'us-west-2.example.com' })
    );
    writeFileSync(
      join(dir, 'production', 'us-west-2', 'secret.json'),
      JSON.stringify({ token: 'secret-us' })
    );
  });

  afterAll(() => {
    rmSync(dir, { recursive: true });
  });

  it('should load sub-environment clear and secret configs', () => {
    const config = loadSubEnvConfig(dir, 'production', 'us-west-2');
    expect(config.clear).toEqual({ endpoint: 'us-west-2.example.com' });
    expect(config.secret).toEqual({ token: 'secret-us' });
  });
});

describe('resolveFullMerge with sub-environments', () => {
  let dir: string;

  beforeAll(() => {
    dir = join(tmpdir(), `lockbox-test-fullmerge-${Date.now()}`);
    mkdirSync(join(dir, 'production', 'us-west-2'), { recursive: true });

    writeFileSync(
      join(dir, 'default.json'),
      JSON.stringify({ db: { host: 'localhost', port: 5432 }, app: 'myapp' })
    );
    writeFileSync(
      join(dir, 'production', 'clear.json'),
      JSON.stringify({ db: { host: 'prod.db.com' } })
    );
    writeFileSync(
      join(dir, 'production', 'secret.json'),
      JSON.stringify({ db: { password: 'prodpass' } })
    );
    writeFileSync(
      join(dir, 'production', 'us-west-2', 'clear.json'),
      JSON.stringify({ db: { host: 'us-west-2.db.com' } })
    );
    writeFileSync(
      join(dir, 'production', 'us-west-2', 'secret.json'),
      '{}'
    );
  });

  afterAll(() => {
    rmSync(dir, { recursive: true });
  });

  it('should merge defaults + env + sub-env in correct order', () => {
    const defaults = { db: { host: 'localhost', port: 5432 }, app: 'myapp' };
    const merged = resolveFullMerge(dir, 'production', defaults, ['production'], 'us-west-2');

    expect(merged).toEqual({
      db: { host: 'us-west-2.db.com', port: 5432, password: 'prodpass' },
      app: 'myapp',
    });
  });

  it('should merge defaults + env without sub-env', () => {
    const defaults = { db: { host: 'localhost', port: 5432 }, app: 'myapp' };
    const merged = resolveFullMerge(dir, 'production', defaults, ['production']);

    expect(merged).toEqual({
      db: { host: 'prod.db.com', port: 5432, password: 'prodpass' },
      app: 'myapp',
    });
  });
});

describe('resolveFullMerge with inheritance + sub-environments', () => {
  let dir: string;

  beforeAll(() => {
    dir = join(tmpdir(), `lockbox-test-inherit-subenv-${Date.now()}`);
    mkdirSync(join(dir, 'production'), { recursive: true });
    mkdirSync(join(dir, 'staging', 'us-west-2'), { recursive: true });

    writeFileSync(
      join(dir, 'default.json'),
      JSON.stringify({ app: 'myapp', debug: false })
    );
    writeFileSync(
      join(dir, 'production', 'clear.json'),
      JSON.stringify({ db: { host: 'prod.db.com' } })
    );
    writeFileSync(
      join(dir, 'production', 'secret.json'),
      JSON.stringify({ db: { password: 'prodpass' } })
    );
    writeFileSync(
      join(dir, 'staging', 'clear.json'),
      JSON.stringify({ _extends: 'production', debug: true })
    );
    writeFileSync(join(dir, 'staging', 'secret.json'), '{}');
    writeFileSync(
      join(dir, 'staging', 'us-west-2', 'clear.json'),
      JSON.stringify({ region: 'us-west-2' })
    );
    writeFileSync(join(dir, 'staging', 'us-west-2', 'secret.json'), '{}');
  });

  afterAll(() => {
    rmSync(dir, { recursive: true });
  });

  it('should resolve inheritance then apply sub-env overrides', () => {
    const defaults = { app: 'myapp', debug: false };
    const merged = resolveFullMerge(
      dir,
      'staging',
      defaults,
      ['production', 'staging'],
      'us-west-2'
    );

    expect(merged).toEqual({
      app: 'myapp',
      debug: true,
      db: { host: 'prod.db.com', password: 'prodpass' },
      region: 'us-west-2',
    });
  });
});

describe('resolveFullMerge rejects _extends in sub-environments', () => {
  let dir: string;

  beforeAll(() => {
    dir = join(tmpdir(), `lockbox-test-subenv-extends-${Date.now()}`);
    mkdirSync(join(dir, 'production', 'us-west-2'), { recursive: true });

    writeFileSync(join(dir, 'production', 'clear.json'), '{}');
    writeFileSync(join(dir, 'production', 'secret.json'), '{}');
    writeFileSync(
      join(dir, 'production', 'us-west-2', 'clear.json'),
      JSON.stringify({ _extends: 'production' })
    );
    writeFileSync(join(dir, 'production', 'us-west-2', 'secret.json'), '{}');
  });

  afterAll(() => {
    rmSync(dir, { recursive: true });
  });

  it('should throw when sub-env clear.json has _extends', () => {
    expect(() =>
      resolveFullMerge(dir, 'production', {}, ['production'], 'us-west-2')
    ).toThrow('_extends is not supported in sub-environment configs');
  });
});
