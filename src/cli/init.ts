import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { generateKeyPair } from '../crypto.js';
import { savePrivateKey } from './credentials.js';

const HOOK_COMMAND = 'npx lockbox validate';
const HOOK_MARKER = '# lockbox:validate';

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

  // Install git hooks
  const hooksInstalled = installGitHooks();

  console.log(`\nCreated config directory: ${dir}`);
  for (const env of envs) {
    console.log(`  ${env}/clear.json`);
    console.log(`  ${env}/secret.json`);
  }
  console.log(`  default.json`);
  console.log(`  lockbox.pub`);

  // Save private key to .lockbox/private-key
  const keyPath = savePrivateKey(privateKey.toString('base64'));

  console.log('\n' + '='.repeat(64));
  console.log('  Private key saved to .lockbox/private-key');
  console.log('='.repeat(64));
  console.log(`\n  Stored at: ${keyPath}`);
  console.log(`  Permissions: 600 (owner read/write only)`);
  console.log(`  .lockbox/ has been added to .gitignore`);
  console.log(`\n  For production, add it as the sole secret in your .env file`);
  console.log(`  or store it in your secrets manager:`);
  console.log(`  ${privateKey.toString('base64')}`);
  console.log('='.repeat(64));

  console.log('\nNext steps:');
  console.log('  1. Add config values to default.json and environment-specific files');
  console.log('  2. Run: lockbox generate');
  if (!hooksInstalled) {
    console.log('  3. Set up git hooks manually to run: npx lockbox validate');
  }
}

function installGitHooks(): boolean {
  const gitDir = findGitDir(process.cwd());
  if (!gitDir) {
    console.log('\nNo .git directory found — skipping git hook installation.');
    return false;
  }

  const hooksDir = resolve(gitDir, 'hooks');
  mkdirSync(hooksDir, { recursive: true });

  let installed = false;
  for (const hookName of ['pre-commit', 'pre-push'] as const) {
    if (installHook(hooksDir, hookName)) {
      installed = true;
    }
  }

  return installed;
}

function installHook(hooksDir: string, hookName: string): boolean {
  const hookPath = resolve(hooksDir, hookName);

  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, 'utf-8');
    if (existing.includes(HOOK_MARKER)) {
      console.log(`Git hook ${hookName} already has lockbox validate — skipping.`);
      return true;
    }

    // Append to existing hook
    const addition = `\n${HOOK_MARKER}\n${HOOK_COMMAND}\n`;
    writeFileSync(hookPath, existing.trimEnd() + '\n' + addition);
    chmodSync(hookPath, 0o755);
    console.log(`Appended lockbox validate to existing ${hookName} hook.`);
    return true;
  }

  // Create new hook
  const content = `#!/bin/sh\n${HOOK_MARKER}\n${HOOK_COMMAND}\n`;
  writeFileSync(hookPath, content);
  chmodSync(hookPath, 0o755);
  console.log(`Installed ${hookName} git hook.`);
  return true;
}

function findGitDir(startDir: string): string | null {
  let dir = startDir;

  while (true) {
    const candidate = resolve(dir, '.git');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
