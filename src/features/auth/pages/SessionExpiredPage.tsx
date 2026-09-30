import { useEffect } from "react";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";

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
      <PageHeader eyebrow="SESSION" title="The session has expired." showDate />
      <Card title="Review page" subtitle="Shown behind the expiry dialog">
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          The dialog above has no close control: the choice must be made. Signing in again keeps you on this screen; leaving returns to the sign-in page.
        </p>
      </Card>
    </>
  );
}
