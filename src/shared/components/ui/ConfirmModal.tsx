import type { ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { tr, trNode } from "@/shared/i18n/tr";
import styles from "./Modal.module.css";

interface ConfirmModalProps {
  title: string;
  subtitle?: string;
  tone?: "danger" | "warn" | "info";
  callout?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  confirmIcon?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function ConfirmModal({
  title,
  subtitle,
  tone = "danger",
  callout,
  confirmLabel,
  cancelLabel,
  confirmIcon,
  busy,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  const isDanger = tone === "danger";
  const isWarn = tone === "warn";

  const iconName = isDanger ? (confirmIcon || "trash") : "alert";
  const iconBg = isDanger ? "#fee2e2" : "#fef3c7";
  const iconColor = isDanger ? "#dc2626" : "#d97706";

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        className={styles.dialog}
        style={{
          maxWidth: 480,
          borderRadius: "16px",
          padding: "24px 28px",
          background: "var(--surface)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Icon, Title, and Close */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: iconBg,
              color: iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={iconName} size={26} strokeWidth={2} />
          </div>

          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 750,
                  color: "var(--ink)",
                  lineHeight: 1.3,
                }}
              >
                {trNode(title)}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                aria-label={tr("Close")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  padding: 4,
                  margin: "-4px -8px 0 0",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {subtitle && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                  lineHeight: 1.5,
                }}
              >
                {trNode(subtitle)}
              </p>
            )}
          </div>
        </div>

        {/* Callout Alert Box (matching Image 1) */}
        {callout ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 10,
              fontSize: "0.875rem",
              color: "#92400e",
              lineHeight: 1.45,
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>{trNode(callout)}</div>
          </div>
        ) : null}

        {/* Optional Custom Children */}
        {children && <div style={{ marginBottom: 20 }}>{trNode(children)}</div>}

        {/* Footer Buttons (matching Image 1) */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
          <Button
            tone="secondary"
            onClick={onCancel}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            {trNode(cancelLabel)}
          </Button>

          <Button
            tone={isDanger ? "danger" : "primary"}
            disabled={busy}
            onClick={onConfirm}
            style={{
              padding: "9px 22px",
              borderRadius: 8,
              fontWeight: 650,
              fontSize: "0.875rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: isDanger ? "#dc2626" : undefined,
              borderColor: isDanger ? "#dc2626" : undefined,
            }}
          >
            {isDanger && <Icon name="trash" size={16} />}
            {isWarn && <Icon name="alert" size={16} />}
            {busy ? tr("Processing...") : trNode(confirmLabel)}
          </Button>
        </div>
      </div>
    </div>
  );
}
