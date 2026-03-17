import { decryptObject, isEncrypted, loadKeyPair } from './crypto.js';
import type { CreateConfigOptions, CreateConfigResult } from './types.js';

/**
 * Load and optionally decrypt a config for the given environment.
 *
 * If a `privateKey` is provided, all `ENC[...]` values are decrypted.
 * If no key is provided and the config contains encrypted values, an
 * error is thrown.
 */
export async function createConfig<T extends object, E extends string>(
  options: CreateConfigOptions<T, E>
): Promise<CreateConfigResult<T, E>> {
  const { configs, environment } = options;

  const validEnvironments = Object.keys(configs);

  if (validEnvironments.length === 0) {
    throw new Error('lockbox: configs must contain at least one environment.');
  }

  if (!validEnvironments.includes(environment)) {
    throw new Error(
      `lockbox: Invalid environment "${environment}". Must be one of: ${validEnvironments.join(', ')}.`
    );
  }

  const rawConfig = configs[environment];

  const base64Key = typeof options.privateKey === 'function'
    ? await options.privateKey()
    : options.privateKey;

  if (base64Key) {
    const config = decryptObject(rawConfig, loadKeyPair(base64Key));
    return { config, environment };
  }

  if (hasEncryptedValues(rawConfig)) {
    throw new Error(
      `lockbox: Config for "${environment}" contains encrypted values but no private key was provided.`
    );
  }

  return { config: rawConfig, environment };
}

function hasEncryptedValues(obj: unknown): boolean {
  if (isEncrypted(obj)) return true;
  if (Array.isArray(obj)) return obj.some(hasEncryptedValues);
  if (obj !== null && typeof obj === 'object') {
    return Object.values(obj).some(hasEncryptedValues);
  }
  return false;
}
