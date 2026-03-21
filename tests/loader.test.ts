import { beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { encryptString, generateKeyPair, type KeyPair } from '../src/crypto.js';
import { deepFreeze } from '../src/deep_freeze.js';
import { createConfig } from '../src/loader.js';

describe('createConfig', () => {
  let keyPair: KeyPair;

  beforeAll(() => {
    keyPair = generateKeyPair();
  });

  it('should select config based on environment', async () => {
    const schema = z.object({ mode: z.string() });

    const { config, environment } = await createConfig({
      configs: {
        test: deepFreeze({ mode: 'test' }),
        production: deepFreeze({ mode: 'production' }),
      },
      environment: 'production',
      schema,
    });

    expect(config.mode).toBe('production');
    expect(environment).toBe('production');
  });

  it('should return plaintext config without a private key', async () => {
    const schema = z.object({ secret: z.string() });

    const { config } = await createConfig({
      configs: { test: deepFreeze({ secret: 'plaintext' }) },
      environment: 'test',
      schema,
    });

    expect(config.secret).toBe('plaintext');
  });

  it('should decrypt config with a string private key', async () => {
    const encrypted = encryptString('my-secret', keyPair.publicKey);
    const schema = z.object({ secret: z.string(), plain: z.string() });

    const { config } = await createConfig({
      configs: { production: deepFreeze({ secret: encrypted, plain: 'visible' }) },
      environment: 'production',
      privateKey: keyPair.privateKey.toString('base64'),
      schema,
    });

    expect(config.secret).toBe('my-secret');
    expect(config.plain).toBe('visible');
  });

  it('should decrypt config with a sync resolver', async () => {
    const encrypted = encryptString('from-resolver', keyPair.publicKey);
    const schema = z.object({ secret: z.string() });

    const { config } = await createConfig({
      configs: { production: deepFreeze({ secret: encrypted }) },
      environment: 'production',
      privateKey: () => keyPair.privateKey.toString('base64'),
      schema,
    });

    expect(config.secret).toBe('from-resolver');
  });

  it('should decrypt config with an async resolver', async () => {
    const encrypted = encryptString('from-kms', keyPair.publicKey);
    const schema = z.object({ secret: z.string() });

    const { config } = await createConfig({
      configs: { production: deepFreeze({ secret: encrypted }) },
      environment: 'production',
      privateKey: async () => keyPair.privateKey.toString('base64'),
      schema,
    });

    expect(config.secret).toBe('from-kms');
  });

  it('should throw when config has encrypted values but no key', async () => {
    const encrypted = encryptString('secret', keyPair.publicKey);
    const schema = z.object({ secret: z.string() });

    await expect(
      createConfig({
        configs: { production: deepFreeze({ secret: encrypted }) },
        environment: 'production',
        schema,
      })
    ).rejects.toThrow('contains encrypted values but no private key');
  });

  it('should throw on invalid environment', async () => {
    const schema = z.object({});

    await expect(
      createConfig({
        configs: { test: deepFreeze({}) },
        environment: 'invalid' as 'test',
        schema,
      })
    ).rejects.toThrow('Invalid environment "invalid"');
  });

  it('should throw when configs is empty', async () => {
    const schema = z.object({});

    await expect(
      createConfig({ configs: {}, environment: 'test' as never, schema })
    ).rejects.toThrow('at least one environment');
  });

  it('should pass valid config through schema', async () => {
      const schema = z.object({ host: z.string(), port: z.number() });

      const { config } = await createConfig({
        configs: { test: deepFreeze({ host: 'localhost', port: 3000 }) },
        environment: 'test',
        schema,
      });

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(3000);
    });

    it('should apply schema transforms', async () => {
      const schema = z.object({
        port: z.coerce.number(),
      });

      const { config } = await createConfig({
        configs: { test: deepFreeze({ port: '8080' }) },
        environment: 'test',
        schema,
      });

      expect(config.port).toBe(8080);
    });

    it('should apply schema defaults', async () => {
      const schema = z.object({
        host: z.string(),
        port: z.number().default(5432),
      });

      const { config } = await createConfig({
        configs: { test: deepFreeze({ host: 'localhost' }) },
        environment: 'test',
        schema,
      });

      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
    });

    it('should throw on single validation error with formatted message', async () => {
      const schema = z.object({ port: z.number() });

      const error = await createConfig({
        configs: { test: deepFreeze({ port: 'not-a-number' }) },
        environment: 'test',
        schema,
      }).catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect(error!.message).toContain('✖ port:');
    });

    it('should throw with multiple errors and formatted paths', async () => {
      const schema = z.object({
        database: z.object({ port: z.number() }),
        api: z.object({ key: z.string() }),
      });

      const error = await createConfig({
        configs: { test: deepFreeze({ database: { port: 'bad' }, api: { key: 123 } }) },
        environment: 'test',
        schema,
      }).catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect(error!.message).toContain('✖ database.port:');
      expect(error!.message).toContain('✖ api.key:');
    });

    it('should validate after decryption', async () => {
      const schema = z.object({ secret: z.string(), plain: z.string() });
      const encrypted = encryptString('my-secret', keyPair.publicKey);

      const { config } = await createConfig({
        configs: { production: deepFreeze({ secret: encrypted, plain: 'visible' }) },
        environment: 'production',
        privateKey: keyPair.privateKey.toString('base64'),
        schema,
      });

      expect(config.secret).toBe('my-secret');
      expect(config.plain).toBe('visible');
    });
});
