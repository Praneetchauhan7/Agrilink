import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '../i18n/translations';
import { LANGUAGES } from '../constants/languages';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => string;
  currentLangObj: typeof LANGUAGES[0];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string, params?: Record<string, string | number>) => {
    let str = fallback || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  },
  currentLangObj: LANGUAGES[0],
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('kisansetu_lang');
      if (saved && LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'en';
  });

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (e) {
      // ignore in non-browser env
    }
  }, [language]);

  const setLanguage = (newLang: string) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('kisansetu_lang', newLang);
      document.documentElement.lang = newLang;
    } catch (e) {
      // ignore
    }
  };

  const t = (key: string, fallback?: string, params?: Record<string, string | number>) => {
    let text = getTranslation(key, language, fallback);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text;
  };

  const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currentLangObj }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
