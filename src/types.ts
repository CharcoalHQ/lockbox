export interface KeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
}

export interface CreateConfigOptions<T> {
  /** Map of environment name to pre-imported config object. */
  configs: Record<string, T>;
  /** Environments where secrets are not encrypted and decryption is skipped. */
  plaintextEnvironments?: string[];
  /** Environment variable name to read for the current environment. Default: 'NODE_ENV'. */
  envVariable?: string;
  /** Default environment when the env variable is not set. Default: first key in configs. */
  defaultEnvironment?: string;
  /** Base64-encoded private key, or an async resolver that returns one (e.g. from KMS). */
  privateKey?: string | (() => string | Promise<string>);
}

export interface CreateConfigResult<T> {
  config: Readonly<T>;
  environment: string;
}

export interface LockboxConfig {
  /** Path to the environments directory (relative to lockbox.json). */
  dir: string;
  /** The npm package name to use in generated import statements. Default: 'lockbox'. */
  importSource?: string;
  /** Environments where required field validation is skipped. */
  skipRequiredFieldValidation?: string[];
}
