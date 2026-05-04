export function CodeBlock({
  filename,
  children,
}: {
  filename?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {filename && (
        <span className="inline-block font-mono text-xs text-fg-dim bg-bg-code border border-border border-b-0 rounded-t-lg px-4 py-1.5 -mb-px relative z-10">
          {filename}
        </span>
      )}
      <pre
        className={`bg-bg-code border border-border rounded-lg p-5 overflow-x-auto font-mono text-[0.8rem] leading-[1.8] ${
          filename ? "rounded-tl-none" : ""
        }`}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[0.9em] text-accent bg-bg-code px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}
