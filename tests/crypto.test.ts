import { beforeAll, describe, expect, it } from 'vitest';
import {
  decryptObject,
  encryptPlaintext,
  encryptString,
  generateKeyPair,
  type KeyPair,
} from '../src/crypto.js';

describe('decryptObject', () => {
  let keyPair: KeyPair;
  let wrongKeyPair: KeyPair;

  beforeAll(() => {
    keyPair = generateKeyPair();
    wrongKeyPair = generateKeyPair();
  });

  describe('string decryption', () => {
    it('should decrypt a simple encrypted string', () => {
      const original = 'my-secret-value';
      const encrypted = encryptString(original, keyPair.publicKey);
      expect(encrypted).not.toBe(original);

      const result = decryptObject({ secret: encrypted }, keyPair);

      expect(result.secret).toBe(original);
    });

    it('should decrypt unicode strings', () => {
      const original = 'こんにちは世界 🌍';
      const encrypted = encryptString(original, keyPair.publicKey);

      const result = decryptObject({ secret: encrypted }, keyPair);

      expect(result.secret).toBe(original);
    });

    it('should decrypt empty strings', () => {
      const original = '';
      const encrypted = encryptString(original, keyPair.publicKey);

      const result = decryptObject({ secret: encrypted }, keyPair);

      expect(result.secret).toBe(original);
    });

    it('should decrypt long strings', () => {
      const original = 'a'.repeat(10000);
      const encrypted = encryptString(original, keyPair.publicKey);

      const result = decryptObject({ secret: encrypted }, keyPair);

      expect(result.secret).toBe(original);
    });
  });

  describe('nested object decryption', () => {
    it('should decrypt values in nested objects', () => {
      const encrypted = encryptString('nested-secret', keyPair.publicKey);

      const result = decryptObject(
        {
          level1: {
            level2: {
              secret: encrypted,
            },
          },
        },
        keyPair
      );

      expect(result.level1.level2.secret).toBe('nested-secret');
    });

    it('should decrypt multiple values at different levels', () => {
      const secret1 = encryptString('secret-1', keyPair.publicKey);
      const secret2 = encryptString('secret-2', keyPair.publicKey);
      const secret3 = encryptString('secret-3', keyPair.publicKey);

      const result = decryptObject(
        {
          topSecret: secret1,
          nested: {
            midSecret: secret2,
            deep: {
              bottomSecret: secret3,
            },
          },
        },
        keyPair
      );

      expect(result.topSecret).toBe('secret-1');
      expect(result.nested.midSecret).toBe('secret-2');
      expect(result.nested.deep.bottomSecret).toBe('secret-3');
    });
  });

  describe('array decryption', () => {
    it('should decrypt values in arrays', () => {
      const secret1 = encryptString('array-secret-1', keyPair.publicKey);
      const secret2 = encryptString('array-secret-2', keyPair.publicKey);

      const result = decryptObject({ secrets: [secret1, secret2] }, keyPair);

      expect(result.secrets).toEqual(['array-secret-1', 'array-secret-2']);
    });

    it('should decrypt values in arrays of objects', () => {
      const secret1 = encryptString('obj-secret-1', keyPair.publicKey);
      const secret2 = encryptString('obj-secret-2', keyPair.publicKey);

      const result = decryptObject(
        {
          items: [{ key: secret1 }, { key: secret2 }],
        },
        keyPair
      );

      expect(result.items[0].key).toBe('obj-secret-1');
      expect(result.items[1].key).toBe('obj-secret-2');
    });

    it('should handle nested arrays', () => {
      const secret = encryptString('nested-array-secret', keyPair.publicKey);

      const result = decryptObject(
        {
          matrix: [[secret]],
        },
        keyPair
      );

      expect(result.matrix[0][0]).toBe('nested-array-secret');
    });
  });

  describe('passthrough behavior', () => {
    it('should pass through non-encrypted strings', () => {
      const result = decryptObject(
        {
          plaintext: 'not-encrypted',
          number: 42,
          boolean: true,
        },
        keyPair
      );

      expect(result.plaintext).toBe('not-encrypted');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
    });

    it('should pass through null and undefined', () => {
      const result = decryptObject(
        {
          nullValue: null,
          undefinedValue: undefined,
        },
        keyPair
      );

      expect(result.nullValue).toBe(null);
      expect(result.undefinedValue).toBe(undefined);
    });

    it('should handle mixed encrypted and non-encrypted values', () => {
      const encrypted = encryptString('secret-value', keyPair.publicKey);

      const result = decryptObject(
        {
          secret: encrypted,
          plaintext: 'visible',
          count: 123,
        },
        keyPair
      );

      expect(result.secret).toBe('secret-value');
      expect(result.plaintext).toBe('visible');
      expect(result.count).toBe(123);
    });
  });

  describe('error handling', () => {
    it('should throw on invalid encrypted data', () => {
      expect(() => decryptObject({ secret: 'ENC[invalid-base64!!!]' }, keyPair)).toThrow();
    });

    it('should throw on truncated ciphertext', () => {
      const tooShort = Buffer.from('short').toString('base64');
      expect(() => decryptObject({ secret: `ENC[${tooShort}]` }, keyPair)).toThrow();
    });

    it('should throw on wrong key', () => {
      const encrypted = encryptString('secret', keyPair.publicKey);

      expect(() => decryptObject({ secret: encrypted }, wrongKeyPair)).toThrow();
    });

    it('should throw on tampered ciphertext', () => {
      const encrypted = encryptString('secret', keyPair.publicKey);
      const tampered = encrypted.slice(0, -5) + 'XXXX]';

      expect(() => decryptObject({ secret: tampered }, keyPair)).toThrow();
    });
  });

  describe('type preservation', () => {
    it('should preserve object structure', () => {
      const encrypted = encryptString('secret', keyPair.publicKey);
      const input = {
        a: { b: { c: encrypted } },
        arr: [1, 2, 3],
        str: 'hello',
      };

      const result = decryptObject(input, keyPair);

      expect(result.a.b.c).toBe('secret');
      expect(result.arr).toEqual([1, 2, 3]);
      expect(result.str).toBe('hello');
    });
  });
});

describe('encryptPlaintext', () => {
  let keyPair: KeyPair;

  beforeAll(() => {
    keyPair = generateKeyPair();
  });

  it('should encrypt plaintext values and leave encrypted values unchanged', () => {
    const alreadyEncrypted = encryptString('already', keyPair.publicKey);
    const obj = {
      plain: 'hello',
      encrypted: alreadyEncrypted,
      num: 42,
    };

    const { result, didChange } = encryptPlaintext(obj, keyPair.publicKey);

    expect(didChange).toBe(true);
    expect(result.plain).toMatch(/^ENC\[/);
    expect(result.plain).not.toBe('hello');
    expect(result.encrypted).toBe(alreadyEncrypted);
    expect(result.num).toBe(42);
  });

  it('should report no change when all strings are already encrypted', () => {
    const obj = {
      a: encryptString('x', keyPair.publicKey),
      b: 123,
    };

    const { didChange } = encryptPlaintext(obj, keyPair.publicKey);
    expect(didChange).toBe(false);
  });

  it('should handle nested objects', () => {
    const obj = { outer: { inner: 'secret' } };
    const { result, didChange } = encryptPlaintext(obj, keyPair.publicKey);

    expect(didChange).toBe(true);
    expect(result.outer.inner).toMatch(/^ENC\[/);
  });
});
