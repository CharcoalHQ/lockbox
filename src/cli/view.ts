import { decryptObject, isEncrypted, loadKeyPair } from '../crypto.js';
import { resolveConfig } from './config.js';
import { loadPrivateKey } from './credentials.js';
import { discoverEnvironments, loadDefaults, loadEnvConfig, mergeConfigs } from './utils.js';

export function runView(dirOverride?: string, envOverride?: string): void {
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

  const defaults = loadDefaults(configDir);
  const envConfig = loadEnvConfig(configDir, envOverride);
  let merged = mergeConfigs(defaults, envConfig.clear, envConfig.secret);

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
