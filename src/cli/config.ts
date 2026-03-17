import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { LockboxConfig } from '../types.js';

const CONFIG_FILENAME = 'lockbox.json';

const DEFAULTS: LockboxConfig = {
  dir: './config',
  importSource: '@charcoalhq/lockbox',
  skipRequiredFieldValidation: [],
};

/**
 * Resolve the lockbox configuration by searching upward from cwd for
 * lockbox.json, then merging with any CLI flag overrides.
 */
export function resolveConfig(overrides: Partial<LockboxConfig> = {}): {
  config: Required<LockboxConfig>;
  configDir: string;
  configFilePath: string | null;
} {
  const { config: fileConfig, filePath } = findConfigFile(process.cwd());

  const merged: Required<LockboxConfig> = {
    dir: overrides.dir ?? fileConfig?.dir ?? DEFAULTS.dir!,
    importSource: overrides.importSource ?? fileConfig?.importSource ?? DEFAULTS.importSource!,
    skipRequiredFieldValidation:
      overrides.skipRequiredFieldValidation ??
      fileConfig?.skipRequiredFieldValidation ??
      DEFAULTS.skipRequiredFieldValidation!,
  };

  // Resolve dir relative to the config file location (or cwd if no file)
  const baseDir = filePath ? dirname(filePath) : process.cwd();
  const configDir = resolve(baseDir, merged.dir);

  return { config: merged, configDir, configFilePath: filePath };
}

function findConfigFile(startDir: string): {
  config: LockboxConfig | null;
  filePath: string | null;
} {
  let dir = startDir;

  while (true) {
    const candidate = resolve(dir, CONFIG_FILENAME);
    if (existsSync(candidate)) {
      const content = JSON.parse(readFileSync(candidate, 'utf-8')) as LockboxConfig;
      return { config: content, filePath: candidate };
    }

    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return { config: null, filePath: null };
}
