import type { StandardSchemaV1 } from './standard_schema.js';

export interface KeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
}

export interface CreateConfigOptions<T, E extends string = string> {
  /** Map of environment name to pre-imported config object. */
  configs: Record<E, T>;
  /** The active environment. Must be a key in `configs`. */
  environment: E;
  /** Base64-encoded private key, or an async resolver that returns one (e.g. from KMS). Required if config contains encrypted values. */
  privateKey?: string | (() => string | Promise<string>);
  /** A StandardSchemaV1-compliant schema (e.g. Zod, Valibot, ArkType) to validate the config against after loading. */
  schema?: StandardSchemaV1;
}

export interface CreateConfigResult<T, E extends string = string> {
  config: Readonly<T>;
  environment: E;
}

export interface LockboxConfig {
  /** Path to the environments directory (relative to lockbox.json). */
  dir: string;
  /** The npm package name to use in generated import statements. Default: 'lockbox'. */
  importSource?: string;
  /** Environments where required field validation is skipped. */
  skipRequiredFieldValidation?: string[];
  /** Skip schema.ts generation (use when providing your own schema via StandardSchemaV1). */
  skipSchemaGeneration?: boolean;
}
