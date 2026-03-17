import { decryptObject, loadKeyPair } from '../crypto.js';
import { resolveConfig } from './config.js';
import { discoverEnvironments, loadDefaults, loadEnvConfig, mergeConfigs } from './utils.js';

export function runView(dirOverride?: string, envOverride?: string): void {
  const { configDir } = resolveConfig(dirOverride ? { dir: dirOverride } : {});

  const environments = discoverEnvironments(configDir);
  if (environments.length === 0) {
    console.error(`No environments found in ${configDir}.`);
    process.exit(1);
  }

  const env = envOverride ?? process.env.NODE_ENV ?? environments[0];
  if (!environments.includes(env)) {
    console.error(
      `Unknown environment "${env}". Available: ${environments.join(', ')}`
    );
    process.exit(1);
  }

  const defaults = loadDefaults(configDir);
  const envConfig = loadEnvConfig(configDir, env);
  let merged = mergeConfigs(defaults, envConfig.clear, envConfig.secret);

  const privateKey = process.env.CONFIG_SECRETS_PRIVATE_KEY;
  if (privateKey) {
    merged = decryptObject(merged, loadKeyPair(privateKey));
  }

  console.log(JSON.stringify(merged, null, 2));
}
