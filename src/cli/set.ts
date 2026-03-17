import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runGenerate } from './generate.js';
import { resolveConfig } from './config.js';
import { discoverEnvironments, loadJson } from './utils.js';

/**
 * Set a plaintext config value in clear.json (or default.json when no --env).
 * Auto-runs generate afterward.
 */
export function runSet(
  key: string,
  value: string,
  opts: { dir?: string; env?: string }
): void {
  const { configDir } = resolveConfig(opts.dir ? { dir: opts.dir } : {});
  const parsed = parseValue(value);

  if (!opts.env) {
    const defaultPath = resolve(configDir, 'default.json');
    const defaults = loadJson(defaultPath);
    setNestedValue(defaults, key, parsed);
    writeFileSync(defaultPath, `${JSON.stringify(defaults, null, 2)}\n`);
    console.log(`Set ${key} in default.json`);
  } else {
    const environments = discoverEnvironments(configDir);
    if (!environments.includes(opts.env)) {
      console.error(
        `Unknown environment "${opts.env}". Available: ${environments.join(', ')}`
      );
      process.exit(1);
    }

    const filePath = resolve(configDir, opts.env, 'clear.json');
    const data = loadJson(filePath);
    setNestedValue(data, key, parsed);
    writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`Set ${key} in ${opts.env}/clear.json`);
  }

  runGenerate(opts.dir);
}

/**
 * Set a secret value in secret.json. Requires --env.
 * Auto-runs generate afterward (which encrypts and regenerates).
 */
export function runSetSecret(
  key: string,
  value: string,
  opts: { dir?: string; env: string }
): void {
  const { configDir } = resolveConfig(opts.dir ? { dir: opts.dir } : {});

  const environments = discoverEnvironments(configDir);
  if (!environments.includes(opts.env)) {
    console.error(
      `Unknown environment "${opts.env}". Available: ${environments.join(', ')}`
    );
    process.exit(1);
  }

  const filePath = resolve(configDir, opts.env, 'secret.json');
  const data = loadJson(filePath);
  setNestedValue(data, key, value); // Always store as string — will be encrypted on generate
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Set ${key} in ${opts.env}/secret.json`);

  runGenerate(opts.dir);
}

/** Try JSON parse for numbers/booleans/arrays/objects, fall back to string. */
function parseValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function setNestedValue(
  obj: Record<string, unknown>,
  dotPath: string,
  value: unknown
): void {
  const parts = dotPath.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (
      current[part] === undefined ||
      current[part] === null ||
      typeof current[part] !== 'object' ||
      Array.isArray(current[part])
    ) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}
