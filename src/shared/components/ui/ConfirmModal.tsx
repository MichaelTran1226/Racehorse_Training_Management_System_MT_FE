import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  title: string;
  subtitle?: string;
  tone?: "danger" | "warn";
  confirmLabel: string; // động từ + tân ngữ, không dùng "OK"
  cancelLabel: string; // nói việc giữ nguyên nghĩa là gì, không chỉ "Cancel"
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

// Cặp xác nhận cho hành động không hoàn tác: nêu hậu quả bằng số, nút phá hủy nằm bên phải.
export function ConfirmModal({ title, subtitle, tone = "danger", confirmLabel, cancelLabel, busy, onConfirm, onCancel, children }: ConfirmModalProps) {
  return (
    <Modal
      title={title}
      subtitle={subtitle}
      tone={tone}
      width={420}
      onClose={onCancel}
      foot={
        <>
          <Button tone="secondary" size="sm" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button tone={tone === "danger" ? "danger" : "primary"} size="sm" disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
