export function CodeBlock({
  html,
  filename,
}: {
  html: string;
  filename?: string;
}) {
  return (
    <div>
      {filename && (
        <span className="inline-block font-mono text-xs text-fg-dim bg-bg-code border border-border border-b-0 rounded-t-lg px-4 py-1.5 -mb-px relative z-10">
          {filename}
        </span>
      )}
      <div
        className={`[&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-5 [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-[0.8rem] [&_pre]:leading-[1.8] ${
          filename ? "[&_pre]:rounded-tl-none" : ""
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
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
