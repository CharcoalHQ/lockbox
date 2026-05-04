import { useLoaderData } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";
import { highlight } from "~/lib/shiki.server";

export function meta() {
  return [{ title: "Runtime Overrides - lockbox" }];
}

export async function loader() {
  const [envVarPattern, envFile, overrideFile, inlineExample, cliView, cliStack] =
    await Promise.all([
      highlight(
        `import { readFileSync, existsSync } from 'node:fs';
import { createConfig } from '@charcoalhq/lockbox';
import prodConfig from './config/production/generated.js';

// Load overrides from a file if LOCKBOX_OVERRIDE is set
const overridePath = process.env.LOCKBOX_OVERRIDE;
const overrides = overridePath && existsSync(overridePath)
  ? JSON.parse(readFileSync(overridePath, 'utf-8'))
  : {};

export const { config } = await createConfig({
  configs: { production: prodConfig },
  environment: 'production',
  privateKey: process.env.LOCKBOX_PRIVATE_KEY,
  schema: configSchema,
  overrides,
});`,
        "typescript"
      ),
      highlight(`LOCKBOX_OVERRIDE=./config/local-overrides.json`, "shellsession"),
      highlight(
        `{
  "db": {
    "host": "localhost",
    "port": 5433
  }
}`,
        "json"
      ),
      highlight(
        `const { config } = await createConfig({
  configs: { test: testConfig },
  environment: 'test',
  schema: configSchema,
  overrides: {
    db: { host: 'test-db.local' },
  },
});`,
        "typescript"
      ),
      highlight(
        `$ lockbox view --env production --override ./config/local-overrides.json`,
        "shellsession"
      ),
      highlight(
        `$ lockbox view --env production --override base.json --override debug.json`,
        "shellsession"
      ),
    ]);

  return { envVarPattern, envFile, overrideFile, inlineExample, cliView, cliStack };
}

export default function Overrides() {
  const { envVarPattern, envFile, overrideFile, inlineExample, cliView, cliStack } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Runtime Overrides
      </h1>
      <p className="text-fg-muted text-lg font-light mb-12 leading-relaxed">
        Overrides let you layer ad-hoc config on top of the resolved config at
        runtime. They are never baked into generated files, making them ideal
        for local development and testing.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        In code
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Pass an <InlineCode>overrides</InlineCode> object to{" "}
        <InlineCode>createConfig</InlineCode>. It is deep-merged on top of the
        config after decryption but before schema validation.
      </p>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        A common pattern is to load the override from a file pointed to by an
        environment variable. Each developer can have their own local override
        file (gitignored) without touching the committed config:
      </p>
      <CodeBlock html={envVarPattern} filename="src/config.ts" />
      <p className="text-fg-muted font-light mt-4 mb-4 leading-relaxed">
        Then each developer creates their own override file and sets the env var:
      </p>
      <CodeBlock html={envFile} filename=".env.local (gitignored)" />
      <div className="mt-3 mb-8">
        <CodeBlock html={overrideFile} filename="config/local-overrides.json (gitignored)" />
      </div>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        The override is deep-merged, so only the keys you specify are
        replaced — everything else is inherited. Without the env var set, no
        overrides are applied.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Inline overrides
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        For simple cases like tests, you can pass overrides directly:
      </p>
      <CodeBlock html={inlineExample} />

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Via the CLI
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        The <InlineCode>lockbox view</InlineCode> command accepts{" "}
        <InlineCode>--override</InlineCode> flags to preview the effective
        config with overrides applied:
      </p>
      <CodeBlock html={cliView} />
      <p className="text-fg-muted font-light mt-4 mb-4 leading-relaxed">
        Multiple override files can be stacked. They are applied in order:
      </p>
      <CodeBlock html={cliStack} />

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Merge position
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Overrides are applied last in the merge chain — after defaults,
        inheritance, environment config, sub-environment config, and decryption:
      </p>
      <div className="bg-bg-raised border border-border rounded-lg p-6 mb-8 font-mono text-sm">
        <span className="text-fg-dim">
          default {"→"} ancestors {"→"} env {"→"} sub-env {"→"} decryption{"→"}{" "}
        </span>
        <span className="text-accent font-medium">overrides</span>
        <span className="text-fg-dim"> {"→"} validation</span>
      </div>
      <p className="text-fg-muted font-light leading-relaxed">
        Since overrides are applied before validation, the final config must
        still pass your schema.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Design notes
      </h2>
      <ul className="text-fg-muted font-light space-y-2 list-disc list-inside">
        <li>
          Overrides are <strong className="text-fg">runtime-only</strong> — they
          do not affect <InlineCode>lockbox generate</InlineCode> or{" "}
          <InlineCode>lockbox validate</InlineCode>
        </li>
        <li>
          Override files should not contain <InlineCode>ENC[...]</InlineCode>{" "}
          values — lockbox warns if it detects encrypted values
        </li>
        <li>
          Override files should be{" "}
          <strong className="text-fg">gitignored</strong> — they contain
          developer-specific values
        </li>
        <li>
          For permanent changes, edit <InlineCode>clear.json</InlineCode> or{" "}
          <InlineCode>secret.json</InlineCode> directly
        </li>
      </ul>
    </div>
  );
}
