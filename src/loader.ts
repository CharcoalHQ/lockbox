import { decryptObject, loadKeyPair } from './crypto.js';
import type { CreateConfigOptions, CreateConfigResult } from './types.js';

/**
 * Load and optionally decrypt a config for the current environment.
 *
 * The environment is determined by reading `process.env[envVariable]`
 * (default: `NODE_ENV`). If the environment is listed in
 * `plaintextEnvironments`, decryption is skipped. Otherwise, the
 * private key is read from `process.env[privateKeyVariable]`
 * (default: `CONFIG_SECRETS_PRIVATE_KEY`) and used to decrypt
 * all `ENC[...]` values.
 */
export function createConfig<T extends object>(
  options: CreateConfigOptions<T>
): CreateConfigResult<T> {
  const {
    configs,
    plaintextEnvironments = [],
    envVariable = 'NODE_ENV',
    privateKeyVariable = 'CONFIG_SECRETS_PRIVATE_KEY',
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

  const secretsPrivateKey = process.env[privateKeyVariable];
  if (!secretsPrivateKey) {
    throw new Error(
      `lockbox: ${privateKeyVariable} is not set. Required to decrypt config for "${env}" environment.`
    );
  }

  const config = decryptObject(encryptedConfig, loadKeyPair(secretsPrivateKey));
  return { config, environment: env };
}
