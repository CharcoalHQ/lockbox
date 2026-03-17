# lockbox

Typed configuration with encrypted secrets for Node.js/TypeScript applications.

- **Per-environment overrides** — base defaults merged with environment-specific clear and secret values
- **Encrypted secrets** — libsodium sealed-box encryption (X25519 + XSalsa20-Poly1305). Public key committed to repo; private key stays in your secrets manager
- **TypeScript codegen** — auto-generated frozen config objects and inferred schema types
- **Validation hooks** — CLI to verify secrets are encrypted and generated files are fresh (plug into git hooks)

## Quick start

### 1. Install

```bash
pnpm add lockbox
```

### 2. Initialize

```bash
npx lockbox init --dir ./src/config --envs test,production
```

This creates the directory structure, generates a keypair, and prints your private key. **Save the private key securely** — it won't be shown again.

### 3. Add config values

**`src/config/default.json`** — base values merged into every environment:

```json
{
  "server": { "host": "0.0.0.0", "port": 3000 },
  "db": { "host": "localhost", "port": 5432, "password": "**REQUIRED**" }
}
```

**`src/config/production/clear.json`** — non-secret production overrides:

```json
{
  "db": { "host": "prod.db.example.com" }
}
```

**`src/config/production/secret.json`** — secret values (add as plaintext, they'll be encrypted):

```json
{
  "db": { "password": "hunter2" }
}
```

### 4. Generate

```bash
npx lockbox generate
```

This:
- Encrypts any plaintext values in `secret.json` files
- Generates a `generated.ts` per environment (merged + frozen config object)
- Generates `schema.ts` with inferred TypeScript types

### 5. Use in your app

```typescript
import { createConfig } from 'lockbox';
import type { Config } from './config/schema.js';
import testConfig from './config/test/generated.js';
import prodConfig from './config/production/generated.js';

export const { config, environment } = createConfig<Config>({
  configs: { test: testConfig, production: prodConfig },
  plaintextEnvironments: ['test'],
});
```

Access your config with full type safety:

```typescript
import { config } from './config.js';

app.listen(config.server.port, config.server.host);
```

## How it works

### Directory structure

```
src/config/
├── lockbox.pub          # Public key (committed to repo)
├── schema.ts            # Auto-generated TypeScript types
├── default.json         # Base config merged into all environments
├── test/
│   ├── clear.json       # Non-secret overrides
│   ├── secret.json      # Encrypted secret values
│   └── generated.ts     # Auto-generated (do not edit)
└── production/
    ├── clear.json
    ├── secret.json
    └── generated.ts
```

### Merge order

For each environment, configs are deep-merged in this order:

```
default.json < {env}/clear.json < {env}/secret.json
```

Later values override earlier ones. Objects are merged recursively; all other values (arrays, primitives, null) are replaced.

### Encryption

Secrets use **libsodium sealed boxes**:
- Anyone with the **public key** (committed to repo) can encrypt new secrets
- Only the **private key** holder can decrypt (set `CONFIG_SECRETS_PRIVATE_KEY` env var)
- Format: `ENC[base64_ciphertext]`

Add secrets as plaintext to `secret.json` and run `lockbox generate` — they'll be encrypted automatically.

### Schema generation

`lockbox generate` produces a `schema.ts` by analyzing config values across all environments:

- String values become union literals: `'mem' | 'pg'`
- Number values become union literals: `3000 | 8080`
- Boolean values become `true | false`
- Objects are recursed and keys are merged
- Keys present in some environments but not others are marked optional (`?`)
- Encrypted values (`ENC[...]`) and `**REQUIRED**` sentinels become `string`

### Required fields

Use the `**REQUIRED**` sentinel in `default.json` to mark fields that must be set in each environment:

```json
{ "db": { "password": "**REQUIRED**" } }
```

`lockbox validate` will fail if any non-skipped environment still has `**REQUIRED**` values. Configure which environments skip this check in `lockbox.json`:

```json
{ "skipRequiredFieldValidation": ["test"] }
```

## CLI reference

All commands respect `lockbox.json` for defaults. Use `--dir` to override.

### `lockbox init`

Scaffold a new config directory and generate a keypair.

```bash
lockbox init --dir ./src/config --envs test,staging,production
```

### `lockbox generate`

Encrypt plaintext secrets and generate TypeScript files.

```bash
lockbox generate
```

### `lockbox validate`

Check that secrets are encrypted, generated files are up-to-date, and required fields are present.

```bash
lockbox validate
```

Add to your git hooks:

```json
{
  "simple-git-hooks": {
    "pre-commit": "npx lockbox validate",
    "pre-push": "npx lockbox validate"
  }
}
```

### `lockbox keygen`

Generate a new encryption keypair.

```bash
lockbox keygen
```

### `lockbox view`

View the decrypted config for an environment.

```bash
CONFIG_SECRETS_PRIVATE_KEY=... lockbox view --env production
```

## Configuration

### `lockbox.json`

Created by `lockbox init` in your project root:

```json
{
  "dir": "./src/config",
  "importSource": "lockbox",
  "skipRequiredFieldValidation": ["test"]
}
```

| Field | Default | Description |
|---|---|---|
| `dir` | `./config` | Path to the environments directory |
| `importSource` | `lockbox` | Package name used in generated `import` statements |
| `skipRequiredFieldValidation` | `[]` | Environments that skip required field checks |

### `createConfig` options

| Option | Default | Description |
|---|---|---|
| `configs` | (required) | Map of environment name to imported config object |
| `plaintextEnvironments` | `[]` | Environments where decryption is skipped |
| `envVariable` | `'NODE_ENV'` | Environment variable that selects the active environment |
| `defaultEnvironment` | first key in `configs` | Fallback when env variable is not set |
| `privateKeyVariable` | `'CONFIG_SECRETS_PRIVATE_KEY'` | Environment variable containing the base64 private key |

## API

```typescript
import { createConfig, deepFreeze } from 'lockbox';
import type { CreateConfigOptions, CreateConfigResult, LockboxConfig } from 'lockbox';
```

- `createConfig<T>(options)` — load and decrypt config for the current environment
- `deepFreeze<T>(obj)` — recursively freeze an object (used by generated files)

## License

MIT
