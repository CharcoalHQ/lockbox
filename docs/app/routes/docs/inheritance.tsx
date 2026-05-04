import { Link, useLoaderData } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";
import { highlight } from "~/lib/shiki.server";

export function meta() {
  return [{ title: "Config Inheritance - lockbox" }];
}

export async function loader() {
  const [prodClear, stagingClear, multiLevel] = await Promise.all([
    highlight(
      `{
  "api": {
    "url": "https://api.example.com",
    "timeout": 30000
  },
  "logging": { "level": "error" }
}`,
      "json"
    ),
    highlight(
      `{
  "_extends": "production",
  "logging": { "level": "debug" }
}`,
      "json"
    ),
    highlight(
      `// dev/clear.json
{ "_extends": "staging", "debug": true }

// staging/clear.json
{ "_extends": "production", "logging": { "level": "debug" } }

// production/clear.json
{ "api": { "url": "https://api.example.com" } }`,
      "jsonc"
    ),
  ]);

  return { prodClear, stagingClear, multiLevel };
}

export default function Inheritance() {
  const { prodClear, stagingClear, multiLevel } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Config Inheritance
      </h1>
      <p className="text-fg-muted text-lg font-light mb-12 leading-relaxed">
        Environments can extend other environments using{" "}
        <InlineCode>_extends</InlineCode> in their{" "}
        <InlineCode>clear.json</InlineCode>. The child inherits the full merged
        config from its parent and applies its own overrides on top.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Basic example
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Staging inherits everything from production and only overrides the
        logging level:
      </p>
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <CodeBlock html={prodClear} filename="production/clear.json" />
        <CodeBlock html={stagingClear} filename="staging/clear.json" />
      </div>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        The resolved staging config has <InlineCode>api.url</InlineCode> and{" "}
        <InlineCode>api.timeout</InlineCode> from production, with{" "}
        <InlineCode>logging.level</InlineCode> overridden to{" "}
        <InlineCode>&quot;debug&quot;</InlineCode>. The{" "}
        <InlineCode>_extends</InlineCode> key is stripped from the final output.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Multi-level chains
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Inheritance chains can be multiple levels deep. Each level is resolved
        from the most distant ancestor first:
      </p>
      <CodeBlock html={multiLevel} />
      <p className="text-fg-muted font-light mt-4 mb-8 leading-relaxed">
        Merge order for <InlineCode>dev</InlineCode>: default.json {"→"}{" "}
        production/clear + secret {"→"} staging/clear + secret {"→"} dev/clear +
        secret.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Error handling
      </h2>
      <ul className="text-fg-muted font-light space-y-2 mb-8 list-disc list-inside">
        <li>
          <strong className="text-fg">Circular dependencies</strong> — a extends
          b extends a throws with the full cycle path
        </li>
        <li>
          <strong className="text-fg">Missing parents</strong> — extending a
          non-existent environment throws with available environments listed
        </li>
        <li>
          <strong className="text-fg">Invalid type</strong> —{" "}
          <InlineCode>_extends</InlineCode> must be a string
        </li>
      </ul>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Works with sub-environments
      </h2>
      <p className="text-fg-muted font-light leading-relaxed">
        Inheritance is resolved before{" "}
        <Link
          to="/docs/sub-environments"
          className="text-accent hover:underline"
        >
          sub-environment
        </Link>{" "}
        layers are applied. If staging extends production and has a{" "}
        <InlineCode>us-west-2</InlineCode> sub-environment, the merge order is:
        default {"→"} production {"→"} staging {"→"} staging/us-west-2.
      </p>
    </div>
  );
}
