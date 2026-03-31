"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Language, translations, Translations } from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  t: Translations;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  t: translations.en,
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("flip7-lang") as Language | null;
    if (stored === "en" || stored === "es") {
      setLanguage(stored);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next: Language = prev === "en" ? "es" : "en";
      localStorage.setItem("flip7-lang", next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider
      value={{ language, t: translations[language], toggleLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button
      onClick={toggleLanguage}
      title={language === "en" ? "Cambiar a Español" : "Switch to English"}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm"
    >
      <span className="text-lg leading-none">
        {language === "en" ? "🇺🇸" : "🇦🇷"}
      </span>
      <span className="text-gray-400 text-xs font-medium">
        {language === "en" ? "EN" : "ES"}
      </span>
    </button>
  );
}
