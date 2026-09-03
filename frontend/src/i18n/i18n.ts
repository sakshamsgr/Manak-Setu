import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { bn } from './locales/bn';

const LANGUAGE_STORAGE_KEY = 'bis_ui_language_v2';

const savedLang = (() => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'bn') {
      return saved;
    }
  } catch {}
  return 'en';
})();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    bn: { translation: bn },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
