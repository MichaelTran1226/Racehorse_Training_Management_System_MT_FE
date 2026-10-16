import { useTranslation } from "react-i18next";
import { changeAppLanguage, type SupportedLanguage } from "@/shared/i18n";

export function useAppLanguage() {
  const { i18n, t } = useTranslation();
  const currentLang = (i18n.language === "vi" ? "vi" : "en") as SupportedLanguage;

  const setLanguage = (lang: SupportedLanguage) => {
    changeAppLanguage(lang);
  };

  const toggleLanguage = () => {
    const next: SupportedLanguage = currentLang === "vi" ? "en" : "vi";
    changeAppLanguage(next);
  };

  return {
    lang: currentLang,
    isVietnamese: currentLang === "vi",
    setLanguage,
    toggleLanguage,
    t,
  };
}

export { isVietnamese } from "@/shared/i18n/tr";
