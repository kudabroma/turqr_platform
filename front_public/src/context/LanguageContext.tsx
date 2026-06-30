import React, { createContext, useContext, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Lang } from '@/api/public';

interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function normalizeLang(x: string | null): string {
  if (!x) return "tr";
  // strip region suffix ("en-US" → "en") and lowercase
  return x.toLowerCase().trim().split("-")[0] || "tr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const language = normalizeLang(searchParams.get("lang"));

  const setLanguage = (lang: Lang) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("lang", lang);
    setSearchParams(sp, { replace: true });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
