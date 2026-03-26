import { useState, useCallback } from 'react';
import { Language, translations, t } from '../i18n';

const LANGUAGE_KEY = 'lexigraph_language';

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return (saved as Language) || 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const translate = useCallback((key: string) => {
    return t(key, language);
  }, [language]);

  return { language, setLanguage, t: translate };
}
