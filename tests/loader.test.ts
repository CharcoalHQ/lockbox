import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { encryptString, generateKeyPair, type KeyPair } from '../src/crypto.js';
import { deepFreeze } from '../src/deep_freeze.js';
import { createConfig } from '../src/loader.js';

describe('createConfig', () => {
  let keyPair: KeyPair;
  const originalEnv = { ...process.env };

  beforeAll(() => {
    keyPair = generateKeyPair();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should select config based on NODE_ENV', () => {
    process.env.NODE_ENV = 'production';

    const testConfig = deepFreeze({ mode: 'test' });
    const prodConfig = deepFreeze({ mode: 'production' });

    const { config, environment } = createConfig({
      configs: { test: testConfig, production: prodConfig },
      plaintextEnvironments: ['test', 'production'],
    });

    expect(config.mode).toBe('production');
    expect(environment).toBe('production');
  });

  it('should use defaultEnvironment when NODE_ENV is not set', () => {
    delete process.env.NODE_ENV;

    const { environment } = createConfig({
      configs: {
        staging: deepFreeze({ x: 1 }),
        production: deepFreeze({ x: 2 }),
      },
      defaultEnvironment: 'staging',
      plaintextEnvironments: ['staging', 'production'],
    });

    expect(environment).toBe('staging');
  });

  it('should fall back to the first key when no default is specified', () => {
    delete process.env.NODE_ENV;

    const { environment } = createConfig({
      configs: {
        alpha: deepFreeze({ x: 1 }),
        beta: deepFreeze({ x: 2 }),
      },
      plaintextEnvironments: ['alpha', 'beta'],
    });

    expect(environment).toBe('alpha');
  });

  it('should skip decryption for plaintextEnvironments', () => {
    process.env.NODE_ENV = 'test';

    const { config } = createConfig({
      configs: { test: deepFreeze({ secret: 'plaintext' }) },
      plaintextEnvironments: ['test'],
    });

    expect(config.secret).toBe('plaintext');
  });

  it('should decrypt config for non-plaintext environments', () => {
    process.env.NODE_ENV = 'production';
    process.env.CONFIG_SECRETS_PRIVATE_KEY = keyPair.privateKey.toString('base64');

    const encrypted = encryptString('my-secret', keyPair.publicKey);
    const prodConfig = deepFreeze({ secret: encrypted, plain: 'visible' });

    const { config } = createConfig({
      configs: { production: prodConfig },
      plaintextEnvironments: [],
    });

    expect(config.secret).toBe('my-secret');
    expect(config.plain).toBe('visible');
  });

  it('should throw on invalid environment', () => {
    process.env.NODE_ENV = 'invalid';

    expect(() =>
      createConfig({
        configs: { test: deepFreeze({}) },
        plaintextEnvironments: ['test'],
      })
    ).toThrow('Invalid environment "invalid"');
  });

  it('should throw when private key is missing for encrypted env', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CONFIG_SECRETS_PRIVATE_KEY;

    expect(() =>
      createConfig({
        configs: { production: deepFreeze({}) },
        plaintextEnvironments: [],
      })
    ).toThrow('CONFIG_SECRETS_PRIVATE_KEY is not set');
  });

  it('should support custom envVariable', () => {
    process.env.APP_ENV = 'staging';

    const { environment } = createConfig({
      configs: {
        staging: deepFreeze({ x: 1 }),
        production: deepFreeze({ x: 2 }),
      },
      envVariable: 'APP_ENV',
      plaintextEnvironments: ['staging', 'production'],
    });

    expect(environment).toBe('staging');
  });

  it('should support custom privateKeyVariable', () => {
    process.env.NODE_ENV = 'production';
    process.env.MY_KEY = keyPair.privateKey.toString('base64');

    const encrypted = encryptString('value', keyPair.publicKey);

    const { config } = createConfig({
      configs: { production: deepFreeze({ s: encrypted }) },
      privateKeyVariable: 'MY_KEY',
      plaintextEnvironments: [],
    });

    expect(config.s).toBe('value');
  });

  it('should throw when configs is empty', () => {
    expect(() =>
      createConfig({ configs: {}, plaintextEnvironments: [] })
    ).toThrow('at least one environment');
  });
});
