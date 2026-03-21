---
"@charcoalhq/lockbox": minor
---

Remove schema generation in favor of schema-first approach

**Breaking:** `schema` is now a required field in `createConfig()`. You must pass a [Standard Schema](https://github.com/standard-schema/standard-schema)-compatible schema (Zod, Valibot, ArkType, etc.) to validate and type your config.

Before:
```ts
import type { Config } from './config/schema.js';

const { config } = await createConfig<Config>({
  configs: { test: testConfig, production: prodConfig },
  environment: 'production',
  privateKey: process.env.MY_PRIVATE_KEY,
});
```

After:
```ts
import { z } from 'zod';

const configSchema = z.object({
  server: z.object({ host: z.string(), port: z.coerce.number() }),
  db: z.object({ host: z.string(), port: z.number(), password: z.string() }),
});

const { config } = await createConfig({
  configs: { test: testConfig, production: prodConfig },
  environment: 'production',
  privateKey: process.env.MY_PRIVATE_KEY,
  schema: configSchema,
});
```

Other changes:
- `lockbox generate` no longer produces `schema.ts` — delete it from your config directory
- `lockbox validate` no longer checks `schema.ts` freshness
- Removed `skipSchemaGeneration` from `lockbox.json` config — you can remove it if present
