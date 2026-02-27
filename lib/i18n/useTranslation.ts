import { useAppStore } from '../store';
import { translations, Language } from './translations';

export function useTranslation() {
  const language: Language = 'zh';
  
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      if (value[k] === undefined) {
        return key; // Fallback to key if not found
      }
      value = value[k];
    }
    return value as string;
  };

  return { t, language };
}
