import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/shared/components/layout/AuthLayout";
import { formatDateTime } from "@/shared/lib/format";
import { useQueryParams } from "@/shared/lib/hooks";
import { verifyResetOtp } from "../api";
import { resetFlow } from "../flow";
import { OtpVerifyForm } from "../components/OtpVerifyForm";

// Bước 2 quên mật khẩu (design 1.5, đã đổi từ "link" sang "mã OTP"): nhập mã nhận được qua email.
export default function ResetOtpPage() {
  const navigate = useNavigate();
  const params = useQueryParams();
  const email = params?.get("email") ?? "";

  useEffect(() => {
    if (params && !email) navigate("/forgot-password", { replace: true });
  }, [params, email, navigate]);

  if (!email) return null;

  return (
    <AuthLayout title="Check the club mailbox." description={`If ${email} belongs to an account, a 6-digit code was sent to it. Enter the code below.`}>
      <OtpVerifyForm
        email={email}
        purpose="reset"
        sentTitle="Code sent"
        // Câu trung tính: không khẳng định email có tài khoản hay không.
        sentBody={(t) => `If the address is registered, the code was sent at ${formatDateTime(t.sentAt)}. It can be used once and expires at ${formatDateTime(t.expiresAt).split(" · ")[1]}.`}
        submitLabel="Verify code"
        onVerify={async (code) => {
          const result = await verifyResetOtp(email, code);
          resetFlow.set({ email, token: result.resetToken, expiresAt: result.expiresAt });
          navigate("/reset-password");
        }}
        footer={
          <>
            Wrong address? <Link to="/forgot-password">Enter a different email</Link>
          </>
        }
      />
    </AuthLayout>
  );
}
