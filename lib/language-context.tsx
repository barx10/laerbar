"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { no, en, type Translations } from "./i18n";

type Lang = "no" | "en";

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}>({ lang: "no", setLang: () => {}, t: no });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("no");

  useEffect(() => {
    const stored = localStorage.getItem("laerbar_lang") as Lang | null;
    if (stored === "en" || stored === "no") {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  function setLang(l: Lang) {
    localStorage.setItem("laerbar_lang", l);
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
