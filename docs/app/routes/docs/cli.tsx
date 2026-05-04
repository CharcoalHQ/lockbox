import { CodeBlock, InlineCode } from "~/components/code-block";

export function meta() {
  return [{ title: "CLI Reference - lockbox" }];
}

function Command({
  name,
  desc,
  flags,
  examples,
}: {
  name: string;
  desc: string;
  flags?: { flag: string; desc: string }[];
  examples?: { cmd: string; comment?: string }[];
}) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-2 pb-3 border-b border-border font-mono">
        {name}
      </h2>
      <p className="text-fg-muted font-light mb-4">{desc}</p>
      {flags && flags.length > 0 && (
        <pre className="bg-bg-code border border-border rounded-lg p-5 overflow-x-auto font-mono text-[0.8rem] leading-[1.9] mb-4">
          <code>
            <span className="text-fg-dim">Usage: </span>
            <span className="text-fg">{name}</span>
            <span className="text-fg-dim"> [options]</span>
            {"\n\n"}
            <span className="text-fg-dim">Options:</span>
            {flags.map((f) => (
              <span key={f.flag}>
                {"\n"}
                {"  "}
                <span className="text-accent">{f.flag.padEnd(22)}</span>
                <span className="text-fg-muted">{f.desc}</span>
              </span>
            ))}
          </code>
        </pre>
      )}
      {examples && examples.length > 0 && (
        <CodeBlock>
          {examples.map((ex, i) => (
            <span key={ex.cmd}>
              {i > 0 && "\n"}
              {ex.comment && (
                <>
                  <span className="cm"># {ex.comment}</span>
                  {"\n"}
                </>
              )}
              <span className="sh">$</span>{" "}
              <span className="cmd">{ex.cmd}</span>
            </span>
          ))}
        </CodeBlock>
      )}
    </div>
  );
}

export default function CLI() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">CLI Reference</h1>
      <p className="text-fg-muted text-lg font-light mb-12 leading-relaxed">
        All commands respect <InlineCode>lockbox.json</InlineCode> for defaults.
        Use <InlineCode>--dir</InlineCode> to override the config directory.
      </p>

      <Command
        name="lockbox init"
        desc="Scaffold a new config directory, generate a keypair, and install git hooks."
        flags={[
          { flag: "--dir <path>", desc: "Config directory (default: ./config)" },
          { flag: "--env <name>", desc: "Environment to create (repeatable)" },
          { flag: "--sub-env <name>", desc: "Sub-environment to create in each env (repeatable)" },
        ]}
        examples={[
          { cmd: "lockbox init --dir ./src/config --env test --env production" },
          { cmd: "lockbox init --env test --env production --sub-env us-west-2 --sub-env eu-central-1", comment: "With sub-environments" },
        ]}
      />

      <Command
        name="lockbox generate"
        desc="Encrypt plaintext secrets and generate per-environment TypeScript config files, including all sub-environments."
        flags={[
          { flag: "--dir <path>", desc: "Config directory override" },
        ]}
      />

      <Command
        name="lockbox validate"
        desc="Check that all secrets are encrypted, generated files are up-to-date, and required fields are present."
        flags={[
          { flag: "--dir <path>", desc: "Config directory override" },
        ]}
      />

      <Command
        name="lockbox set"
        desc="Set a plaintext config value. Supports dot-notation for nested keys. Auto-runs generate."
        flags={[
          { flag: "--env <name>", desc: "Target environment (writes to default.json if omitted)" },
          { flag: "--sub-env <name>", desc: "Target sub-environment within the environment" },
          { flag: "--dir <path>", desc: "Config directory override" },
        ]}
        examples={[
          { cmd: "lockbox set db.host localhost", comment: "In defaults" },
          { cmd: "lockbox set db.host prod.db.com --env production", comment: "In an environment" },
          { cmd: "lockbox set db.host us.db.com --env production --sub-env us-west-2", comment: "In a sub-environment" },
        ]}
      />

      <Command
        name="lockbox set-secret"
        desc="Set a secret value. Requires --env. Stored as plaintext initially, encrypted on the next generate."
        flags={[
          { flag: "--env <name>", desc: "Target environment (required)" },
          { flag: "--sub-env <name>", desc: "Target sub-environment" },
          { flag: "--dir <path>", desc: "Config directory override" },
        ]}
        examples={[
          { cmd: "lockbox set-secret db.password s3cret --env production" },
        ]}
      />

      <Command
        name="lockbox view"
        desc="View the full decrypted config for an environment. Reads the private key from .lockbox/private-key."
        flags={[
          { flag: "--env <name>", desc: "Target environment (required)" },
          { flag: "--sub-env <name>", desc: "Target sub-environment" },
          { flag: "--override <file>", desc: "Override JSON file merged on top (repeatable)" },
          { flag: "--dir <path>", desc: "Config directory override" },
        ]}
        examples={[
          { cmd: "lockbox view --env production" },
          { cmd: "lockbox view --env production --sub-env us-west-2", comment: "With sub-environment" },
          { cmd: "lockbox view --env production --override local.json", comment: "With overrides" },
        ]}
      />

      <Command
        name="lockbox keygen"
        desc="Generate a new encryption keypair and print it to stdout."
        flags={[]}
      />

      <Command
        name="lockbox set-private-key"
        desc="Store a private key locally for CLI operations. Saved to .lockbox/private-key with 600 permissions, auto-added to .gitignore."
        flags={[]}
        examples={[
          { cmd: "lockbox set-private-key <base64-key>" },
        ]}
      />
    </div>
  );
}
