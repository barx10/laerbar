export type Lang = "no" | "en";

export const LANG_COOKIE = "laerbar_lang";
export const LANG_STORAGE_KEY = "laerbar_lang";

export function parseLang(value: string | undefined | null): Lang {
  return value === "en" ? "en" : "no";
}

export function writeLangCookie(lang: Lang) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${oneYear}; samesite=lax`;
}
