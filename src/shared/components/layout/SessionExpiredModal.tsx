import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";

// WorkFlow 1 §5: hộp thoại KHÔNG đóng được (không Esc, không nhấp nền, không nút X) — một nút duy nhất
// "Sign in again": xóa phiên phía trình duyệt, về trang đăng nhập và nhớ trang đang đứng (?next=) để quay lại.
// AuthProvider chỉ bật hộp này một lần dù nhiều request cùng trả 401.
export function SessionExpiredModal() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [busy, setBusy] = useState(false);

  async function onSignInAgain() {
    setBusy(true);
    const here = pathname + search;
    await signOut(); // server đã quên phiên; lời gọi này chỉ để xóa cookie, lỗi cũng bỏ qua
    navigate(`/login?next=${encodeURIComponent(here)}`, { replace: true });
  }

  return (
    <Modal
      title="The session has expired"
      subtitle="Signed out after 30 minutes without activity, or the account was changed by the Club Manager."
      tone="warn"
      width={430}
      foot={
        <Button iconAfter="arrowRight" disabled={busy} onClick={onSignInAgain} data-autofocus>
          {busy ? "Opening sign-in…" : "Sign in again"}
        </Button>
      }
    >
      Nothing on this page was sent to the server after the session closed. Sign in again to come back to this page.
    </Modal>
  );
}
