import type { ReactNode } from "react";
import { ToastProvider } from "@/shared/components/ui/Toast";
import { AuthProvider } from "./AuthProvider";

// Gom mọi "provider" toàn cục ở một chỗ. src/app/router.tsx bọc <Providers> quanh mọi trang.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
