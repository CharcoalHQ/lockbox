import { writeFileSync } from 'node:fs';
import { encryptPlaintext } from '../crypto.js';
import { resolveConfig } from './config.js';
import {
  discoverEnvironments,
  discoverSubEnvironments,
  generateConfigFileContent,
  loadDefaults,
  loadEnvConfig,
  loadPublicKeyFromFile,
  loadSubEnvConfig,
  resolveFullMerge,
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

  // Pass 1: Encrypt all plaintext secrets (environments + sub-environments)
  for (const env of environments) {
    const envConfig = loadEnvConfig(configDir, env);
    const { result, didChange } = encryptPlaintext(envConfig.secret, publicKey);
    if (didChange) {
      writeFileSync(envConfig.secretPath, `${JSON.stringify(result, null, 2)}\n`);
      console.log(`Encrypted plaintext secrets in: ${env}/secret.json`);
    }

    for (const subEnv of discoverSubEnvironments(configDir, env)) {
      const subEnvConfig = loadSubEnvConfig(configDir, env, subEnv);
      const { result: subResult, didChange: subDidChange } =
        encryptPlaintext(subEnvConfig.secret, publicKey);
      if (subDidChange) {
        writeFileSync(subEnvConfig.secretPath, `${JSON.stringify(subResult, null, 2)}\n`);
        console.log(`Encrypted plaintext secrets in: ${env}/${subEnv}/secret.json`);
      }
    }
  }

  // Pass 2: Resolve inheritance, merge, and generate
  for (const env of environments) {
    const mergedConfig = resolveFullMerge(configDir, env, defaults, environments);
    const envConfig = loadEnvConfig(configDir, env);

    writeFileSync(
      envConfig.generatedPath,
      generateConfigFileContent(mergedConfig, config.importSource!)
    );
    console.log(`Generated: ${env}/generated.ts`);

    for (const subEnv of discoverSubEnvironments(configDir, env)) {
      const subEnvConfig = loadSubEnvConfig(configDir, env, subEnv);
      if ('_extends' in subEnvConfig.clear) {
        console.error(
          `ERROR: _extends is not supported in sub-environment configs (found in ${env}/${subEnv}/clear.json).`
        );
        process.exit(1);
      }

      const subEnvMerged = resolveFullMerge(configDir, env, defaults, environments, subEnv);

      writeFileSync(
        subEnvConfig.generatedPath,
        generateConfigFileContent(subEnvMerged, config.importSource!)
      );
      console.log(`Generated: ${env}/${subEnv}/generated.ts`);
    }
  }

  console.log('\nConfig generation complete.');
}
