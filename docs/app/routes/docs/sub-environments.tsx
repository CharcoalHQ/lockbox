import { Link, useLoaderData } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";
import { MergeTimeline } from "~/components/merge-timeline";
import { highlight } from "~/lib/shiki.server";

export function meta() {
  return [{ title: "Sub-environments - lockbox" }];
}

export async function loader() {
  const [
    tree,
    initCmd,
    addLater,
    prodClear,
    subEnvClear,
    usageCode,
    cliCmds,
  ] = await Promise.all([
    highlight(
      `src/config/
├── default.json
├── lockbox.pub
├── production/
│   ├── clear.json              # base production config
│   ├── secret.json
│   ├── generated.ts            # production (no sub-env)
│   ├── us-west-2/
│   │   ├── clear.json          # region-specific overrides
│   │   ├── secret.json
│   │   └── generated.ts        # production + us-west-2
│   └── eu-central-1/
│       ├── clear.json
│       ├── secret.json
│       └── generated.ts        # production + eu-central-1
└── test/
    ├── clear.json
    ├── secret.json
    └── generated.ts`,
      "yaml"
    ),
    highlight(
      `npx lockbox init --dir ./src/config --env test --env production --sub-env us-west-2 --sub-env eu-central-1`,
      "bash"
    ),
    highlight(
      `mkdir -p src/config/production/ap-southeast-1
echo '{}' > src/config/production/ap-southeast-1/clear.json
echo '{}' > src/config/production/ap-southeast-1/secret.json
npx lockbox set db.host ap-southeast-1.db.example.com --env production --sub-env ap-southeast-1`,
      "bash"
    ),
    highlight(
      `{
  "db": {
    "host": "db.example.com",
    "port": 5432,
    "pool_size": 20
  },
  "cache": {
    "ttl": 3600
  }
}`,
      "json"
    ),
    highlight(
      `{
  "db": {
    "host": "us-west-2.db.example.com"
  }
}
// Result after merge:
// db.host = "us-west-2.db.example.com"
// db.port = 5432    (inherited)
// db.pool_size = 20 (inherited)
// cache.ttl = 3600  (inherited)`,
      "jsonc"
    ),
    highlight(
      `import { createConfig } from '@charcoalhq/lockbox';
import prodUsWest from './config/production/us-west-2/generated.js';
import prodEuCentral from './config/production/eu-central-1/generated.js';
import prodBase from './config/production/generated.js';

// Pick the right config based on your region
const region = process.env.AWS_REGION;

const configs = {
  'production': prodBase,
  'production:us-west-2': prodUsWest,
  'production:eu-central-1': prodEuCentral,
};

const envKey = region ? \`production:\${region}\` : 'production';

export const { config } = await createConfig({
  configs,
  environment: envKey,
  privateKey: process.env.LOCKBOX_PRIVATE_KEY,
  schema: configSchema,
});`,
      "typescript"
    ),
    highlight(
      `lockbox set db.host us-west-2.db.com --env production --sub-env us-west-2
lockbox set-secret db.password s3cret --env production --sub-env us-west-2
lockbox view --env production --sub-env us-west-2`,
      "bash"
    ),
  ]);

  return {
    tree,
    initCmd,
    addLater,
    prodClear,
    subEnvClear,
    usageCode,
    cliCmds,
  };
}

export default function SubEnvironments() {
  const { tree, initCmd, addLater, prodClear, subEnvClear, usageCode, cliCmds } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Sub-environments
      </h1>
      <p className="text-fg-muted text-lg font-light mb-12 leading-relaxed">
        Sub-environments let you add an extra config layer within any
        environment. They&apos;re useful for regions, clusters, tenants, or any
        other dimension where config varies within a single environment.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        How it works
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Any subdirectory within an environment directory that contains a{" "}
        <InlineCode>clear.json</InlineCode> or{" "}
        <InlineCode>secret.json</InlineCode> is automatically treated as a
        sub-environment. Each sub-environment inherits the full parent
        environment config (including any{" "}
        <Link to="/docs/inheritance" className="text-accent hover:underline">
          _extends
        </Link>{" "}
        chain) and applies its own overrides on top.
      </p>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        Each sub-environment gets its own <InlineCode>generated.ts</InlineCode>,
        so you import and use it just like any other config.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Directory structure
      </h2>
      <div className="[&_pre]:leading-[1.35]">
        <CodeBlock html={tree} />
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Merge order
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Sub-environment layers are applied after the parent environment:
      </p>
      <MergeTimeline
        layers={[
          { file: "default.json", desc: "Base defaults" },
          { file: "production/clear.json", desc: "Environment config" },
          { file: "production/secret.json", desc: "Environment secrets" },
          {
            file: "production/us-west-2/clear.json",
            desc: "Sub-env overrides",
            highlight: true,
          },
          {
            file: "production/us-west-2/secret.json",
            desc: "Sub-env secrets",
            highlight: true,
          },
        ]}
      />

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Setting up sub-environments
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        You can scaffold sub-environments during init or add them later.
      </p>
      <h3 className="text-base font-semibold mb-3">During init</h3>
      <CodeBlock html={initCmd} />
      <p className="text-fg-muted text-sm font-light mt-3 mb-6">
        This creates the sub-environment directories with empty{" "}
        <InlineCode>clear.json</InlineCode> and{" "}
        <InlineCode>secret.json</InlineCode> inside each environment.
      </p>

      <h3 className="text-base font-semibold mb-3">Adding later</h3>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Create a new subdirectory inside the environment and add config files.
        Lockbox auto-discovers sub-environments on{" "}
        <InlineCode>generate</InlineCode> and{" "}
        <InlineCode>validate</InlineCode>.
      </p>
      <CodeBlock html={addLater} />

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Example config files
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        The base production config sets shared values. Each sub-environment
        overrides just what differs.
      </p>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <CodeBlock html={prodClear} filename="production/clear.json" />
        <CodeBlock
          html={subEnvClear}
          filename="production/us-west-2/clear.json"
        />
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Using sub-environment configs
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Each sub-environment has its own <InlineCode>generated.ts</InlineCode>.
        Import it like any other config:
      </p>
      <CodeBlock html={usageCode} filename="src/config.ts" />

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        CLI commands
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        All commands that accept <InlineCode>--env</InlineCode> also accept{" "}
        <InlineCode>--sub-env</InlineCode>:
      </p>
      <CodeBlock html={cliCmds} />

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Interaction with inheritance
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Sub-environments work with{" "}
        <Link to="/docs/inheritance" className="text-accent hover:underline">
          config inheritance
        </Link>
        . If staging extends production, a sub-environment within staging
        inherits the full staging config (which already includes production
        values):
      </p>
      <MergeTimeline
        layers={[
          { file: "default.json", desc: "Base defaults" },
          {
            file: "production/clear + secret",
            desc: "Inherited via _extends",
          },
          { file: "staging/clear + secret", desc: "Environment overrides" },
          {
            file: "staging/us-west-2/clear + secret",
            desc: "Sub-env overrides",
            highlight: true,
          },
        ]}
      />
      <p className="text-fg-muted text-sm font-light">
        Note: <InlineCode>_extends</InlineCode> is only supported in top-level
        environments, not in sub-environments.
      </p>
    </div>
  );
}
