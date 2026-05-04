export function Footer() {
  return (
    <footer className="border-t border-border mt-20 py-10 px-6 text-center text-fg-dim text-sm">
      <p>
        <strong className="text-fg-muted">lockbox</strong> is MIT licensed and
        maintained by{" "}
        <a
          href="https://github.com/CharcoalHQ"
          className="text-fg-muted hover:text-fg transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          CharcoalHQ
        </a>
        .
      </p>
      <p className="mt-2">
        <a
          href="https://github.com/CharcoalHQ/lockbox"
          className="text-fg-muted hover:text-fg transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        {" · "}
        <a
          href="https://www.npmjs.com/package/@charcoalhq/lockbox"
          className="text-fg-muted hover:text-fg transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          npm
        </a>
      </p>
    </footer>
  );
}
