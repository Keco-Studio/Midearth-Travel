"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { resolveStoredLanguage } from "@/lib/localized-content";
import { serializeLanguageCookie } from "@/lib/language-preferences";

export type Lang = "en" | "zh";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "midearth-lang";

export function LangProvider({
  children,
  initialLang = "en",
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.cookie = serializeLanguageCookie(next);
    document.documentElement.lang = next === "zh" ? "zh-Hans" : "en";
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "zh" ? "en" : "zh");
  }, [lang, setLang]);

  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem(STORAGE_KEY);
      if (storedLanguage === "en" || storedLanguage === "zh") {
        startTransition(() => setLangState(resolveStoredLanguage(storedLanguage)));
        document.cookie = serializeLanguageCookie(storedLanguage);
      }
    } catch {
      // Keep the server-rendered language if storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used within LangProvider");
  }
  return ctx;
}
