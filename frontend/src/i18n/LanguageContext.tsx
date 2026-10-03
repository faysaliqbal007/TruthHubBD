"use client";
import {createContext, useCallback, useContext} from 'react';
export type Language = 'en' | 'bn';
export const LanguageContext = createContext<{lang: Language; setLang: (lang: Language) => void}>({lang: 'en', setLang: () => {}});
export function useLanguage() { return useContext(LanguageContext); }
export function useI18n() {
  const language = useLanguage();
  const t = useCallback((en: string, bn: string) => language.lang === 'bn' ? bn : en, [language.lang]);
  return {...language, t};
}
