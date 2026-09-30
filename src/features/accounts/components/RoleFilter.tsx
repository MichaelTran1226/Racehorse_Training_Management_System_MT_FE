import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/Button";
import { cx } from "@/shared/lib/cx";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import { ROLES } from "@/shared/types/auth";
import type { Role } from "@/shared/types/auth";
import styles from "./RoleFilter.module.css";

interface RoleFilterProps {
  value: Role | "ALL";
  onChange: (value: Role | "ALL") => void;
}

// Nút "Filter by role" mở một menu nhỏ; đóng khi chọn, nhấn Esc hoặc bấm ra ngoài.
export function RoleFilter({ value, onChange }: RoleFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options: Array<{ value: Role | "ALL"; label: string }> = [
    { value: "ALL", label: "All roles" },
    ...ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] })),
  ];

  return (
    <div ref={rootRef} className={styles.root}>
      <Button
        tone={value === "ALL" ? "secondary" : "quiet"}
        size="sm"
        icon="filter"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {value === "ALL" ? "Filter by role" : `Role: ${ROLE_LABEL[value]}`}
      </Button>
      {open && (
        <div role="menu" className={styles.menu}>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={o.value === value}
              className={cx(styles.item, o.value === value && styles.on)}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
