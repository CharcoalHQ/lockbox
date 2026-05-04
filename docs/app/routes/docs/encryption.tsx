import { Link } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";

export function meta() {
  return [{ title: "Encryption & Secrets - lockbox" }];
}

export default function Encryption() {
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

      {/* Why this is safe */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Wait — is it safe to commit secrets to git?
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Yes, when they&apos;re properly encrypted. This is the same approach used
        by tools like{" "}
        <a
          href="https://github.com/mozilla/sops"
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mozilla SOPS
        </a>
        ,{" "}
        <a
          href="https://github.com/bitnami-labs/sealed-secrets"
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sealed Secrets
        </a>
        , and{" "}
        <a
          href="https://github.com/transcrypt-org/transcrypt"
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Transcrypt
        </a>
        . The key insight:
      </p>
      <div className="bg-bg-raised border border-accent-dim rounded-lg p-6 mb-6">
        <p className="text-fg font-medium mb-3">
          The encrypted values in your repo are useless without the private key.
        </p>
        <p className="text-fg-muted text-sm font-light leading-relaxed">
          Lockbox uses{" "}
          <strong className="text-fg">libsodium sealed boxes</strong> — the same
          public-key cryptography used in Signal, WhatsApp, and SSH. Even if
          someone has full access to your repo, they cannot decrypt the secrets
          without the private key, which never touches git.
        </p>
      </div>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        The benefit of committing encrypted secrets is that your config is
        fully self-contained and versioned. You don&apos;t need to sync a
        separate secrets store, and you can see exactly what changed in a pull
        request — including secret additions and removals (though not their
        plaintext values).
      </p>

      {/* How it works */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        How encryption works
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        When you add a secret, you write it as plaintext in{" "}
        <InlineCode>secret.json</InlineCode>. When you run{" "}
        <InlineCode>lockbox generate</InlineCode>, lockbox encrypts every
        plaintext value using the public key and writes the ciphertext back to
        the file:
      </p>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        <CodeBlock filename="secret.json (you write this)">
          {`{\n`}
          {"  "}<span className="pr">&quot;db&quot;</span>: {`{\n`}
          {"    "}<span className="pr">&quot;password&quot;</span>:{" "}
          <span className="str">&quot;hunter2&quot;</span>{"\n"}
          {"  "}
          {"}\n}"}
        </CodeBlock>
        <CodeBlock filename="secret.json (after generate)">
          {`{\n`}
          {"  "}<span className="pr">&quot;db&quot;</span>: {`{\n`}
          {"    "}<span className="pr">&quot;password&quot;</span>:{" "}
          <span className="str">&quot;ENC[k8sJd2x...Qm9F]&quot;</span>{"\n"}
          {"  "}
          {"}\n}"}
        </CodeBlock>
      </div>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        The plaintext never makes it into a commit. Git hooks run{" "}
        <InlineCode>lockbox validate</InlineCode> on every commit and push,
        which fails if any plaintext secrets are detected. Even if you forget to
        run <InlineCode>generate</InlineCode>, the hooks catch it.
      </p>

      {/* Key management */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Key management
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Lockbox uses asymmetric encryption — a keypair with distinct roles:
      </p>
      <div className="space-y-4 mb-8">
        <div className="bg-bg-raised border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <span className="text-accent">{"●"}</span> Public key — committed to
            repo
          </h3>
          <p className="text-fg-muted text-sm font-light leading-relaxed">
            Stored at <InlineCode>lockbox.pub</InlineCode> in your config
            directory. Anyone with repo access can use it to encrypt new secrets.
            It cannot be used to decrypt anything — sharing it is completely
            safe.
          </p>
        </div>
        <div className="bg-bg-raised border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <span className="text-error">{"●"}</span> Private key — never in git
          </h3>
          <p className="text-fg-muted text-sm font-light leading-relaxed">
            Stored locally at{" "}
            <InlineCode>.lockbox/private-key</InlineCode> (mode 600, auto-added
            to <InlineCode>.gitignore</InlineCode>). This is the only key that
            can decrypt secrets. For production, store it in your secrets manager
            (AWS Secrets Manager, Vault, etc.) and pass it as an environment
            variable.
          </p>
        </div>
      </div>
      <div className="bg-bg-raised border border-border rounded-lg p-5 mb-8">
        <p className="text-fg-muted text-sm font-light leading-relaxed">
          <strong className="text-fg">Think of it like SSH keys:</strong> you
          add your public key to GitHub (safe to share), and your private key
          stays on your machine (never shared). Lockbox works the same way — the
          public key encrypts, the private key decrypts.
        </p>
      </div>

      {/* Runtime decryption */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Runtime decryption
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        At runtime, pass the private key to{" "}
        <InlineCode>createConfig</InlineCode>. Secrets are decrypted in memory
        — the plaintext is never written to disk:
      </p>
      <CodeBlock>
        <span className="cm">
          {"// From an environment variable (most common)"}
        </span>
        {"\n"}
        <span className="fn">createConfig</span>({"{"}
        {"\n"}
        {"  "}privateKey: process.env.
        <span className="pr">LOCKBOX_PRIVATE_KEY</span>,{"\n"}
        {"  "}...{"\n"}
        {"}"});{"\n\n"}
        <span className="cm">
          {"// Or an async resolver for secrets managers"}
        </span>
        {"\n"}
        <span className="fn">createConfig</span>({"{"}
        {"\n"}
        {"  "}privateKey: <span className="kw">async</span> () =&gt; {"{"}
        {"\n"}
        {"    "}
        <span className="kw">const</span> secret{" "}
        <span className="op">=</span> <span className="kw">await</span>{" "}
        secretsManager.<span className="fn">getSecret</span>(
        <span className="str">&apos;lockbox-key&apos;</span>);{"\n"}
        {"    "}
        <span className="kw">return</span> secret.value;{"\n"}
        {"  "}
        {"},\n"}
        {"  "}...{"\n"}
        {"}"});
      </CodeBlock>
      <p className="text-fg-muted font-light mt-4 mb-8 leading-relaxed">
        If the config contains{" "}
        <InlineCode>ENC[...]</InlineCode> values but no private key is provided,
        lockbox throws a clear error at startup rather than silently passing
        encrypted strings through.
      </p>

      {/* Git hooks */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Safety net: git hooks
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        <InlineCode>lockbox init</InlineCode> installs pre-commit and pre-push
        hooks that run <InlineCode>lockbox validate</InlineCode>. This is your
        safety net — even if the workflow breaks down, these hooks prevent
        mistakes from reaching your remote:
      </p>
      <ul className="text-fg-muted font-light space-y-3 mb-8">
        <li className="flex items-start gap-3">
          <span className="text-accent mt-0.5 shrink-0">{"✓"}</span>
          <span>
            <strong className="text-fg">No plaintext secrets committed</strong>{" "}
            — fails if any value in <InlineCode>secret.json</InlineCode> is not
            encrypted
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-accent mt-0.5 shrink-0">{"✓"}</span>
          <span>
            <strong className="text-fg">Generated files are fresh</strong> —
            fails if <InlineCode>generated.ts</InlineCode> doesn&apos;t match
            the current JSON sources
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="text-accent mt-0.5 shrink-0">{"✓"}</span>
          <span>
            <strong className="text-fg">Required fields are set</strong> — fails
            if any <InlineCode>**REQUIRED**</InlineCode> sentinel is left unset
          </span>
        </li>
      </ul>

      {/* What does a PR look like */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        What does a PR look like?
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        When someone adds or changes a secret, the diff shows the encrypted
        ciphertext changing. Reviewers can see that a secret was modified
        without seeing its value:
      </p>
      <CodeBlock filename="diff: production/secret.json">
        {"  "}
        <span className="pr">&quot;db&quot;</span>: {"{"}
        {"\n"}
        <span className="text-error">
          {"−   "}&quot;password&quot;: &quot;ENC[aB3x...old]&quot;
        </span>
        {"\n"}
        <span className="text-accent">
          {"+   "}&quot;password&quot;: &quot;ENC[k8sJ...new]&quot;
        </span>
        {"\n"}
        {"  "}
        {"}"}
      </CodeBlock>
      <p className="text-fg-muted font-light mt-4 mb-8 leading-relaxed">
        Non-secret config changes in <InlineCode>clear.json</InlineCode> are
        fully visible in diffs as normal JSON changes.
      </p>

      {/* CLI */}
      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Related CLI commands
      </h2>
      <CodeBlock>
        <span className="cm"># Generate a new keypair</span>
        {"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">lockbox keygen</span>
        {"\n\n"}
        <span className="cm"># Store a private key locally</span>
        {"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">
          lockbox set-private-key {"<base64-key>"}
        </span>
        {"\n\n"}
        <span className="cm"># Add a secret (plaintext, encrypted on generate)</span>
        {"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">
          lockbox set-secret db.password s3cret --env production
        </span>
        {"\n\n"}
        <span className="cm"># View decrypted config for an environment</span>
        {"\n"}
        <span className="sh">$</span>{" "}
        <span className="cmd">lockbox view --env production</span>
      </CodeBlock>
    </div>
  );
}
