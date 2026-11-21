import { createContext, useContext } from 'react';
import { TRANSLATIONS, type LanguageCode, type Translations } from './translations';

export interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Translations;
}

export const I18nContext = createContext<I18nContextValue>({
  language: 'my',
  setLanguage: () => undefined,
  t: TRANSLATIONS.my,
});

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
