import { useState } from "react";
import { useAppLanguage } from "@/shared/lib/language";
import { triggerCalmWaterRipple } from "@/shared/lib/waterRipple";
import { Icon } from "./Icon";
import { cx } from "@/shared/lib/cx";
import styles from "./LanguageToggle.module.css";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { lang, toggleLanguage } = useAppLanguage();
  const nextLangLabel = lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt";
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // 1. Giọt nước rơi từ trên xuống tâm màn hình tĩnh lặng (0 - 300ms)
    // 2. Đúng khoảnh khắc giọt nước chạm mặt nước và đợt sóng đầu tiên bắt đầu loang ra (300ms),
    //    nội dung trang web mới chuyển đổi sang ngôn ngữ mới đồng bộ theo làn sóng!
    triggerCalmWaterRipple(() => {
      toggleLanguage();
      setTimeout(() => setIsTransitioning(false), 250);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cx(styles.langBtn, className)}
      aria-label={nextLangLabel}
      title={nextLangLabel}
      disabled={isTransitioning}
    >
      <Icon name="globe" size={15} className={styles.icon} />
      <span key={lang} className={styles.code}>{lang.toUpperCase()}</span>
    </button>
  );
}

