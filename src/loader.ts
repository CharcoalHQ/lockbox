import { decryptObject, loadKeyPair } from './crypto.js';
import type { CreateConfigOptions, CreateConfigResult } from './types.js';

/**
 * Load and optionally decrypt a config for the current environment.
 *
 * The environment is determined by reading `process.env[envVariable]`
 * (default: `NODE_ENV`). If the environment is listed in
 * `plaintextEnvironments`, decryption is skipped. Otherwise, the
 * private key is resolved from the `privateKey` option and used to
 * decrypt all `ENC[...]` values.
 */
export async function createConfig<T extends object>(
  options: CreateConfigOptions<T>
): Promise<CreateConfigResult<T>> {
  const {
    configs,
    plaintextEnvironments = [],
    envVariable = 'NODE_ENV',
  } = options;

  const validEnvironments = Object.keys(configs);
  const defaultEnvironment = options.defaultEnvironment ?? validEnvironments[0];

  if (validEnvironments.length === 0) {
    throw new Error('lockbox: configs must contain at least one environment.');
  }

  const env = process.env[envVariable] ?? defaultEnvironment;

  if (!validEnvironments.includes(env)) {
    throw new Error(
      `lockbox: Invalid environment "${env}" (from ${envVariable}). Must be one of: ${validEnvironments.join(', ')}.`
    );
  }

  const encryptedConfig = configs[env];

  if (plaintextEnvironments.includes(env)) {
    return { config: encryptedConfig, environment: env };
  }

  const base64Key = typeof options.privateKey === 'function'
    ? await options.privateKey()
    : options.privateKey;

  if (!base64Key) {
    throw new Error(
      `lockbox: No private key provided. Required to decrypt config for "${env}" environment.`
    );
  }

  const config = decryptObject(encryptedConfig, loadKeyPair(base64Key));
  return { config, environment: env };
}
