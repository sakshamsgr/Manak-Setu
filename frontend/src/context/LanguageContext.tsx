import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n/i18n';

export type Language = 'en' | 'hi' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'bis_ui_language_v2';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: i18nT, i18n } = useTranslation();

  const currentLanguage = (i18n.language as Language) || 'en';

  const setLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  };

  const t = (key: string, fallback?: string): string => {
    return i18nT(key, { defaultValue: fallback || key });
  };

  return (
    <LanguageContext.Provider value={{ language: currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
