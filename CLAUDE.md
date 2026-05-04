# Lockbox

Typed configuration manager with encrypted secrets. Single npm package (`@charcoalhq/lockbox`).

# Common Commands

- Build: `pnpm build`
- Test: `pnpm test`
- Test (watch): `pnpm test:watch`
- Typecheck: `pnpm typecheck`

# Architecture

- `src/cli/` - CLI commands (init, generate, validate, set, keygen, view, credentials)
- `src/cli/inheritance.ts` - Config inheritance (`_extends`) resolution and cycle detection
- `src/crypto.ts` - Encryption/decryption using libsodium sealed boxes
- `src/loader.ts` - Config file loading, environment resolution, and runtime overrides
- `src/standard_schema.ts` - StandardSchemaV1 interface for schema validation
- `src/types.ts` - Core type definitions
- `tests/` - Vitest test files

# Key Concepts

- **Config inheritance**: Environments can extend other environments via `_extends` in `clear.json`
- **Sub-environments**: Subdirectories within an environment (e.g. regions, clusters) with their own `clear.json`/`secret.json`
- **Runtime overrides**: `createConfig({ overrides })` deep-merges ad-hoc config after decryption, before validation
- **Merge order**: `default < ancestors < env/clear < env/secret < sub-env/clear < sub-env/secret < overrides`

# Code Style

- ESM modules (`import`/`export`), no CommonJS
- TypeScript strict mode
- Node16 module resolution

# Changesets

When making code changes that affect the public API or fix bugs, **always** create a changeset:

1. Run `pnpm changeset`
2. Select the change type:
   - `patch` for bug fixes and minor internal changes
   - `minor` for new features, new CLI commands
   - `major` for breaking API or config format changes
3. Write a concise summary of what changed and why
4. Commit the generated `.changeset/*.md` file with your code changes

IMPORTANT: Do not bump `version` in package.json manually — changesets handles versioning automatically.

# Workflow

- Run `pnpm typecheck` after making code changes
- Run `pnpm test` to verify nothing is broken
- Prefer running single test files during development: `pnpm vitest run tests/specific.test.ts`
