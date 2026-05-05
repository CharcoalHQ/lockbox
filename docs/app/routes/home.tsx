import { Link, useLoaderData } from "react-router";
import { Nav } from "~/components/nav";
import { CodeBlock } from "~/components/code-block";
import { Footer } from "~/components/footer";
import { highlight } from "~/lib/shiki.server";

export function meta() {
  return [
    { title: "lockbox - Typed config with encrypted secrets for TypeScript" },
    {
      name: "description",
      content:
        "The last config and secrets manager your TypeScript app needs. Per-environment overrides, encrypted secrets, full type safety.",
    },
  ];
}

export async function loader() {
  const quickExample = await highlight(
    `import { z } from 'zod';
import { createConfig } from '@charcoalhq/lockbox';
import prodConfig from './config/production/generated.js';

const schema = z.object({
  db: z.object({
    host: z.string(),
    port: z.number().default(5432),
    password: z.string(),
  }),
});

export const { config } = await createConfig({
  configs: { production: prodConfig },
  environment: 'production',
  privateKey: process.env.LOCKBOX_PRIVATE_KEY,
  schema,
});

config.db.host;      // string ✔
config.db.password;   // decrypted at runtime ✔
config.db.missing;    // ✗ TypeScript error`,
    "typescript"
  );

  return { quickExample };
}

const features = [
  {
    icon: "\u{1F512}",
    title: "Encrypted secrets",
    desc: "Secrets are encrypted with libsodium sealed boxes. Public key lives in your repo, private key stays in your secrets manager.",
  },
  {
    icon: "✨",
    title: "Full type safety",
    desc: "Validate with Zod, Valibot, ArkType, or any Standard Schema library. Static type inference and clear error messages.",
  },
  {
    icon: "\u{1F4C1}",
    title: "Per-environment overrides",
    desc: "Base defaults deep-merged with environment-specific config and secrets. No duplicating config across environments.",
  },
  {
    icon: "\u{1F517}",
    title: "Config inheritance",
    desc: 'Environments extend other environments. One line: "_extends": "production"',
  },
  {
    icon: "\u{1F30D}",
    title: "Sub-environments",
    desc: "Nest additional layers within an environment for regions, clusters, tenants, or any other dimension.",
  },
  {
    icon: "\u{1F6E1}️",
    title: "Git hooks",
    desc: "Pre-commit and pre-push hooks validate secrets are encrypted, generated files are fresh, and required fields are present.",
  },
];

export default function Home() {
  const { quickExample } = useLoaderData<typeof loader>();

  return (
    <>
      <Nav />

      <main>
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-glow border border-accent-dim text-accent text-xs font-medium mb-8">
          @charcoalhq/lockbox
        </span>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-5">
          Typed config.
          <br />
          <span className="text-accent">Encrypted secrets.</span>
        </h1>
        <p className="text-fg-muted text-lg sm:text-xl max-w-xl mx-auto mb-10 font-light leading-relaxed">
          Define your config in JSON. Secrets get encrypted automatically.
          Everything is merged per-environment, typed end-to-end, and validated
          on every commit.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/docs/getting-started"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-accent text-bg hover:brightness-110 transition-all hover:-translate-y-px"
          >
            Get Started
          </Link>
          <a
            href="https://github.com/CharcoalHQ/lockbox"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-bg-raised text-fg border border-border hover:border-fg-dim transition-all hover:-translate-y-px"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
            </svg>
            GitHub
          </a>
        </div>
        <div className="mt-8 inline-flex items-center gap-3 bg-bg-raised border border-border rounded-lg px-5 py-2.5 font-mono text-sm text-fg-muted">
          <span>
            <span className="text-fg-dim">$</span>{" "}
            <span className="text-fg">pnpm add @charcoalhq/lockbox</span>
          </span>
          <button
            onClick={() =>
              navigator.clipboard.writeText("pnpm add @charcoalhq/lockbox")
            }
            className="text-fg-dim hover:text-fg transition-colors p-1 rounded cursor-pointer"
            title="Copy"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Problem */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          The Problem
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Config shouldn&apos;t be this fragile
        </h2>
        <p className="text-fg-muted text-lg max-w-2xl font-light">
          Missing env vars at deploy time. Secrets committed in plaintext.
          Config that works in staging but breaks in production.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            {
              title: "Scattered .env files",
              desc: "Env vars spread across .env, .env.local, .env.production, CI secrets, Kubernetes configs. No single source of truth.",
            },
            {
              title: "Secrets in plaintext",
              desc: "Accidentally committed a secret? Now you need to rotate it, scrub git history, and hope nobody noticed.",
            },
            {
              title: "Runtime surprises",
              desc: "Missing config values surface as undefined deep in your app. You find out at 2am when prod goes down.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-bg-raised border border-border rounded-lg p-6"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-error">{"✗"}</span> {card.title}
              </h3>
              <p className="text-fg-muted text-sm font-light leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          Features
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Everything you need, nothing you don&apos;t
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-bg-raised border border-border rounded-lg p-6"
            >
              <div className="w-9 h-9 rounded-lg bg-accent-glow flex items-center justify-center text-lg mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-fg-muted text-sm font-light leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Example */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          Quick Example
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          See it in action
        </h2>
        <p className="text-fg-muted text-lg max-w-2xl font-light mb-10">
          Define your schema, import the generated config, and get full type
          safety with decrypted secrets at runtime.
        </p>
        <CodeBlock html={quickExample} filename="src/config.ts" />
        <div className="mt-8 text-center">
          <Link
            to="/docs/getting-started"
            className="inline-flex items-center gap-2 text-accent hover:underline text-sm font-medium"
          >
            Full getting started guide {"→"}
          </Link>
        </div>
      </section>

      {/* Merge Order */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          How It Works
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Predictable merge order
        </h2>
        <p className="text-fg-muted text-lg max-w-2xl font-light mb-10">
          Configs are deep-merged left to right. Objects merge recursively.
          Everything else is replaced. Later layers always win.
        </p>
        <div className="max-w-lg">
          {[
            { label: "default.json", desc: "Base defaults" },
            { label: "_extends ancestors", desc: "Inherited environments" },
            { label: "{env}/clear.json", desc: "Environment config" },
            { label: "{env}/secret.json", desc: "Environment secrets" },
            { label: "{sub-env}/clear.json", desc: "Sub-environment config" },
            { label: "{sub-env}/secret.json", desc: "Sub-environment secrets" },
            { label: "runtime overrides", desc: "Always wins", active: true },
          ].map((layer, i, arr) => {
            const opacity = 0.35 + (i / (arr.length - 1)) * 0.65;
            return (
              <div
                key={layer.label}
                aria-hidden="true"
                className={`relative flex items-center gap-4 px-5 py-3 rounded-lg border font-mono text-sm ${
                  i > 0 ? "-mt-1" : ""
                } ${
                  layer.active
                    ? "bg-accent-glow border-accent-dim z-50"
                    : "bg-bg-code border-border"
                }`}
                style={{
                  zIndex: 10 + i,
                  opacity: layer.active ? 1 : opacity,
                  marginLeft: i * 8,
                }}
              >
                <span className="text-fg-dim text-xs w-4 text-right shrink-0">
                  {i + 1}
                </span>
                <span
                  className={layer.active ? "text-accent" : "text-fg"}
                >
                  {layer.label}
                </span>
                <span
                  className={`text-xs ml-auto hidden sm:block ${
                    layer.active ? "text-accent" : "text-fg-dim"
                  }`}
                >
                  {layer.desc}
                </span>
              </div>
            );
          })}
          <div className="flex items-center justify-between mt-4 text-xs text-fg-dim px-1">
            <span>lowest priority</span>
            <span className="text-accent font-medium">highest priority</span>
          </div>
        </div>
      </section>

      {/* Docs links */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          Learn More
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10">
          Explore the docs
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              to: "/docs/getting-started",
              title: "Getting Started",
              desc: "Initialize, add values, and use in your app in 3 steps.",
            },
            {
              to: "/docs/encryption",
              title: "Encryption & Secrets",
              desc: "Why it's safe to commit encrypted secrets, and how it all works.",
            },
            {
              to: "/docs/inheritance",
              title: "Config Inheritance",
              desc: "Extend environments from each other to eliminate duplication.",
            },
            {
              to: "/docs/sub-environments",
              title: "Sub-environments",
              desc: "Add region, cluster, or tenant-specific config layers.",
            },
            {
              to: "/docs/overrides",
              title: "Runtime Overrides",
              desc: "Layer ad-hoc config on top for local dev and testing.",
            },
            {
              to: "/docs/cli",
              title: "CLI Reference",
              desc: "Every command, flag, and option documented.",
            },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-bg-raised border border-border rounded-lg p-6 hover:border-accent-dim transition-colors group"
            >
              <h3 className="font-semibold mb-1.5 group-hover:text-accent transition-colors">
                {link.title}
              </h3>
              <p className="text-fg-muted text-sm font-light">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      </main>

      <Footer />
    </>
  );
}
