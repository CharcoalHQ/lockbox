import { useLoaderData } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";
import { highlight } from "~/lib/shiki.server";

export function meta() {
  return [{ title: "Getting Started - lockbox" }];
}

export async function loader() {
  const [initCmd, setValues, appCode, errorOutput, tree] = await Promise.all([
    highlight(
      `$ npx lockbox init --dir ./src/config --env test --env production

Created config directory: ./src/config
  test/clear.json
  test/secret.json
  production/clear.json
  production/secret.json
  default.json
  lockbox.pub
  Private key saved to .lockbox/private-key`,
      "bash"
    ),
    highlight(
      `# Set defaults (shared across all environments)
$ npx lockbox set db.host localhost
$ npx lockbox set db.port 5432
$ npx lockbox set db.password '**REQUIRED**'

# Override per environment
$ npx lockbox set db.host prod.db.example.com --env production

# Set secrets (encrypted on generate)
$ npx lockbox set-secret db.password hunter2 --env production`,
      "bash"
    ),
    highlight(
      `import { z } from 'zod';
import { createConfig } from '@charcoalhq/lockbox';
import testConfig from './config/test/generated.js';
import prodConfig from './config/production/generated.js';

const configSchema = z.object({
  db: z.object({
    host: z.string(),
    port: z.number().default(5432),
    password: z.string(),
  }),
});

export const { config, environment } = await createConfig({
  configs: { test: testConfig, production: prodConfig },
  environment: process.env.NODE_ENV ?? 'test',
  privateKey: process.env.LOCKBOX_PRIVATE_KEY,
  schema: configSchema,
});`,
      "typescript"
    ),
    highlight(
      `lockbox: Config validation failed:
  ✖ db.port: Expected number, received string
  ✖ db.password: Required`,
      "bash"
    ),
    highlight(
      `src/config/
├── lockbox.pub          # public key (committed)
├── default.json         # base config
├── test/
│   ├── clear.json       # env overrides
│   ├── secret.json      # encrypted secrets
│   └── generated.ts     # auto-generated
└── production/
    ├── clear.json
    ├── secret.json
    └── generated.ts`,
      "bash"
    ),
  ]);

  return { initCmd, setValues, appCode, errorOutput, tree };
}

export default function GettingStarted() {
  const { initCmd, setValues, appCode, errorOutput, tree } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Getting Started
      </h1>
      <p className="text-fg-muted text-lg font-light mb-12 leading-relaxed">
        Get lockbox up and running in your project in three steps: initialize,
        add values, and load config in your app.
      </p>

      {/* Step 1 */}
      <div className="flex gap-5 mb-12">
        <div className="w-10 h-10 rounded-lg bg-accent-glow border border-accent-dim flex items-center justify-center text-accent font-bold text-sm shrink-0">
          1
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold mb-2">Install & initialize</h2>
          <p className="text-fg-muted font-light mb-4">
            Install lockbox as a dependency, then run{" "}
            <InlineCode>init</InlineCode> to scaffold the config directory,
            generate a keypair, and install git hooks.
          </p>
          <CodeBlock html={initCmd} />
          <p className="text-fg-muted text-sm font-light mt-4">
            This creates the following structure:
          </p>
          <div className="mt-2 [&_pre]:leading-[1.35]">
            <CodeBlock html={tree} />
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex gap-5 mb-12">
        <div className="w-10 h-10 rounded-lg bg-accent-glow border border-accent-dim flex items-center justify-center text-accent font-bold text-sm shrink-0">
          2
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold mb-2">Add config values</h2>
          <p className="text-fg-muted font-light mb-4">
            Use the CLI to set values. It writes the JSON and regenerates
            TypeScript files automatically. You can also edit the JSON files
            directly.
          </p>
          <CodeBlock html={setValues} />
          <p className="text-fg-muted text-sm font-light mt-4">
            The <InlineCode>**REQUIRED**</InlineCode> sentinel marks fields that
            must be set in each environment.{" "}
            <InlineCode>lockbox validate</InlineCode> fails if any are left
            unset.
          </p>
        </div>
      </div>

      {/* Step 3 */}
      <div className="flex gap-5 mb-12">
        <div className="w-10 h-10 rounded-lg bg-accent-glow border border-accent-dim flex items-center justify-center text-accent font-bold text-sm shrink-0">
          3
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold mb-2">Use in your app</h2>
          <p className="text-fg-muted font-light mb-4">
            Import the generated config, define a schema with any Standard
            Schema library, and call <InlineCode>createConfig</InlineCode>.
            Secrets are decrypted at runtime and the config is fully typed.
          </p>
          <CodeBlock html={appCode} filename="src/config.ts" />
          <p className="text-fg-muted text-sm font-light mt-4">
            Validation runs after decryption. On failure you get clear errors
            with exact paths:
          </p>
          <div className="mt-2">
            <CodeBlock html={errorOutput} />
          </div>
        </div>
      </div>
    </div>
  );
}
