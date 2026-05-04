import { useLoaderData } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";
import { highlight } from "~/lib/shiki.server";

export function meta() {
  return [{ title: "CLI Reference - lockbox" }];
}

export async function loader() {
  const commands = await Promise.all([
    highlight(
      `Usage: lockbox init [options]

Options:
  --dir <path>       Config directory (default: ./config)
  --env <name>       Environment to create (repeatable)
  --sub-env <name>   Sub-environment to create in each env (repeatable)`,
      "text"
    ),
    highlight(
      `$ lockbox init --dir ./src/config --env test --env production
$ lockbox init --env test --env production --sub-env us-west-2 --sub-env eu-central-1`,
      "shellsession"
    ),
    highlight(
      `Usage: lockbox generate [options]

Options:
  --dir <path>       Config directory override`,
      "text"
    ),
    highlight(
      `Usage: lockbox validate [options]

Options:
  --dir <path>       Config directory override`,
      "text"
    ),
    highlight(
      `Usage: lockbox set <key> <value> [options]

Options:
  --env <name>       Target environment (writes to default.json if omitted)
  --sub-env <name>   Target sub-environment within the environment
  --dir <path>       Config directory override`,
      "text"
    ),
    highlight(
      `$ lockbox set db.host localhost
$ lockbox set db.host prod.db.com --env production
$ lockbox set db.host us.db.com --env production --sub-env us-west-2`,
      "shellsession"
    ),
    highlight(
      `Usage: lockbox set-secret <key> <value> [options]

Options:
  --env <name>       Target environment (required)
  --sub-env <name>   Target sub-environment
  --dir <path>       Config directory override`,
      "text"
    ),
    highlight(
      `Usage: lockbox view [options]

Options:
  --env <name>       Target environment (required)
  --sub-env <name>   Target sub-environment
  --override <file>  Override JSON file merged on top (repeatable)
  --dir <path>       Config directory override`,
      "text"
    ),
    highlight(
      `$ lockbox view --env production
$ lockbox view --env production --sub-env us-west-2
$ lockbox view --env production --override local.json`,
      "shellsession"
    ),
  ]);

  return {
    initUsage: commands[0],
    initExamples: commands[1],
    generateUsage: commands[2],
    validateUsage: commands[3],
    setUsage: commands[4],
    setExamples: commands[5],
    setSecretUsage: commands[6],
    viewUsage: commands[7],
    viewExamples: commands[8],
  };
}

export default function CLI() {
  const data = useLoaderData<typeof loader>();

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
        usage={data.initUsage}
        examples={data.initExamples}
      />
      <Command
        name="lockbox generate"
        desc="Encrypt plaintext secrets and generate per-environment TypeScript config files, including all sub-environments."
        usage={data.generateUsage}
      />
      <Command
        name="lockbox validate"
        desc="Check that all secrets are encrypted, generated files are up-to-date, and required fields are present."
        usage={data.validateUsage}
      />
      <Command
        name="lockbox set"
        desc="Set a plaintext config value. Supports dot-notation for nested keys. Auto-runs generate."
        usage={data.setUsage}
        examples={data.setExamples}
      />
      <Command
        name="lockbox set-secret"
        desc="Set a secret value. Requires --env. Stored as plaintext initially, encrypted on the next generate."
        usage={data.setSecretUsage}
      />
      <Command
        name="lockbox view"
        desc="View the full decrypted config for an environment. Reads the private key from .lockbox/private-key."
        usage={data.viewUsage}
        examples={data.viewExamples}
      />
      <Command
        name="lockbox keygen"
        desc="Generate a new encryption keypair and print it to stdout."
      />
      <Command
        name="lockbox set-private-key"
        desc="Store a private key locally. Saved to .lockbox/private-key with 600 permissions, auto-added to .gitignore."
      />
    </div>
  );
}

function Command({
  name,
  desc,
  usage,
  examples,
}: {
  name: string;
  desc: string;
  usage?: string;
  examples?: string;
}) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-2 pb-3 border-b border-border font-mono">
        {name}
      </h2>
      <p className="text-fg-muted font-light mb-4">{desc}</p>
      {usage && <CodeBlock html={usage} />}
      {examples && (
        <div className="mt-3">
          <CodeBlock html={examples} />
        </div>
      )}
    </div>
  );
}
