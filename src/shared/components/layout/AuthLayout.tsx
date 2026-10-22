import type { ReactNode } from "react";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";
import { LanguageToggle } from "@/shared/components/ui/LanguageToggle";
import { useAppLanguage } from "@/shared/lib/language";
import { BRAND } from "@/shared/lib/brand";
import { cx } from "@/shared/lib/cx";
import styles from "./AuthLayout.module.css";

import type { Hero } from "./authHeroes";
import { HERO_DEFAULT } from "./authHeroes";

interface AuthLayoutProps {
  title: string; // câu hoàn chỉnh, kết bằng dấu chấm
  description?: string;
  hero?: Hero;
  compact?: boolean; // form dài (Sign Up): giảm padding dọc
  children: ReactNode;
}

// Khung 2 cột chuẩn của mọi màn public (design Phase 0 · 1a): cột form 660px + ảnh editorial.
// Dưới 980px xếp dọc: dải ảnh 186px ở trên, form ở dưới.
export function AuthLayout({ title, description, hero = HERO_DEFAULT, compact, children }: AuthLayoutProps) {
  const { t, lang } = useAppLanguage();

  return (
    <div className={styles.page}>
      <section className={cx(styles.formPane, compact && styles.compact)}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <img src={BRAND.logo} alt={BRAND.name} width={32} height={32} />
            <div>
              <strong>{BRAND.shortName}</strong>
              <span>{BRAND.fullName}</span>
            </div>
          </div>
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <main className={styles.column}>
          <p className={styles.eyebrow}>{t("auth.loginEyebrow", "CLUB WORKSPACE")}</p>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
          <div className={styles.body} key={lang}>
            {children}
          </div>
        </main>

        <p className={styles.support}>
          {t("auth.clubSupport", "Club support")}: {BRAND.supportEmail} · {BRAND.supportPhone}
        </p>
      </section>

      <aside className={styles.hero} aria-hidden="true">
        <img
          src="/images/equine-editorial.webp"
          alt=""
          className={styles.photo}
        />
        <div className={styles.scrim} />
        <div className={styles.heroDesktop}>
          <p>{hero.eyebrow}</p>
          <strong>
            {hero.lines[0]}
            <br />
            {hero.lines[1]}
          </strong>
          <span>{hero.body}</span>
        </div>
        <div className={styles.heroMobile}>
          <div className={styles.mobileBrand}>
            <img src={BRAND.logo} alt="" width={26} height={26} />
            <strong>{BRAND.name}</strong>
          </div>
          <p>{BRAND.fullName}</p>
          <strong>{BRAND.tagline}</strong>
        </div>
      </aside>
    </div>
  );
}
