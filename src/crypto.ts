/**
 * Encryption utilities using sodium-native sealed boxes.
 *
 * Sealed boxes allow encryption with a public key where only the
 * private key holder can decrypt. This enables committing the public
 * key to the repo while keeping the private key secret.
 *
 * Format: ENC[base64(sealed_box_ciphertext)]
 */

import sodium from 'sodium-native';
import type { KeyPair } from './types.js';

export const ENC_PREFIX = 'ENC[';
export const ENC_SUFFIX = ']';

/**
 * Generate a new keypair.
 */
export function generateKeyPair(): KeyPair {
  const publicKey = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES);
  const privateKey = Buffer.alloc(sodium.crypto_box_SECRETKEYBYTES);
  sodium.crypto_box_keypair(publicKey, privateKey);
  return { publicKey, privateKey };
}

/**
 * Load a keypair from base64-encoded private key.
 * The public key is derived from the private key.
 */
export function loadKeyPair(base64PrivateKey: string): KeyPair {
  const privateKey = Buffer.from(base64PrivateKey, 'base64');
  if (privateKey.length !== sodium.crypto_box_SECRETKEYBYTES) {
    throw new Error(
      `Invalid private key length: expected ${sodium.crypto_box_SECRETKEYBYTES} bytes, got ${privateKey.length}`
    );
  }
  const publicKey = Buffer.alloc(sodium.crypto_box_PUBLICKEYBYTES);
  sodium.crypto_scalarmult_base(publicKey, privateKey);
  return { publicKey, privateKey };
}

/**
 * Load a public key from base64.
 */
export function loadPublicKey(base64PublicKey: string): Buffer {
  const publicKey = Buffer.from(base64PublicKey, 'base64');
  if (publicKey.length !== sodium.crypto_box_PUBLICKEYBYTES) {
    throw new Error(
      `Invalid public key length: expected ${sodium.crypto_box_PUBLICKEYBYTES} bytes, got ${publicKey.length}`
    );
  }
  return publicKey;
}

/**
 * Decrypt a single encrypted string using sealed box.
 */
export function decryptString(value: string, keyPair: KeyPair): string {
  const base64 = value.slice(ENC_PREFIX.length, -ENC_SUFFIX.length);
  const ciphertext = Buffer.from(base64, 'base64');

  if (ciphertext.length < sodium.crypto_box_SEALBYTES) {
    throw new Error(`Invalid ciphertext: too short (${ciphertext.length} bytes)`);
  }

  const message = Buffer.alloc(ciphertext.length - sodium.crypto_box_SEALBYTES);
  const success = sodium.crypto_box_seal_open(
    message,
    ciphertext,
    keyPair.publicKey,
    keyPair.privateKey
  );

  if (!success) {
    throw new Error('Decryption failed: invalid ciphertext or wrong key');
  }

  return message.toString('utf-8');
}

/**
 * Encrypt a string using sealed box (public key only).
 */
export function encryptString(value: string, publicKey: Buffer): string {
  const message = Buffer.from(value, 'utf-8');
  const ciphertext = Buffer.alloc(message.length + sodium.crypto_box_SEALBYTES);
  sodium.crypto_box_seal(ciphertext, message, publicKey);
  return `${ENC_PREFIX}${ciphertext.toString('base64')}${ENC_SUFFIX}`;
}

/**
 * Recursively find and encrypt all plaintext string values in an object.
 * Returns the processed object and whether any values were encrypted.
 */
export function encryptPlaintext<T>(obj: T, publicKey: Buffer): { result: T; didChange: boolean } {
  let didChange = false;

  function process(value: unknown): unknown {
    if (isPlaintext(value)) {
      didChange = true;
      return encryptString(value, publicKey);
    }
    if (Array.isArray(value)) {
      return value.map(process);
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = process(v);
      }
      return result;
    }
    return value;
  }

  return { result: process(obj) as T, didChange };
}

/**
 * Recursively decrypt all ENC[...] values in an object.
 */
export function decryptObject<T>(obj: T, keyPair: KeyPair): T {
  function decrypt(value: unknown): unknown {
    if (isEncrypted(value)) {
      return decryptString(value, keyPair);
    }

    if (Array.isArray(value)) {
      return value.map(decrypt);
    }

    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = decrypt(v);
      }
      return result;
    }
    return value;
  }

  return decrypt(obj) as T;
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX) && value.endsWith(ENC_SUFFIX);
}

function isPlaintext(value: unknown): value is string {
  return typeof value === 'string' && !value.startsWith(ENC_PREFIX);
}
