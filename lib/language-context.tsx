"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { no, en, type Translations } from "./i18n";
import {
  LANG_STORAGE_KEY,
  parseLang,
  writeLangCookie,
  type Lang,
} from "./language-cookie";

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}>({ lang: "no", setLang: () => {}, t: no });

export function LanguageProvider({
  children,
  initialLang = "no",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    if (raw === "no" || raw === "en") {
      if (raw !== lang) {
        setLangState(raw);
        document.documentElement.lang = raw;
      }
      writeLangCookie(raw);
    } else {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      writeLangCookie(lang);
    }
  }, []);

  function setLang(l: Lang) {
    localStorage.setItem(LANG_STORAGE_KEY, l);
    writeLangCookie(l);
    setLangState(l);
    document.documentElement.lang = l;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: lang === "en" ? en : no }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
