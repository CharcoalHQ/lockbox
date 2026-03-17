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

  it('should select config based on NODE_ENV', async () => {
    process.env.NODE_ENV = 'production';

    const testConfig = deepFreeze({ mode: 'test' });
    const prodConfig = deepFreeze({ mode: 'production' });

    const { config, environment } = await createConfig({
      configs: { test: testConfig, production: prodConfig },
      plaintextEnvironments: ['test', 'production'],
    });

    expect(config.mode).toBe('production');
    expect(environment).toBe('production');
  });

  it('should use defaultEnvironment when NODE_ENV is not set', async () => {
    delete process.env.NODE_ENV;

    const { environment } = await createConfig({
      configs: {
        staging: deepFreeze({ x: 1 }),
        production: deepFreeze({ x: 2 }),
      },
      defaultEnvironment: 'staging',
      plaintextEnvironments: ['staging', 'production'],
    });

    expect(environment).toBe('staging');
  });

  it('should fall back to the first key when no default is specified', async () => {
    delete process.env.NODE_ENV;

    const { environment } = await createConfig({
      configs: {
        alpha: deepFreeze({ x: 1 }),
        beta: deepFreeze({ x: 2 }),
      },
      plaintextEnvironments: ['alpha', 'beta'],
    });

    expect(environment).toBe('alpha');
  });

  it('should skip decryption for plaintextEnvironments', async () => {
    process.env.NODE_ENV = 'test';

    const { config } = await createConfig({
      configs: { test: deepFreeze({ secret: 'plaintext' }) },
      plaintextEnvironments: ['test'],
    });

    expect(config.secret).toBe('plaintext');
  });

  it('should decrypt config with a string private key', async () => {
    process.env.NODE_ENV = 'production';

    const encrypted = encryptString('my-secret', keyPair.publicKey);
    const prodConfig = deepFreeze({ secret: encrypted, plain: 'visible' });

    const { config } = await createConfig({
      configs: { production: prodConfig },
      privateKey: keyPair.privateKey.toString('base64'),
    });

    expect(config.secret).toBe('my-secret');
    expect(config.plain).toBe('visible');
  });

  it('should decrypt config with a sync resolver', async () => {
    process.env.NODE_ENV = 'production';

    const encrypted = encryptString('from-resolver', keyPair.publicKey);
    const prodConfig = deepFreeze({ secret: encrypted });

    const { config } = await createConfig({
      configs: { production: prodConfig },
      privateKey: () => keyPair.privateKey.toString('base64'),
    });

    expect(config.secret).toBe('from-resolver');
  });

  it('should decrypt config with an async resolver', async () => {
    process.env.NODE_ENV = 'production';

    const encrypted = encryptString('from-kms', keyPair.publicKey);
    const prodConfig = deepFreeze({ secret: encrypted });

    const { config } = await createConfig({
      configs: { production: prodConfig },
      privateKey: async () => keyPair.privateKey.toString('base64'),
    });

    expect(config.secret).toBe('from-kms');
  });

  it('should throw on invalid environment', async () => {
    process.env.NODE_ENV = 'invalid';

    await expect(
      createConfig({
        configs: { test: deepFreeze({}) },
        plaintextEnvironments: ['test'],
      })
    ).rejects.toThrow('Invalid environment "invalid"');
  });

  it('should throw when private key is not provided for encrypted env', async () => {
    process.env.NODE_ENV = 'production';

    await expect(
      createConfig({
        configs: { production: deepFreeze({}) },
      })
    ).rejects.toThrow('No private key provided');
  });

  it('should support custom envVariable', async () => {
    process.env.APP_ENV = 'staging';

    const { environment } = await createConfig({
      configs: {
        staging: deepFreeze({ x: 1 }),
        production: deepFreeze({ x: 2 }),
      },
      envVariable: 'APP_ENV',
      plaintextEnvironments: ['staging', 'production'],
    });

    expect(environment).toBe('staging');
  });

  it('should throw when configs is empty', async () => {
    await expect(
      createConfig({ configs: {} })
    ).rejects.toThrow('at least one environment');
  });
});
