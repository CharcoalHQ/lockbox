# lockbox

The last config and secrets manager your TypeScript app needs.

Define your config in JSON. Secrets get encrypted automatically. Everything is merged per-environment, typed end-to-end, and validated on every commit. No more `.env` juggling, no more runtime surprises.

- **Per-environment overrides** — base defaults deep-merged with environment-specific config and secrets
- **Encrypted secrets** — libsodium sealed boxes. Public key lives in your repo, private key stays in your secrets manager
- **Full type safety** — TypeScript types and frozen config objects are generated from your actual values
- **Git hooks** — validates that secrets are encrypted and generated files are fresh before you push

## Quick start

### 1. Install

```bash
pnpm add @charcoalhq/lockbox
```

### 2. Initialize

```bash
npx lockbox init --dir ./src/config --envs test,production
```

This creates the directory structure, generates a keypair, and prints your private key. **Save the private key securely** — it won't be shown again.

### 3. Add config values

Use the CLI to set values — it writes the JSON and regenerates TypeScript files automatically:

```bash
# Set defaults (shared across all environments)
npx lockbox set server.host 0.0.0.0
npx lockbox set server.port 3000
npx lockbox set db.host localhost
npx lockbox set db.port 5432
npx lockbox set db.password '**REQUIRED**'

# Override per environment
npx lockbox set db.host prod.db.example.com --env production

# Set secrets (encrypted automatically)
npx lockbox set-secret db.password hunter2 --env production
```

Or edit the JSON files directly if you prefer:

<details>
<summary>Manual JSON editing</summary>

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

Then run `npx lockbox generate` to encrypt secrets and generate TypeScript files.

</details>

### 5. Use in your app

```typescript
import { createConfig } from '@charcoalhq/lockbox';
import type { Config } from './config/schema.js';
import testConfig from './config/test/generated.js';
import prodConfig from './config/production/generated.js';

export const { config, environment } = await createConfig<Config>({
  configs: { test: testConfig, production: prodConfig },
  environment: process.env.NODE_ENV ?? 'test',
  privateKey: process.env.MY_PRIVATE_KEY,
});
```

Access your config with full type safety:

```typescript
import { config } from './config.js';

app.listen(config.server.port, config.server.host);
```

### 6. Optional: schema validation

You can pass any [Standard Schema](https://github.com/standard-schema/standard-schema)-compatible schema (Zod, Valibot, ArkType, etc.) to validate and transform your config at load time:

```typescript
import { z } from 'zod';
import { createConfig } from '@charcoalhq/lockbox';
import testConfig from './config/test/generated.js';
import prodConfig from './config/production/generated.js';

const configSchema = z.object({
  server: z.object({
    host: z.string(),
    port: z.coerce.number(),
  }),
  db: z.object({
    host: z.string(),
    port: z.number().default(5432),
    password: z.string(),
  }),
});

export const { config } = await createConfig({
  configs: { test: testConfig, production: prodConfig },
  environment: process.env.NODE_ENV ?? 'test',
  privateKey: process.env.MY_PRIVATE_KEY,
  schema: configSchema,
});
// config is fully typed as z.infer<typeof configSchema>
```

Validation runs after decryption, so your schema sees the final plaintext values. On failure, you get a clear error:

```
lockbox: Config validation failed:
  - server.port: Expected number, received string
  - db.password: Required
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
- Only the **private key** holder can decrypt
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

### `lockbox set`

Set a plaintext config value. Supports dot-notation for nested keys. Auto-runs `generate`.

```bash
lockbox set server.port 8080 --env production
lockbox set db.host localhost                    # writes to default.json
```

### `lockbox set-secret`

Set a secret value. Requires `--env`. Auto-runs `generate` (which encrypts and regenerates).

```bash
lockbox set-secret db.password s3cret --env production
```

### `lockbox keygen`

Generate a new encryption keypair.

```bash
lockbox keygen
```

### `lockbox set-private-key`

Store a private key locally for CLI operations (saved to `.lockbox/private-key` with `600` permissions, auto-added to `.gitignore`).

```bash
lockbox set-private-key <base64-key>
```

### `lockbox view`

View the full decrypted config for an environment. Requires `--env`. Reads the private key from `.lockbox/private-key`.

```bash
lockbox view --env production
```

## Configuration

### `lockbox.json`

Created by `lockbox init` in your project root:

```json
{
  "dir": "./src/config",
  "importSource": "@charcoalhq/lockbox",
  "skipRequiredFieldValidation": ["test"]
}
```

| Field | Default | Description |
|---|---|---|
| `dir` | `./config` | Path to the environments directory |
| `importSource` | `@charcoalhq/lockbox` | Package name used in generated `import` statements |
| `skipRequiredFieldValidation` | `[]` | Environments that skip required field checks |

### `createConfig` options

| Option | Default | Description |
|---|---|---|
| `configs` | (required) | Map of environment name to imported config object |
| `environment` | (required) | The active environment. Must be a key in `configs` |
| `privateKey` | — | Base64 private key, or `() => string \| Promise<string>` resolver (e.g. from KMS). Required if config contains encrypted values |
| `schema` | — | A [Standard Schema](https://github.com/standard-schema/standard-schema)-compliant schema to validate (and optionally transform) the config after loading |

## API

```typescript
import { createConfig, deepFreeze } from '@charcoalhq/lockbox';
import type { CreateConfigOptions, CreateConfigResult, LockboxConfig } from '@charcoalhq/lockbox';
```

- `createConfig<T>(options)` — load and decrypt config for the current environment
- `deepFreeze<T>(obj)` — recursively freeze an object (used by generated files)

## License

MIT
