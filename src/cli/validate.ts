import { existsSync, readFileSync } from 'node:fs';
import { createTwoFilesPatch } from 'diff';
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

const REQUIRED_PROPERTY_VALUE = '**REQUIRED**';

export function runValidate(dirOverride?: string): void {
  const { config, configDir } = resolveConfig(
    dirOverride ? { dir: dirOverride } : {}
  );

  const environments = discoverEnvironments(configDir);
  if (environments.length === 0) {
    console.error(`No environments found in ${configDir}.`);
    process.exit(1);
  }

  const publicKey = loadPublicKeyFromFile(configDir);
  const defaults = loadDefaults(configDir);
  const skipRequired = new Set(config.skipRequiredFieldValidation ?? []);
  let hasErrors = false;

  for (const env of environments) {
    const envConfig = loadEnvConfig(configDir, env);

    const { didChange } = encryptPlaintext(envConfig.secret, publicKey);
    if (didChange) {
      console.error(`ERROR: Secrets are not all encrypted in ${env}/secret.json.`);
      hasErrors = true;
    }

    const mergedConfig = resolveFullMerge(configDir, env, defaults, environments);

    const expectedContent = generateConfigFileContent(
      mergedConfig,
      config.importSource!
    );

    if (!existsSync(envConfig.generatedPath)) {
      console.error(`ERROR: Missing generated config: ${env}/generated.ts`);
      hasErrors = true;
    } else {
      const actualContent = readFileSync(envConfig.generatedPath, 'utf-8');
      if (actualContent !== expectedContent) {
        console.error(`ERROR: Stale generated config: ${env}/generated.ts`);
        showDiff(actualContent, expectedContent, `${env}/generated.ts`);
        hasErrors = true;
      }
    }

    if (!skipRequired.has(env)) {
      const missingFields = findMissingRequiredFields(mergedConfig);
      if (missingFields.length > 0) {
        console.error(
          `ERROR: Missing required fields in ${env}: ${missingFields.join(', ')}`
        );
        hasErrors = true;
      }
    }

    // Validate sub-environments
    for (const subEnv of discoverSubEnvironments(configDir, env)) {
      const subEnvConfig = loadSubEnvConfig(configDir, env, subEnv);

      const { didChange: subDidChange } = encryptPlaintext(subEnvConfig.secret, publicKey);
      if (subDidChange) {
        console.error(`ERROR: Secrets are not all encrypted in ${env}/${subEnv}/secret.json.`);
        hasErrors = true;
      }

      if ('_extends' in subEnvConfig.clear) {
        console.error(`ERROR: _extends is not supported in sub-environment configs (found in ${env}/${subEnv}/clear.json).`);
        hasErrors = true;
        continue;
      }

      const subEnvMerged = resolveFullMerge(configDir, env, defaults, environments, subEnv);

      const subExpected = generateConfigFileContent(
        subEnvMerged,
        config.importSource!
      );

      if (!existsSync(subEnvConfig.generatedPath)) {
        console.error(`ERROR: Missing generated config: ${env}/${subEnv}/generated.ts`);
        hasErrors = true;
      } else {
        const subActual = readFileSync(subEnvConfig.generatedPath, 'utf-8');
        if (subActual !== subExpected) {
          console.error(`ERROR: Stale generated config: ${env}/${subEnv}/generated.ts`);
          showDiff(subActual, subExpected, `${env}/${subEnv}/generated.ts`);
          hasErrors = true;
        }
      }

      if (!skipRequired.has(env)) {
        const missingFields = findMissingRequiredFields(subEnvMerged);
        if (missingFields.length > 0) {
          console.error(
            `ERROR: Missing required fields in ${env}/${subEnv}: ${missingFields.join(', ')}`
          );
          hasErrors = true;
        }
      }
    }
  }

  if (hasErrors) {
    console.error('\nConfig validation failed. Run: lockbox generate');
    process.exit(1);
  }

  console.log('Config validation passed.');
}

function findMissingRequiredFields(config: unknown): string[] {
  const missingFields: string[] = [];
  if (typeof config !== 'object' || config === null) {
    return missingFields;
  }

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string' && value === REQUIRED_PROPERTY_VALUE) {
      missingFields.push(key);
    }

    if (typeof value === 'object') {
      missingFields.push(
        ...findMissingRequiredFields(value).map((field) => `${key}.${field}`)
      );
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        missingFields.push(
          ...findMissingRequiredFields(item).map((field) => `${key}[].${field}`)
        );
      }
    }
  }

  return missingFields;
}

function showDiff(actual: string, expected: string, label: string): void {
  const patch = createTwoFilesPatch(
    `${label} (actual)`,
    `${label} (expected)`,
    actual,
    expected
  );
  console.error(patch);
}
