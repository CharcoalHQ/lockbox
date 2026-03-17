import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const LOCKBOX_DIR = '.lockbox';
const PRIVATE_KEY_FILE = 'private-key';

/**
 * Find the project root by walking up from startDir looking for lockbox.json or .git.
 */
function findProjectRoot(startDir: string): string {
  let dir = startDir;

  while (true) {
    if (existsSync(resolve(dir, 'lockbox.json')) || existsSync(resolve(dir, '.git'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return startDir;
    dir = parent;
  }
}

function getLockboxDir(): string {
  return resolve(findProjectRoot(process.cwd()), LOCKBOX_DIR);
}

/**
 * Read the stored private key, or null if not configured.
 */
export function loadPrivateKey(): string | null {
  const keyPath = resolve(getLockboxDir(), PRIVATE_KEY_FILE);
  if (!existsSync(keyPath)) return null;
  return readFileSync(keyPath, 'utf-8').trim();
}

/**
 * Save a private key to .lockbox/private-key with restricted permissions.
 */
export function savePrivateKey(base64Key: string): string {
  const lockboxDir = getLockboxDir();
  mkdirSync(lockboxDir, { recursive: true });

  const keyPath = resolve(lockboxDir, PRIVATE_KEY_FILE);
  writeFileSync(keyPath, `${base64Key}\n`, { mode: 0o600 });
  chmodSync(keyPath, 0o600);

  ensureGitignored(lockboxDir);

  return keyPath;
}

/**
 * Ensure .lockbox/ is in the nearest .gitignore.
 */
function ensureGitignored(lockboxDir: string): void {
  const projectRoot = dirname(lockboxDir);
  const gitignorePath = resolve(projectRoot, '.gitignore');

  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, 'utf-8');
    if (content.includes('.lockbox')) return;
    writeFileSync(gitignorePath, `${content.trimEnd()}\n.lockbox/\n`);
  } else {
    writeFileSync(gitignorePath, '.lockbox/\n');
  }
}
