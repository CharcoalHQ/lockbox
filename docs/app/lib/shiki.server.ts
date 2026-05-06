import { codeToHtml, type BundledLanguage } from "shiki";

const THEME = "one-dark-pro";

export async function highlight(code: string, lang: BundledLanguage | "text") {
  return codeToHtml(code.trim(), {
    lang: lang as BundledLanguage,
    theme: THEME,
    colorReplacements: {
      "#282c34": "var(--color-bg-code)",
    },
  });
}
