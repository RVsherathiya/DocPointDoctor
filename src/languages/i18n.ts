import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import gu from './gu.json';
import mr from './mr.json';
import ar from './ar.json';

const resources = {
  en,
  hi,
  gu,
  mr,
  ar,
};

const savedLanguage = localStorage.getItem('doctor_language') || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
