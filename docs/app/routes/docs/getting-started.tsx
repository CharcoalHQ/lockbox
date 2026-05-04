import { CodeBlock, InlineCode } from "~/components/code-block";

export function meta() {
  return [{ title: "Getting Started - lockbox" }];
}

export default function GettingStarted() {
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
          <CodeBlock>
            <span className="sh">$</span>{" "}
            <span className="cmd">pnpm add @charcoalhq/lockbox</span>
            {"\n\n"}
            <span className="sh">$</span>{" "}
            <span className="cmd">
              npx lockbox init --dir ./src/config --env test --env production
            </span>
            {"\n\n"}
            <span className="cm">Created config directory: ./src/config</span>
            {"\n"}
            <span className="cm">{"  "}test/clear.json</span>
            {"\n"}
            <span className="cm">{"  "}test/secret.json</span>
            {"\n"}
            <span className="cm">{"  "}production/clear.json</span>
            {"\n"}
            <span className="cm">{"  "}production/secret.json</span>
            {"\n"}
            <span className="cm">{"  "}default.json</span>
            {"\n"}
            <span className="cm">{"  "}lockbox.pub</span>
            {"\n"}
            <span className="cm">{"  "}Private key saved to .lockbox/private-key</span>
          </CodeBlock>
          <p className="text-fg-muted text-sm font-light mt-4">
            This creates the following structure:
          </p>
          <pre className="bg-bg-code border border-border rounded-lg p-5 overflow-x-auto font-mono text-[0.8rem] leading-[1.35] mt-2 whitespace-pre text-fg-muted">
{`src/config/
├── lockbox.pub          `}<span className="text-fg-dim"># public key (committed)</span>{`
├── default.json         `}<span className="text-fg-dim"># base config</span>{`
├── test/
│   ├── clear.json       `}<span className="text-fg-dim"># env overrides</span>{`
│   ├── secret.json      `}<span className="text-fg-dim"># encrypted secrets</span>{`
│   └── generated.ts     `}<span className="text-fg-dim"># auto-generated</span>{`
└── production/
    ├── clear.json
    ├── secret.json
    └── generated.ts`}
          </pre>
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
          <CodeBlock>
            <span className="cm"># Set defaults (shared across all environments)</span>
            {"\n"}
            <span className="sh">$</span>{" "}
            <span className="cmd">npx lockbox set db.host localhost</span>
            {"\n"}
            <span className="sh">$</span>{" "}
            <span className="cmd">npx lockbox set db.port 5432</span>
            {"\n"}
            <span className="sh">$</span>{" "}
            <span className="cmd">npx lockbox set db.password '**REQUIRED**'</span>
            {"\n\n"}
            <span className="cm"># Override per environment</span>
            {"\n"}
            <span className="sh">$</span>{" "}
            <span className="cmd">
              npx lockbox set db.host prod.db.example.com --env production
            </span>
            {"\n\n"}
            <span className="cm"># Set secrets (encrypted on generate)</span>
            {"\n"}
            <span className="sh">$</span>{" "}
            <span className="cmd">
              npx lockbox set-secret db.password hunter2 --env production
            </span>
          </CodeBlock>
          <p className="text-fg-muted text-sm font-light mt-4">
            The <InlineCode>**REQUIRED**</InlineCode> sentinel marks fields that
            must be set in each environment. <InlineCode>lockbox validate</InlineCode>{" "}
            fails if any are left unset.
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
          <CodeBlock filename="src/config.ts">
            <span className="kw">import</span> {"{ z }"}{" "}
            <span className="kw">from</span>{" "}
            <span className="str">&apos;zod&apos;</span>;{"\n"}
            <span className="kw">import</span> {"{ createConfig }"}{" "}
            <span className="kw">from</span>{" "}
            <span className="str">&apos;@charcoalhq/lockbox&apos;</span>;{"\n"}
            <span className="kw">import</span> testConfig{" "}
            <span className="kw">from</span>{" "}
            <span className="str">&apos;./config/test/generated.js&apos;</span>;
            {"\n"}
            <span className="kw">import</span> prodConfig{" "}
            <span className="kw">from</span>{" "}
            <span className="str">
              &apos;./config/production/generated.js&apos;
            </span>
            ;{"\n\n"}
            <span className="kw">const</span>{" "}
            <span className="fn">configSchema</span>{" "}
            <span className="op">=</span> z.<span className="fn">object</span>
            ({"{"}
            {"\n"}
            {"  "}db: z.<span className="fn">object</span>({"{"}
            {"\n"}
            {"    "}host: z.<span className="fn">string</span>(),{"\n"}
            {"    "}port: z.<span className="fn">number</span>().
            <span className="fn">default</span>(
            <span className="num">5432</span>),{"\n"}
            {"    "}password: z.<span className="fn">string</span>(),{"\n"}
            {"  "}
            {"}"})
            {"\n"}
            {"}"});{"\n\n"}
            <span className="kw">export const</span> {"{ config, environment }"}{" "}
            <span className="op">=</span> <span className="kw">await</span>{" "}
            <span className="fn">createConfig</span>({"{"}
            {"\n"}
            {"  "}configs: {"{"} test: testConfig, production: prodConfig{" "}
            {"}"},
            {"\n"}
            {"  "}environment: process.env.
            <span className="pr">NODE_ENV</span> ??{" "}
            <span className="str">&apos;test&apos;</span>,{"\n"}
            {"  "}privateKey: process.env.
            <span className="pr">LOCKBOX_PRIVATE_KEY</span>,{"\n"}
            {"  "}schema: configSchema,{"\n"}
            {"}"});
          </CodeBlock>
          <p className="text-fg-muted text-sm font-light mt-4">
            Validation runs after decryption. On failure you get clear errors
            with exact paths:
          </p>
          <CodeBlock>
            <span className="cm">lockbox: Config validation failed:</span>
            {"\n"}
            <span className="text-error">
              {"  "}✖ db.port: Expected number, received string
            </span>
            {"\n"}
            <span className="text-error">
              {"  "}✖ db.password: Required
            </span>
          </CodeBlock>
        </div>
      </div>
    </div>
  );
}
