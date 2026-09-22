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

export type Lang = "en" | "zh";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "midearth-lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang | null>(null);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "zh" ? "zh-Hans" : "en";
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "zh" ? "en" : "zh");
  }, [lang, setLang]);

  useEffect(() => {
    let storedLanguage: Lang;
    try {
      storedLanguage = resolveStoredLanguage(localStorage.getItem(STORAGE_KEY));
    } catch {
      storedLanguage = "en";
    }
    startTransition(() => setLangState(storedLanguage));
  }, []);

  useEffect(() => {
    if (lang) {
      document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    }
  }, [lang]);

  if (!lang) return null;

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
