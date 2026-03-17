import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateKeyPair } from '../crypto.js';

export function runInit(dir: string, envs: string[]): void {
  if (envs.length === 0) {
    console.error('At least one environment is required. Use --envs test,production');
    process.exit(1);
  }

  const configDir = resolve(process.cwd(), dir);

  // Create directory structure
  mkdirSync(configDir, { recursive: true });
  for (const env of envs) {
    mkdirSync(resolve(configDir, env), { recursive: true });
  }

  // Generate keypair
  const { publicKey, privateKey } = generateKeyPair();

  // Write public key
  const pubKeyPath = resolve(configDir, 'lockbox.pub');
  writeFileSync(pubKeyPath, `${publicKey.toString('base64')}\n`);

  // Write default.json
  const defaultPath = resolve(configDir, 'default.json');
  if (!existsSync(defaultPath)) {
    writeFileSync(defaultPath, '{}\n');
  }

  // Write per-env files
  for (const env of envs) {
    const clearPath = resolve(configDir, env, 'clear.json');
    const secretPath = resolve(configDir, env, 'secret.json');

    if (!existsSync(clearPath)) {
      writeFileSync(clearPath, '{}\n');
    }
    if (!existsSync(secretPath)) {
      writeFileSync(secretPath, '{}\n');
    }
  }

  // Write lockbox.json
  const lockboxConfigPath = resolve(process.cwd(), 'lockbox.json');
  if (!existsSync(lockboxConfigPath)) {
    const lockboxConfig = {
      dir,
      importSource: 'lockbox',
      skipRequiredFieldValidation: [] as string[],
    };
    writeFileSync(lockboxConfigPath, `${JSON.stringify(lockboxConfig, null, 2)}\n`);
    console.log('Created lockbox.json');
  }

  console.log(`\nCreated config directory: ${dir}`);
  for (const env of envs) {
    console.log(`  ${env}/clear.json`);
    console.log(`  ${env}/secret.json`);
  }
  console.log(`  default.json`);
  console.log(`  lockbox.pub`);

  console.log('\n' + '='.repeat(64));
  console.log('  IMPORTANT: Save your private key securely!');
  console.log('='.repeat(64));
  console.log(`\n  Private key: ${privateKey.toString('base64')}`);
  console.log(`\n  Set it as an environment variable:`);
  console.log(`  CONFIG_SECRETS_PRIVATE_KEY=${privateKey.toString('base64')}`);
  console.log(`\n  This key is required to decrypt secrets in non-test`);
  console.log(`  environments. Store it securely (e.g., in a secrets manager).`);
  console.log(`  It will NOT be shown again.`);
  console.log('='.repeat(64));

  console.log('\nNext steps:');
  console.log('  1. Add config values to default.json and environment-specific files');
  console.log('  2. Run: lockbox generate');
}
