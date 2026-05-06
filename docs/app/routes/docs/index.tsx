import { Link } from "react-router";

export function meta() {
  return [{ title: "Docs - lockbox" }];
}

const pages = [
  {
    to: "/docs/getting-started",
    title: "Getting Started",
    desc: "Initialize a project, add config values, and use them in your app.",
  },
  {
    to: "/docs/encryption",
    title: "Encryption & Secrets",
    desc: "How secrets are encrypted, why it's safe to commit them, and how decryption works at runtime.",
  },
  {
    to: "/docs/inheritance",
    title: "Config Inheritance",
    desc: 'Use "_extends" to share config between environments without duplication.',
  },
  {
    to: "/docs/sub-environments",
    title: "Sub-environments",
    desc: "Add region, cluster, or tenant-specific config layers within any environment.",
  },
  {
    to: "/docs/overrides",
    title: "Runtime Overrides",
    desc: "Layer ad-hoc config on top at runtime for local development and testing.",
  },
  {
    to: "/docs/cli",
    title: "CLI Reference",
    desc: "Every command, flag, and option.",
  },
];

export default function DocsIndex() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Documentation</h1>
      <p className="text-fg-muted text-lg font-light mb-10 leading-relaxed">
        lockbox is a typed configuration manager with encrypted secrets for
        TypeScript. Define your config in JSON, validate it with your schema,
        and let lockbox handle encryption, merging, and code generation.
      </p>
      <div className="flex flex-col gap-3">
        {pages.map((page) => (
          <Link
            key={page.to}
            to={page.to}
            className="bg-bg-raised border border-border rounded-lg p-5 hover:border-accent-dim transition-colors group"
          >
            <h2 className="font-semibold group-hover:text-accent transition-colors">
              {page.title}
            </h2>
            <p className="text-fg-muted text-sm font-light mt-1">
              {page.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
