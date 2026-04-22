
import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../constants/translations';

export const useTranslation = (lang: LanguageCode = 'EN') => {
  const t = (key: string): string => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS['EN'][key] || key;
  };

  return { t };
};
