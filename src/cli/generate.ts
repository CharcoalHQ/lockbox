import { writeFileSync } from 'node:fs';
import { encryptPlaintext } from '../crypto.js';
import { resolveConfig } from './config.js';
import {
  discoverEnvironments,
  generateConfigFileContent,
  loadDefaults,
  loadEnvConfig,
  loadPublicKeyFromFile,
  mergeConfigs,
} from './utils.js';

export function runGenerate(dirOverride?: string): void {
  const { config, configDir } = resolveConfig(
    dirOverride ? { dir: dirOverride } : {}
  );

  const environments = discoverEnvironments(configDir);
  if (environments.length === 0) {
    console.error(`No environments found in ${configDir}. Run \`lockbox init\` first.`);
    process.exit(1);
  }

  const publicKey = loadPublicKeyFromFile(configDir);
  const defaults = loadDefaults(configDir);
  for (const env of environments) {
    const envConfig = loadEnvConfig(configDir, env);
    let envSecret = envConfig.secret;

    // Encrypt any plaintext in env secrets
    const { result, didChange } = encryptPlaintext(envSecret, publicKey);
    if (didChange) {
      envSecret = result as Record<string, unknown>;
      writeFileSync(envConfig.secretPath, `${JSON.stringify(envSecret, null, 2)}\n`);
      console.log(`Encrypted plaintext secrets in: ${env}/secret.json`);
    }

    const mergedConfig = mergeConfigs(defaults, envConfig.clear, envSecret);

    writeFileSync(
      envConfig.generatedPath,
      generateConfigFileContent(mergedConfig, config.importSource!)
    );
    console.log(`Generated: ${env}/generated.ts`);
  }

  console.log('\nConfig generation complete.');
}
