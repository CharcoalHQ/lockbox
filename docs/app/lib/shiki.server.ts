import { codeToHtml, type BundledLanguage } from "shiki";

const THEME = "vitesse-dark";

export async function highlight(code: string, lang: BundledLanguage) {
  return codeToHtml(code.trim(), {
    lang,
    theme: THEME,
    colorReplacements: {
      "#121212": "var(--color-bg-code)",
    },
  });
}
