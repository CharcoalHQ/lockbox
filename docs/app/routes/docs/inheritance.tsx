import { Link } from "react-router";
import { CodeBlock, InlineCode } from "~/components/code-block";

export function meta() {
  return [{ title: "Config Inheritance - lockbox" }];
}

export default function Inheritance() {
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
      <div className="grid md:grid-cols-2 gap-3 mb-8">
        <CodeBlock filename="production/clear.json">
          {`{\n`}
          {"  "}<span className="pr">&quot;api&quot;</span>: {`{\n`}
          {"    "}<span className="pr">&quot;url&quot;</span>:{" "}
          <span className="str">&quot;https://api.example.com&quot;</span>,{"\n"}
          {"    "}<span className="pr">&quot;timeout&quot;</span>:{" "}
          <span className="num">30000</span>{"\n"}
          {"  "}
          {"},\n"}
          {"  "}<span className="pr">&quot;logging&quot;</span>: {"{"}{" "}
          <span className="pr">&quot;level&quot;</span>:{" "}
          <span className="str">&quot;error&quot;</span> {"}\n}"}
        </CodeBlock>
        <CodeBlock filename="staging/clear.json">
          {`{\n`}
          {"  "}<span className="pr">&quot;_extends&quot;</span>:{" "}
          <span className="str">&quot;production&quot;</span>,{"\n"}
          {"  "}<span className="pr">&quot;logging&quot;</span>: {"{"}{" "}
          <span className="pr">&quot;level&quot;</span>:{" "}
          <span className="str">&quot;debug&quot;</span> {"}\n}"}
        </CodeBlock>
      </div>
      <p className="text-fg-muted font-light mb-8 leading-relaxed">
        The resolved staging config has{" "}
        <InlineCode>api.url</InlineCode> and{" "}
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
      <CodeBlock>
        <span className="cm">{"// dev/clear.json"}</span>{"\n"}
        {"{ "}<span className="pr">&quot;_extends&quot;</span>:{" "}
        <span className="str">&quot;staging&quot;</span>,{" "}
        <span className="pr">&quot;debug&quot;</span>:{" "}
        <span className="kw">true</span> {"}"}{"\n\n"}
        <span className="cm">{"// staging/clear.json"}</span>{"\n"}
        {"{ "}<span className="pr">&quot;_extends&quot;</span>:{" "}
        <span className="str">&quot;production&quot;</span>,{" "}
        <span className="pr">&quot;logging&quot;</span>: {"{"}{" "}
        <span className="pr">&quot;level&quot;</span>:{" "}
        <span className="str">&quot;debug&quot;</span> {"}"} {"}"}{"\n\n"}
        <span className="cm">{"// production/clear.json"}</span>{"\n"}
        {"{ "}<span className="pr">&quot;api&quot;</span>: {"{"}{" "}
        <span className="pr">&quot;url&quot;</span>:{" "}
        <span className="str">&quot;https://api.example.com&quot;</span> {"}"} {"}"}
      </CodeBlock>
      <p className="text-fg-muted font-light mt-4 mb-8 leading-relaxed">
        Merge order for <InlineCode>dev</InlineCode>: default.json{" "}
        {"→"} production/clear + secret {"→"} staging/clear + secret {"→"}{" "}
        dev/clear + secret.
      </p>

      <h2 className="text-xl font-semibold mb-4 pb-3 border-b border-border">
        Error handling
      </h2>
      <p className="text-fg-muted font-light mb-4 leading-relaxed">
        Lockbox detects and reports errors at{" "}
        <InlineCode>generate</InlineCode> and{" "}
        <InlineCode>validate</InlineCode> time:
      </p>
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
