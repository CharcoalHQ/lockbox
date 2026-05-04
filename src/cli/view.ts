import { decryptObject, isEncrypted, loadKeyPair } from '../crypto.js';
import { deepMerge } from '../deep_merge.js';
import { resolveConfig } from './config.js';
import { loadPrivateKey } from './credentials.js';
import {
  discoverEnvironments,
  discoverSubEnvironments,
  loadDefaults,
  loadOverrides,
  resolveFullMerge,
} from './utils.js';

export function runView(
  dirOverride?: string,
  envOverride?: string,
  subEnvOverride?: string,
  overridePaths?: string[]
): void {
  const { configDir } = resolveConfig(dirOverride ? { dir: dirOverride } : {});

  const environments = discoverEnvironments(configDir);
  if (environments.length === 0) {
    console.error(`No environments found in ${configDir}.`);
    process.exit(1);
  }

  if (!envOverride) {
    console.error(
      `--env is required. Available environments: ${environments.join(', ')}`
    );
    process.exit(1);
  }

  if (!environments.includes(envOverride)) {
    console.error(
      `Unknown environment "${envOverride}". Available: ${environments.join(', ')}`
    );
    process.exit(1);
  }

  if (subEnvOverride) {
    const subEnvs = discoverSubEnvironments(configDir, envOverride);
    if (!subEnvs.includes(subEnvOverride)) {
      console.error(
        `Unknown sub-environment "${subEnvOverride}" for environment "${envOverride}". ` +
        (subEnvs.length > 0
          ? `Available: ${subEnvs.join(', ')}`
          : `No sub-environments found for ${envOverride}.`)
      );
      process.exit(1);
    }
  }

  const defaults = loadDefaults(configDir);
  let merged = resolveFullMerge(configDir, envOverride, defaults, environments, subEnvOverride);

  if (overridePaths && overridePaths.length > 0) {
    const overrides = loadOverrides(process.cwd(), overridePaths);
    for (const override of overrides) {
      merged = deepMerge(merged, override);
    }
  }

  const privateKey = loadPrivateKey();
  if (privateKey) {
    merged = decryptObject(merged, loadKeyPair(privateKey));
  } else if (hasEncryptedValues(merged)) {
    console.error(
      'ERROR: Config contains encrypted secrets but no private key is configured.\n' +
      'Run `lockbox set-private-key <key>` to store your private key.'
    );
    process.exit(1);
  }

  console.log(JSON.stringify(merged, null, 2));
}

function hasEncryptedValues(obj: unknown): boolean {
  if (isEncrypted(obj)) return true;
  if (Array.isArray(obj)) return obj.some(hasEncryptedValues);
  if (obj !== null && typeof obj === 'object') {
    return Object.values(obj).some(hasEncryptedValues);
  }
  return false;
}
