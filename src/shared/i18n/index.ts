import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { vi } from "./locales/vi";

export type SupportedLanguage = "en" | "vi";
export const STORAGE_LANG_KEY = "equiflow-lang";

export function getStoredLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === "en" || saved === "vi") return saved;
    // Default to 'vi' or system language if starts with 'vi'
    if (typeof navigator !== "undefined" && navigator.language?.startsWith("vi")) {
      return "vi";
    }
    return "en";
  } catch {
    return "en";
  }
}

export function applyLanguage(lang: SupportedLanguage) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
}

const initialLang = getStoredLanguage();
applyLanguage(initialLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: initialLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already prevents XSS
    },
  });

export function changeAppLanguage(lang: SupportedLanguage) {
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  } catch {
    // Storage restricted
  }
  applyLanguage(lang);
  return i18n.changeLanguage(lang);
}

export default i18n;
