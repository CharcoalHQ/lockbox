# @charcoalhq/lockbox

## 0.3.0

### Minor Changes

- [`7fbeb12`](https://github.com/CharcoalHQ/lockbox/commit/7fbeb126c0fd98e82a5d86d35352a9fe30a7b395) Thanks [@hugodelahousse](https://github.com/hugodelahousse)! - Add config inheritance, sub-environments, and runtime overrides

  - **Config inheritance**: environments can extend others via `_extends` in `clear.json`, with multi-level chain support and cycle detection
  - **Sub-environments**: subdirectories within an environment (e.g. regions, clusters) are auto-discovered and get their own `generated.ts`
  - **Runtime overrides**: `createConfig()` accepts an `overrides` option for ad-hoc config layering after decryption, before validation
  - **CLI**: `--sub-env` flag for `set`, `set-secret`, `view`; `--override` for `view` (repeatable); repeatable `--env`/`--sub-env` for `init`

## 0.2.0

### Minor Changes

- [#2](https://github.com/CharcoalHQ/lockbox/pull/2) [`957fe12`](https://github.com/CharcoalHQ/lockbox/commit/957fe1241e94cf7365089ac5f9aa814fca128cd0) Thanks [@hugodelahousse](https://github.com/hugodelahousse)! - Remove schema generation in favor of schema-first approach

  **Breaking:** `schema` is now a required field in `createConfig()`. You must pass a [Standard Schema](https://github.com/standard-schema/standard-schema)-compatible schema (Zod, Valibot, ArkType, etc.) to validate and type your config.

  Before:

  ```ts
  import type { Config } from "./config/schema.js";

  const { config } = await createConfig<Config>({
    configs: { test: testConfig, production: prodConfig },
    environment: "production",
    privateKey: process.env.MY_PRIVATE_KEY,
  });
  ```

  After:

  ```ts
  import { z } from "zod";

  const configSchema = z.object({
    server: z.object({ host: z.string(), port: z.coerce.number() }),
    db: z.object({ host: z.string(), port: z.number(), password: z.string() }),
  });

  const { config } = await createConfig({
    configs: { test: testConfig, production: prodConfig },
    environment: "production",
    privateKey: process.env.MY_PRIVATE_KEY,
    schema: configSchema,
  });
  ```

  Other changes:

  - `lockbox generate` no longer produces `schema.ts` — delete it from your config directory
  - `lockbox validate` no longer checks `schema.ts` freshness
  - Removed `skipSchemaGeneration` from `lockbox.json` config — you can remove it if present
