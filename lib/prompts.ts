import type { RequestLang } from "./api-context";

export function noDashesInstruction(lang: RequestLang): string {
  return lang === "en"
    ? "Do not use dashes — neither em-dash (—) nor en-dash (–). Use commas, periods, colons, or parentheses instead. Only regular hyphens (-) in compound words are allowed."
    : "Ikke bruk tankestreker. Hverken em-dash (—) eller en-dash (–). Bruk komma, punktum, kolon eller parenteser i stedet. Kun vanlig bindestrek (-) i sammensatte ord er tillatt.";
}
