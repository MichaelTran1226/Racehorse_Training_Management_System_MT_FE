import { createContext, useContext, useEffect } from "react";

// Cho trang con "gắn thêm" một đoạn cuối vào breadcrumb (ví dụ tên tài khoản đang xem quyền).
// AppShell cung cấp hàm setTail; trang gọi useBreadcrumbTail(name).
export const BreadcrumbContext = createContext<(tail: string | undefined) => void>(() => {});

export function useBreadcrumbTail(tail: string | undefined): void {
  const setTail = useContext(BreadcrumbContext);
  useEffect(() => {
    setTail(tail);
    return () => setTail(undefined);
  }, [tail, setTail]);
}
