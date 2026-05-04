import { CodeBlock, InlineCode } from "~/components/code-block";

export function meta() {
  return [{ title: "Runtime Overrides - lockbox" }];
}

export default function Overrides() {
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
        environment variable. This way each developer can have their own local
        override file (gitignored) without touching the committed config:
      </p>
      <CodeBlock filename="src/config.ts">
        <span className="kw">import</span> {"{ readFileSync, existsSync }"}{" "}
        <span className="kw">from</span>{" "}
        <span className="str">&apos;node:fs&apos;</span>;{"\n"}
        <span className="kw">import</span> {"{ createConfig }"}{" "}
        <span className="kw">from</span>{" "}
        <span className="str">&apos;@charcoalhq/lockbox&apos;</span>;{"\n"}
        <span className="kw">import</span> prodConfig{" "}
        <span className="kw">from</span>{" "}
        <span className="str">&apos;./config/production/generated.js&apos;</span>;{"\n\n"}
        <span className="cm">{"// Load overrides from a file if LOCKBOX_OVERRIDE is set"}</span>{"\n"}
        <span className="kw">const</span> overridePath <span className="op">=</span>{" "}
        process.env.<span className="pr">LOCKBOX_OVERRIDE</span>;{"\n"}
        <span className="kw">const</span> overrides <span className="op">=</span>{" "}
        overridePath <span className="op">&&</span> <span className="fn">existsSync</span>(overridePath){"\n"}
        {"  "}? JSON.<span className="fn">parse</span>(<span className="fn">readFileSync</span>(overridePath, <span className="str">&apos;utf-8&apos;</span>)){"\n"}
        {"  "}: {"{}"};{"\n\n"}
        <span className="kw">export const</span> {"{ config }"}{" "}
        <span className="op">=</span> <span className="kw">await</span>{" "}
        <span className="fn">createConfig</span>({"{"}
        {"\n"}
        {"  "}configs: {"{"} production: prodConfig {"}"},
        {"\n"}
        {"  "}environment: <span className="str">&apos;production&apos;</span>,
        {"\n"}
        {"  "}privateKey: process.env.<span className="pr">LOCKBOX_PRIVATE_KEY</span>,
        {"\n"}
        {"  "}schema: configSchema,{"\n"}
        {"  "}overrides,{"\n"}
        {"}"});
      </CodeBlock>
      <p className="text-fg-muted font-light mt-4 mb-4 leading-relaxed">
        Then each developer creates their own override file and sets the env var:
      </p>
      <CodeBlock filename=".env.local (gitignored)">
        <span className="pr">LOCKBOX_OVERRIDE</span><span className="op">=</span><span className="str">./config/local-overrides.json</span>
      </CodeBlock>
      <div className="mt-3 mb-8">
        <CodeBlock filename="config/local-overrides.json (gitignored)">
          {`{\n`}
          {"  "}<span className="pr">&quot;db&quot;</span>: {`{\n`}
          {"    "}<span className="pr">&quot;host&quot;</span>:{" "}
          <span className="str">&quot;localhost&quot;</span>,{"\n"}
          {"    "}<span className="pr">&quot;port&quot;</span>:{" "}
          <span className="num">5433</span>{"\n"}
          {"  "}
          {"}\n}"}
        </CodeBlock>
      </div>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        The override is deep-merged, so only the keys you specify are
        replaced — everything else is inherited from the generated config.
        Without the env var set, no overrides are applied and the production
        config is used as-is.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Inline overrides
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        For simple cases like tests, you can pass overrides directly:
      </p>
      <CodeBlock>
        <span className="kw">const</span> {"{ config }"}{" "}
        <span className="op">=</span> <span className="kw">await</span>{" "}
        <span className="fn">createConfig</span>({"{"}
        {"\n"}
        {"  "}configs: {"{"} test: testConfig {"}"},
        {"\n"}
        {"  "}environment: <span className="str">&apos;test&apos;</span>,
        {"\n"}
        {"  "}schema: configSchema,{"\n"}
        {"  "}<span className="pr">overrides</span>: {"{"}
        {"\n"}
        {"    "}db: {"{"} host: <span className="str">&apos;test-db.local&apos;</span> {"}"},
        {"\n"}
        {"  "}
        {"},\n"}
        {"}"});
      </CodeBlock>

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Via the CLI
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        The <InlineCode>lockbox view</InlineCode> command accepts{" "}
        <InlineCode>--override</InlineCode> flags to preview the effective
        config with overrides applied. This is useful for debugging what a
        developer would see with their local overrides:
      </p>
      <CodeBlock>
        <span className="sh">$</span>{" "}
        <span className="cmd">lockbox view --env production --override ./config/local-overrides.json</span>
        {"\n\n"}
        <span className="cm">{"// Shows the full production config with local overrides applied"}</span>
      </CodeBlock>
      <p className="text-fg-muted font-light mt-4 mb-8 leading-relaxed">
        Multiple override files can be stacked. They are applied in order, each
        deep-merged on top of the previous result:
      </p>
      <CodeBlock>
        <span className="sh">$</span>{" "}
        <span className="cmd">lockbox view --env production --override base.json --override debug.json</span>
      </CodeBlock>

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Merge position
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Overrides are applied last in the merge chain — after defaults,
        inheritance, environment config, sub-environment config, and decryption:
      </p>
      <div className="bg-bg-raised border border-border rounded-lg p-6 mb-8 font-mono text-sm">
        <span className="text-fg-dim">default {"→"} ancestors {"→"} env {"→"} sub-env {"→"} decryption {"→"}{" "}</span>
        <span className="text-accent font-medium">overrides</span>
        <span className="text-fg-dim"> {"→"} validation</span>
      </div>
      <p className="text-fg-muted font-light leading-relaxed">
        Since overrides are applied before validation, the final config
        (including overrides) must still pass your schema. This prevents
        accidentally introducing invalid config through overrides.
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
          Override files should not contain{" "}
          <InlineCode>ENC[...]</InlineCode> values — lockbox warns if it detects
          encrypted values in an override file
        </li>
        <li>
          Override files should be <strong className="text-fg">gitignored</strong>{" "}
          — they contain developer-specific values that shouldn&apos;t be committed
        </li>
        <li>
          For permanent per-environment changes, edit the{" "}
          <InlineCode>clear.json</InlineCode> or{" "}
          <InlineCode>secret.json</InlineCode> files directly
        </li>
      </ul>
    </div>
  );
}
