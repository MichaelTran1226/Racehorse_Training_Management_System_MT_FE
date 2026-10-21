import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { vi } from "./locales/vi";
import { VI_TEXT } from "./vi-text";

export type SupportedLanguage = "en" | "vi";
export const STORAGE_LANG_KEY = "equiflow-lang-v2";

export function getStoredLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === "en" || saved === "vi") return saved;
    // Always default to English ('en') unless explicitly switched by user
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

// Khóa chưa có bản tiếng Việt thì i18next trả câu tiếng Anh mặc định: tra thêm bảng VI_TEXT (dùng chung với tr()).
i18n.use({
  type: "postProcessor",
  name: "viText",
  process: (value: string, _key: string | string[], _options: unknown, translator: { language?: string }) =>
    translator?.language === "vi" ? (VI_TEXT[value] ?? value) : value,
});

i18n
  .use(initReactI18next)
  .init({
    postProcess: ["viText"],
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
