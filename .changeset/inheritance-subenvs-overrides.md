---
"@charcoalhq/lockbox": minor
---

Add config inheritance, sub-environments, and runtime overrides

- **Config inheritance**: environments can extend others via `_extends` in `clear.json`, with multi-level chain support and cycle detection
- **Sub-environments**: subdirectories within an environment (e.g. regions, clusters) are auto-discovered and get their own `generated.ts`
- **Runtime overrides**: `createConfig()` accepts an `overrides` option for ad-hoc config layering after decryption, before validation
- **CLI**: `--sub-env` flag for `set`, `set-secret`, `view`; `--override` for `view` (repeatable); repeatable `--env`/`--sub-env` for `init`
