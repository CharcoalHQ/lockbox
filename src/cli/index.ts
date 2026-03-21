#!/usr/bin/env node

import { parseArgs } from 'node:util';

const USAGE = `lockbox — typed configuration with encrypted secrets

Usage:
  lockbox <command> [options]

Commands:
  init        Scaffold a new config directory and generate a keypair
  generate    Encrypt secrets and generate per-environment config files
  validate    Check that secrets are encrypted and generated files are up-to-date
  keygen          Generate a new encryption keypair
  set-private-key Store a private key locally in .lockbox/private-key
  view            View the decrypted config for an environment
  set             Set a plaintext config value (clear.json or default.json)
  set-secret      Set a secret config value (secret.json, encrypted on generate)

Options:
  --dir <path>     Config directory (overrides lockbox.json)
  --envs <list>    Comma-separated environments (init only)
  --env <name>     Target environment (required for view, set-secret)
  --help           Show this help message
  --version        Show version
`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      dir: { type: 'string' },
      envs: { type: 'string' },
      env: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
    strict: false,
  });

  if (values.help || positionals.length === 0) {
    console.log(USAGE);
    process.exit(0);
  }

  if (values.version) {
    // Read version from package.json at runtime
    const { readFileSync } = await import('node:fs');
    const { dirname, resolve } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
    );
    console.log(pkg.version);
    process.exit(0);
  }

  const command = positionals[0];

  switch (command) {
    case 'init': {
      const { runInit } = await import('./init.js');
      const envs = values.envs
        ? (values.envs as string).split(',').map((e) => e.trim())
        : [];
      runInit(values.dir as string ?? './config', envs);
      break;
    }
    case 'generate': {
      const { runGenerate } = await import('./generate.js');
      runGenerate(values.dir as string | undefined);
      break;
    }
    case 'validate': {
      const { runValidate } = await import('./validate.js');
      runValidate(values.dir as string | undefined);
      break;
    }
    case 'keygen': {
      const { runKeygen } = await import('./keygen.js');
      runKeygen();
      break;
    }
    case 'set-private-key': {
      const keyVal = positionals[1];
      if (!keyVal) {
        console.error('Usage: lockbox set-private-key <base64-key>');
        process.exit(1);
      }
      const { savePrivateKey } = await import('./credentials.js');
      const keyPath = savePrivateKey(keyVal);
      console.log(`Private key saved to ${keyPath}`);
      break;
    }
    case 'view': {
      const { runView } = await import('./view.js');
      runView(values.dir as string | undefined, values.env as string | undefined);
      break;
    }
    case 'set': {
      const key = positionals[1];
      const val = positionals[2];
      if (!key || val === undefined) {
        console.error('Usage: lockbox set <key> <value> [--env <name>]');
        process.exit(1);
      }
      const { runSet } = await import('./set.js');
      runSet(key, val, {
        dir: values.dir as string | undefined,
        env: values.env as string | undefined,
      });
      break;
    }
    case 'set-secret': {
      const secretKey = positionals[1];
      const secretVal = positionals[2];
      if (!secretKey || secretVal === undefined) {
        console.error('Usage: lockbox set-secret <key> <value> --env <name>');
        process.exit(1);
      }
      if (!values.env) {
        console.error('set-secret requires --env. Secrets are always environment-specific.');
        process.exit(1);
      }
      const { runSetSecret } = await import('./set.js');
      runSetSecret(secretKey, secretVal, {
        dir: values.dir as string | undefined,
        env: values.env as string,
      });
      break;
    }
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
