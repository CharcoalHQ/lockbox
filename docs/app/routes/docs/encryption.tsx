import { Link, useLoaderData } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";
import { highlight } from "~/lib/shiki.server";

export function meta() {
  return [{ title: "Encryption & Secrets - lockbox" }];
}

export async function loader() {
  const [beforeGen, afterGen, runtimeDecrypt, cliCmds, diffExample] =
    await Promise.all([
      highlight(`{\n  "db": {\n    "password": "hunter2"\n  }\n}`, "json"),
      highlight(
        `{\n  "db": {\n    "password": "ENC[k8sJd2x...Qm9F]"\n  }\n}`,
        "json"
      ),
      highlight(
        `// From an environment variable (most common)
createConfig({
  privateKey: process.env.LOCKBOX_PRIVATE_KEY,
  ...
});

// Or an async resolver for secrets managers
createConfig({
  privateKey: async () => {
    const secret = await secretsManager.getSecret('lockbox-key');
    return secret.value;
  },
  ...
});`,
        "typescript"
      ),
      highlight(
        `# Generate a new keypair
$ lockbox keygen

# Store a private key locally
$ lockbox set-private-key <base64-key>

# Add a secret (plaintext, encrypted on generate)
$ lockbox set-secret db.password s3cret --env production

# View decrypted config for an environment
$ lockbox view --env production`,
        "bash"
      ),
      highlight(
        `  "db": {
-   "password": "ENC[aB3x...old]"
+   "password": "ENC[k8sJ...new]"
  }`,
        "diff"
      ),
    ]);

  return { beforeGen, afterGen, runtimeDecrypt, cliCmds, diffExample };
}

export default function Encryption() {
  const { beforeGen, afterGen, runtimeDecrypt, cliCmds, diffExample } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Encryption & Secrets
      </h1>
      <p className="text-fg-muted text-lg font-light mb-12 leading-relaxed">
        Lockbox encrypts your secrets and commits the ciphertext to your repo.
        If that sounds unusual, this page explains why it&apos;s safe, how the
        cryptography works, and what guarantees you get.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Wait — is it safe to commit secrets to git?
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Yes, when they&apos;re properly encrypted. This is the same approach
        used by{" "}
        <a href="https://github.com/mozilla/sops" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Mozilla SOPS</a>,{" "}
        <a href="https://github.com/bitnami-labs/sealed-secrets" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Sealed Secrets</a>, and{" "}
        <a href="https://github.com/transcrypt-org/transcrypt" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">Transcrypt</a>.
      </p>
      <div className="bg-bg-raised border border-accent-dim rounded-lg p-6 mb-6">
        <p className="text-fg font-medium mb-3">
          The encrypted values in your repo are useless without the private key.
        </p>
        <p className="text-fg-muted text-sm font-light leading-relaxed">
          Lockbox uses <strong className="text-fg">libsodium sealed boxes</strong> — the same public-key cryptography used in Signal, WhatsApp, and SSH. Even with full repo access, secrets cannot be decrypted without the private key, which never touches git.
        </p>
      </div>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        The benefit is that your config is fully self-contained and versioned. No separate secrets store to sync, and you can see exactly what changed in a PR — including secret additions and removals (though not their plaintext values).
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        How encryption works
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Add secrets as plaintext to <InlineCode>secret.json</InlineCode>. When you run <InlineCode>lockbox generate</InlineCode>, every plaintext value is encrypted using the public key and written back:
      </p>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <CodeBlock html={beforeGen} filename="secret.json (you write this)" />
        <CodeBlock html={afterGen} filename="secret.json (after generate)" />
      </div>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        The plaintext never makes it into a commit. Git hooks run <InlineCode>lockbox validate</InlineCode> on every commit and push, which fails if any plaintext secrets are detected.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Key management
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Lockbox uses asymmetric encryption — a keypair with distinct roles:
      </p>
      <div className="space-y-4 mb-8">
        <div className="bg-bg-raised border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <span className="text-accent">{"●"}</span> Public key — committed to repo
          </h3>
          <p className="text-fg-muted text-sm font-light leading-relaxed">
            Stored at <InlineCode>lockbox.pub</InlineCode>. Anyone with repo access can use it to encrypt new secrets. It cannot decrypt anything — sharing it is completely safe.
          </p>
        </div>
        <div className="bg-bg-raised border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <span className="text-error">{"●"}</span> Private key — never in git
          </h3>
          <p className="text-fg-muted text-sm font-light leading-relaxed">
            Stored at <InlineCode>.lockbox/private-key</InlineCode> (mode 600, auto-added to <InlineCode>.gitignore</InlineCode>). For production, store it in your secrets manager and pass as an env var.
          </p>
        </div>
      </div>
      <div className="bg-bg-raised border border-border rounded-lg p-5 mb-8">
        <p className="text-fg-muted text-sm font-light leading-relaxed">
          <strong className="text-fg">Think of it like SSH keys:</strong> you add your public key to GitHub (safe to share), and your private key stays on your machine (never shared). Lockbox works the same way.
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Runtime decryption
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        At runtime, pass the private key to <InlineCode>createConfig</InlineCode>. Secrets are decrypted in memory — the plaintext is never written to disk:
      </p>
      <CodeBlock html={runtimeDecrypt} />
      <p className="text-fg-muted font-light mt-4 mb-8 leading-relaxed">
        If the config contains <InlineCode>ENC[...]</InlineCode> values but no private key is provided, lockbox throws a clear error at startup.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Safety net: git hooks
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        <InlineCode>lockbox init</InlineCode> installs pre-commit and pre-push hooks that run <InlineCode>lockbox validate</InlineCode>:
      </p>
      <ul className="text-fg-muted font-light space-y-3 mb-8">
        <li className="flex items-start gap-3">
          <span className="text-accent mt-0.5 shrink-0">{"✓"}</span>
          <span><strong className="text-fg">No plaintext secrets committed</strong> — fails if any value in <InlineCode>secret.json</InlineCode> is not encrypted</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-accent mt-0.5 shrink-0">{"✓"}</span>
          <span><strong className="text-fg">Generated files are fresh</strong> — fails if <InlineCode>generated.ts</InlineCode> doesn&apos;t match the source JSON</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-accent mt-0.5 shrink-0">{"✓"}</span>
          <span><strong className="text-fg">Required fields are set</strong> — fails if any <InlineCode>**REQUIRED**</InlineCode> sentinel is left unset</span>
        </li>
      </ul>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        What does a PR look like?
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        When someone changes a secret, the diff shows the ciphertext changing. Reviewers see that a secret was modified without seeing its value:
      </p>
      <CodeBlock html={diffExample} filename="diff: production/secret.json" />

      <h2 className="text-xl font-semibold mt-10 mb-4 pb-3 border-b border-border">
        Related CLI commands
      </h2>
      <CodeBlock html={cliCmds} />
    </div>
  );
}
