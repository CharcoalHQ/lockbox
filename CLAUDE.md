# Lockbox

Typed configuration manager with encrypted secrets. Single npm package (`@charcoalhq/lockbox`).

# Common Commands

- Build: `pnpm build`
- Test: `pnpm test`
- Test (watch): `pnpm test:watch`
- Typecheck: `pnpm typecheck`

# Architecture

- `src/cli/` - CLI commands (init, generate, validate, set, keygen, view, credentials)
- `src/crypto.ts` - Encryption/decryption using libsodium sealed boxes
- `src/loader.ts` - Config file loading and environment resolution
- `src/schema_generator.ts` - TypeScript type generation from config
- `src/types.ts` - Core type definitions
- `tests/` - Vitest test files

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
