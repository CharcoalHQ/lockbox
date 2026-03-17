import { beforeAll, describe, expect, it } from 'vitest';
import { encryptString, generateKeyPair, type KeyPair } from '../src/crypto.js';
import { deepFreeze } from '../src/deep_freeze.js';
import { createConfig } from '../src/loader.js';

describe('createConfig', () => {
  let keyPair: KeyPair;

  beforeAll(() => {
    keyPair = generateKeyPair();
  });

  it('should select config based on environment', async () => {
    const { config, environment } = await createConfig({
      configs: {
        test: deepFreeze({ mode: 'test' }),
        production: deepFreeze({ mode: 'production' }),
      },
      environment: 'production',
    });

    expect(config.mode).toBe('production');
    expect(environment).toBe('production');
  });

  it('should return plaintext config without a private key', async () => {
    const { config } = await createConfig({
      configs: { test: deepFreeze({ secret: 'plaintext' }) },
      environment: 'test',
    });

    expect(config.secret).toBe('plaintext');
  });

  it('should decrypt config with a string private key', async () => {
    const encrypted = encryptString('my-secret', keyPair.publicKey);

    const { config } = await createConfig({
      configs: { production: deepFreeze({ secret: encrypted, plain: 'visible' }) },
      environment: 'production',
      privateKey: keyPair.privateKey.toString('base64'),
    });

    expect(config.secret).toBe('my-secret');
    expect(config.plain).toBe('visible');
  });

  it('should decrypt config with a sync resolver', async () => {
    const encrypted = encryptString('from-resolver', keyPair.publicKey);

    const { config } = await createConfig({
      configs: { production: deepFreeze({ secret: encrypted }) },
      environment: 'production',
      privateKey: () => keyPair.privateKey.toString('base64'),
    });

    expect(config.secret).toBe('from-resolver');
  });

  it('should decrypt config with an async resolver', async () => {
    const encrypted = encryptString('from-kms', keyPair.publicKey);

    const { config } = await createConfig({
      configs: { production: deepFreeze({ secret: encrypted }) },
      environment: 'production',
      privateKey: async () => keyPair.privateKey.toString('base64'),
    });

    expect(config.secret).toBe('from-kms');
  });

  it('should throw when config has encrypted values but no key', async () => {
    const encrypted = encryptString('secret', keyPair.publicKey);

    await expect(
      createConfig({
        configs: { production: deepFreeze({ secret: encrypted }) },
        environment: 'production',
      })
    ).rejects.toThrow('contains encrypted values but no private key');
  });

  it('should throw on invalid environment', async () => {
    await expect(
      createConfig({
        configs: { test: deepFreeze({}) },
        environment: 'invalid' as 'test',
      })
    ).rejects.toThrow('Invalid environment "invalid"');
  });

  it('should throw when configs is empty', async () => {
    await expect(
      createConfig({ configs: {}, environment: 'test' as never })
    ).rejects.toThrow('at least one environment');
  });
});
