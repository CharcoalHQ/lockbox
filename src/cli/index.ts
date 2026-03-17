#!/usr/bin/env node

import { parseArgs } from 'node:util';

const USAGE = `lockbox — typed configuration with encrypted secrets

Usage:
  lockbox <command> [options]

Commands:
  init        Scaffold a new config directory and generate a keypair
  generate    Encrypt secrets and generate TypeScript config files
  validate    Check that secrets are encrypted and generated files are up-to-date
  keygen      Generate a new encryption keypair
  view        View the decrypted config for an environment

Options:
  --dir <path>     Config directory (overrides lockbox.json)
  --envs <list>    Comma-separated environments (init only)
  --env <name>     Environment to view (view only)
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
    case 'view': {
      const { runView } = await import('./view.js');
      runView(values.dir as string | undefined, values.env as string | undefined);
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
