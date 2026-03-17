import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createTwoFilesPatch } from 'diff';
import { encryptPlaintext } from '../crypto.js';
import { generateSchemaFileContent } from '../schema_generator.js';
import { resolveConfig } from './config.js';
import {
  discoverEnvironments,
  generateConfigFileContent,
  loadDefaults,
  loadEnvConfig,
  loadPublicKeyFromFile,
  mergeConfigs,
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
  const mergedConfigs: Record<string, Record<string, unknown>> = {};

  for (const env of environments) {
    const envConfig = loadEnvConfig(configDir, env);

    // All secrets should be encrypted.
    const { didChange } = encryptPlaintext(envConfig.secret, publicKey);
    if (didChange) {
      console.error(`ERROR: Secrets are not all encrypted in ${env}/secret.json.`);
      hasErrors = true;
    }

    const mergedConfig = mergeConfigs(defaults, envConfig.clear, envConfig.secret);
    mergedConfigs[env] = mergedConfig;

    const expectedContent = generateConfigFileContent(
      mergedConfig,
      config.importSource!
    );

    if (!existsSync(envConfig.generatedPath)) {
      console.error(`ERROR: Missing generated config: ${env}/generated.ts`);
      hasErrors = true;
      continue;
    }

    const actualContent = readFileSync(envConfig.generatedPath, 'utf-8');
    if (actualContent !== expectedContent) {
      console.error(`ERROR: Stale generated config: ${env}/generated.ts`);
      showDiff(actualContent, expectedContent, `${env}/generated.ts`);
      hasErrors = true;
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
  }

  // Validate schema.ts
  const schemaPath = resolve(configDir, 'schema.ts');
  const expectedSchema = generateSchemaFileContent(mergedConfigs);
  if (existsSync(schemaPath)) {
    const actualSchema = readFileSync(schemaPath, 'utf-8');
    if (actualSchema !== expectedSchema) {
      console.error('ERROR: Stale schema.ts');
      showDiff(actualSchema, expectedSchema, 'schema.ts');
      hasErrors = true;
    }
  } else {
    console.error('ERROR: Missing schema.ts');
    hasErrors = true;
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
