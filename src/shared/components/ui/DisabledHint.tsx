import type { ReactNode } from "react";
import { Tooltip } from "./Tooltip";
import { trNode } from "@/shared/i18n/tr";

interface DisabledHintProps {
  reason?: string;
  block?: boolean;
  children: ReactNode;
}

// Quy tắc dự án: điều khiển bị chặn quyền thì HIỆN NGUYÊN, disable + giải thích lý do (không ẩn).
// Không có `reason` => không bọc gì cả.
export function DisabledHint({ reason, block, children }: DisabledHintProps) {
  if (!reason) return <>{children}</>;
  return (
    <Tooltip label={trNode(reason)} block={block}>
      {children}
    </Tooltip>
  );
}
