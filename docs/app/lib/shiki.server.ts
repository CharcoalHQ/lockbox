import { codeToHtml, type BundledLanguage } from "shiki";

const THEME = "tokyo-night";

export async function highlight(code: string, lang: BundledLanguage | "text") {
  return codeToHtml(code.trim(), {
    lang: lang as BundledLanguage,
    theme: THEME,
    colorReplacements: {
      "#1a1b26": "var(--color-bg-code)",
    },
  });
}
