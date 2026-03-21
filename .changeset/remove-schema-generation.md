---
"@charcoalhq/lockbox": major
---

Remove schema generation in favor of schema-first approach

- Removed `lockbox generate` schema.ts output and `lockbox validate` schema.ts checks
- Removed `skipSchemaGeneration` config option
- Made `schema` a required field in `createConfig()` — pass any StandardSchemaV1-compatible schema (Zod, Valibot, ArkType, etc.)
- Deleted `src/schema_generator.ts`
