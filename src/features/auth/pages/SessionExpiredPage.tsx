import { useEffect } from "react";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";

import { tr } from "@/shared/i18n/tr";
// Trang xem thử Session Expired (design 1.14): mở hộp thoại ngay khi vào.
// Trong thực tế hộp thoại này xuất hiện sau 30 phút không thao tác, khi API trả 401,
// hoặc ngay khi Club Manager khóa tài khoản / thu hồi quyền của màn hình đang mở.
export default function SessionExpiredPage() {
  const { markExpired, status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") markExpired();
  }, [status, markExpired]);

  return (
    <>
      <PageHeader title={tr("The session has expired.")} showDate />
      <Card title={tr("Review page")} subtitle={tr("Shown behind the expiry dialog")}>
        <p style={{ margin: 0, fontSize: "var(--fs-caption)", color: "var(--muted)" }}>
          {tr("The dialog above has no close control: the choice must be made. Signing in again keeps you on this screen; leaving returns to the sign-in page.")}
        </p>
      </Card>
    </>
  );
}
