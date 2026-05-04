import { Link } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";
import { MergeTimeline } from "~/components/merge-timeline";

export function meta() {
  return [{ title: "Sub-environments - lockbox" }];
}

export default function SubEnvironments() {
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

      {/* Concept */}
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

      {/* Directory structure */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Directory structure
      </h2>
      <pre className="bg-bg-code border border-border rounded-lg p-5 overflow-x-auto font-mono text-[0.8rem] leading-[1.35] whitespace-pre text-fg-muted mb-8">
{`src/config/
├── default.json
├── lockbox.pub
├── production/
│   ├── clear.json              `}<span className="text-fg-dim"># base production config</span>{`
│   ├── secret.json
│   ├── generated.ts            `}<span className="text-fg-dim"># production (no sub-env)</span>{`
│   ├── `}<span className="text-accent">us-west-2/</span>{`
│   │   ├── clear.json          `}<span className="text-fg-dim"># region-specific overrides</span>{`
│   │   ├── secret.json
│   │   └── generated.ts        `}<span className="text-fg-dim"># production + us-west-2</span>{`
│   └── `}<span className="text-accent">eu-central-1/</span>{`
│       ├── clear.json
│       ├── secret.json
│       └── generated.ts        `}<span className="text-fg-dim"># production + eu-central-1</span>{`
└── test/
    ├── clear.json
    ├── secret.json
    └── generated.ts`}
      </pre>

      {/* Merge order */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
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
          { file: "production/us-west-2/clear.json", desc: "Sub-env overrides", highlight: true },
          { file: "production/us-west-2/secret.json", desc: "Sub-env secrets", highlight: true },
        ]}
      />

      {/* Example: Setting up */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Setting up sub-environments
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        You can scaffold sub-environments during init or add them later by
        creating the directories manually.
      </p>
      <h3 className="text-base font-semibold mb-3">During init</h3>
      <CodeBlock>
        <span className="sh">$</span>{" "}
        <span className="cmd">
          npx lockbox init --dir ./src/config --env test --env production --sub-env us-west-2 --sub-env eu-central-1
        </span>
      </CodeBlock>
      <p className="text-fg-muted text-sm font-light mt-3 mb-6">
        This creates the sub-environment directories with empty{" "}
        <InlineCode>clear.json</InlineCode> and{" "}
        <InlineCode>secret.json</InlineCode> inside each environment.
      </p>

      <h3 className="text-base font-semibold mb-3">Adding later</h3>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Create a new subdirectory inside the environment and add{" "}
        <InlineCode>clear.json</InlineCode> and/or{" "}
        <InlineCode>secret.json</InlineCode>. Lockbox auto-discovers
        sub-environments when you run{" "}
        <InlineCode>generate</InlineCode> or{" "}
        <InlineCode>validate</InlineCode>.
      </p>
      <CodeBlock>
        <span className="sh">$</span>{" "}
        <span className="cmd">mkdir -p src/config/production/ap-southeast-1</span>
        {"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">{"echo '{}' > src/config/production/ap-southeast-1/clear.json"}</span>
        {"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">{"echo '{}' > src/config/production/ap-southeast-1/secret.json"}</span>
        {"\n\n"}
        <span className="cm"># Set a value</span>
        {"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">
          npx lockbox set db.host ap-southeast-1.db.example.com --env production --sub-env ap-southeast-1
        </span>
      </CodeBlock>

      {/* Example: Config files */}
      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Example config files
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        The base production config sets shared values. Each sub-environment
        overrides just what differs.
      </p>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <CodeBlock filename="production/clear.json">
          {`{\n`}
          {"  "}<span className="pr">&quot;db&quot;</span>: {`{\n`}
          {"    "}<span className="pr">&quot;host&quot;</span>:{" "}
          <span className="str">&quot;db.example.com&quot;</span>,{"\n"}
          {"    "}<span className="pr">&quot;port&quot;</span>:{" "}
          <span className="num">5432</span>,{"\n"}
          {"    "}<span className="pr">&quot;pool_size&quot;</span>:{" "}
          <span className="num">20</span>{"\n"}
          {"  "}
          {"},\n"}
          {"  "}<span className="pr">&quot;cache&quot;</span>: {`{\n`}
          {"    "}<span className="pr">&quot;ttl&quot;</span>:{" "}
          <span className="num">3600</span>{"\n"}
          {"  "}
          {"}\n}"}
        </CodeBlock>
        <CodeBlock filename="production/us-west-2/clear.json">
          {`{\n`}
          {"  "}<span className="pr">&quot;db&quot;</span>: {`{\n`}
          {"    "}<span className="pr">&quot;host&quot;</span>:{" "}
          <span className="str">&quot;us-west-2.db.example.com&quot;</span>
          {"\n"}
          {"  "}
          {"}\n}"}
          {"\n\n"}
          <span className="cm">{"// Result after merge:"}</span>{"\n"}
          <span className="cm">{"// db.host = \"us-west-2.db.example.com\""}</span>{"\n"}
          <span className="cm">{"// db.port = 5432    (inherited)"}</span>{"\n"}
          <span className="cm">{"// db.pool_size = 20 (inherited)"}</span>{"\n"}
          <span className="cm">{"// cache.ttl = 3600  (inherited)"}</span>
        </CodeBlock>
      </div>

      {/* Example: Using in code */}
      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Using sub-environment configs
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Each sub-environment has its own <InlineCode>generated.ts</InlineCode>{" "}
        that contains the fully resolved config. Import it like any other
        config:
      </p>
      <CodeBlock filename="src/config.ts">
        <span className="kw">import</span> {"{ createConfig }"}{" "}
        <span className="kw">from</span>{" "}
        <span className="str">&apos;@charcoalhq/lockbox&apos;</span>;{"\n"}
        <span className="kw">import</span> prodUsWest{" "}
        <span className="kw">from</span>{" "}
        <span className="str">&apos;./config/production/us-west-2/generated.js&apos;</span>;
        {"\n"}
        <span className="kw">import</span> prodEuCentral{" "}
        <span className="kw">from</span>{" "}
        <span className="str">&apos;./config/production/eu-central-1/generated.js&apos;</span>;
        {"\n"}
        <span className="kw">import</span> prodBase{" "}
        <span className="kw">from</span>{" "}
        <span className="str">&apos;./config/production/generated.js&apos;</span>;
        {"\n\n"}
        <span className="cm">{"// Pick the right config based on your region"}</span>
        {"\n"}
        <span className="kw">const</span> region <span className="op">=</span>{" "}
        process.env.<span className="pr">AWS_REGION</span>;{"\n\n"}
        <span className="kw">const</span> configs <span className="op">=</span>{" "}
        {"{"}
        {"\n"}
        {"  "}<span className="str">&apos;production&apos;</span>: prodBase,
        {"\n"}
        {"  "}<span className="str">&apos;production:us-west-2&apos;</span>: prodUsWest,
        {"\n"}
        {"  "}<span className="str">&apos;production:eu-central-1&apos;</span>: prodEuCentral,
        {"\n"}
        {"}"};{"\n\n"}
        <span className="kw">const</span> envKey <span className="op">=</span>{" "}
        region ? <span className="str">{"`production:${region}`"}</span> :{" "}
        <span className="str">&apos;production&apos;</span>;{"\n\n"}
        <span className="kw">export const</span> {"{ config }"}{" "}
        <span className="op">=</span> <span className="kw">await</span>{" "}
        <span className="fn">createConfig</span>({"{"}
        {"\n"}
        {"  "}configs,{"\n"}
        {"  "}environment: envKey,{"\n"}
        {"  "}privateKey: process.env.<span className="pr">LOCKBOX_PRIVATE_KEY</span>,{"\n"}
        {"  "}schema: configSchema,{"\n"}
        {"}"});
      </CodeBlock>

      {/* CLI */}
      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        CLI commands
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        All commands that accept <InlineCode>--env</InlineCode> also accept{" "}
        <InlineCode>--sub-env</InlineCode>:
      </p>
      <CodeBlock>
        <span className="cm"># Set a value in a sub-environment</span>{"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">lockbox set db.host us-west-2.db.com --env production --sub-env us-west-2</span>
        {"\n\n"}
        <span className="cm"># Set a secret in a sub-environment</span>{"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">lockbox set-secret db.password s3cret --env production --sub-env us-west-2</span>
        {"\n\n"}
        <span className="cm"># View the resolved config for a sub-environment</span>{"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">lockbox view --env production --sub-env us-west-2</span>
      </CodeBlock>

      {/* Interaction with inheritance */}
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
          { file: "production/clear + secret", desc: "Inherited via _extends" },
          { file: "staging/clear + secret", desc: "Environment overrides" },
          { file: "staging/us-west-2/clear + secret", desc: "Sub-env overrides", highlight: true },
        ]}
      />
      <p className="text-fg-muted text-sm font-light">
        Note: <InlineCode>_extends</InlineCode> is only supported in top-level
        environments, not in sub-environments. A sub-environment&apos;s{" "}
        <InlineCode>clear.json</InlineCode> must not contain{" "}
        <InlineCode>_extends</InlineCode>.
      </p>
    </div>
  );
}
