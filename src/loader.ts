import { decryptObject, isEncrypted, loadKeyPair } from './crypto.js';
import type { StandardSchemaV1 } from './standard_schema.js';
import type { CreateConfigOptions, CreateConfigResult } from './types.js';

/**
 * Load and optionally decrypt a config for the given environment.
 *
 * If a `privateKey` is provided, all `ENC[...]` values are decrypted.
 * If no key is provided and the config contains encrypted values, an
 * error is thrown.
 *
 * The config is validated (and potentially transformed) using the
 * provided schema before being returned.
 */
export async function createConfig<
  T extends object,
  E extends string,
  S extends StandardSchemaV1,
>(
  options: CreateConfigOptions<T, E> & { schema: S }
): Promise<CreateConfigResult<StandardSchemaV1.InferOutput<S>, E>> {
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

  let config: unknown;

  if (base64Key) {
    config = decryptObject(rawConfig, loadKeyPair(base64Key));
  } else if (hasEncryptedValues(rawConfig)) {
    throw new Error(
      `lockbox: Config for "${environment}" contains encrypted values but no private key was provided.`
    );
  } else {
    config = rawConfig;
  }

  config = await validateSchema(config, options.schema);

  return { config, environment } as CreateConfigResult<StandardSchemaV1.InferOutput<S>, E>;
}

async function validateSchema(
  config: unknown,
  schema: StandardSchemaV1,
): Promise<unknown> {
  const result = await schema['~standard'].validate(config);

  if (result.issues) {
    const sorted = [...result.issues].sort(
      (a, b) => (a.path?.length ?? 0) - (b.path?.length ?? 0)
    );
    const lines: string[] = [];
    for (const issue of sorted) {
      if (issue.path?.length) {
        lines.push(`✖ ${formatIssuePath(issue.path)}: ${issue.message}`);
      } else {
        lines.push(`✖ ${issue.message}`);
      }
    }
    throw new Error(
      `lockbox: Config validation failed:\n${lines.join('\n')}`
    );
  }

  return result.value;
}

function formatIssuePath(
  path: ReadonlyArray<PropertyKey | StandardSchemaV1.PathSegment>,
): string {
  let result = '';
  for (const segment of path) {
    const key = typeof segment === 'object' && segment !== null && 'key' in segment
      ? segment.key
      : segment;
    if (typeof key === 'number') {
      result += `[${key}]`;
    } else if (typeof key === 'symbol') {
      result += `${result ? '.' : ''}[${JSON.stringify(String(key))}]`;
    } else {
      const str = String(key);
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str)) {
        result += `${result ? '.' : ''}${str}`;
      } else {
        result += `[${JSON.stringify(str)}]`;
      }
    }
  }
  return result;
}

function hasEncryptedValues(obj: unknown): boolean {
  if (isEncrypted(obj)) return true;
  if (Array.isArray(obj)) return obj.some(hasEncryptedValues);
  if (obj !== null && typeof obj === 'object') {
    return Object.values(obj).some(hasEncryptedValues);
  }
  return false;
}
