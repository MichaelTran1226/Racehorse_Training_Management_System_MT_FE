// Mã lỗi từ API → câu thông báo tiếng Anh dễ hiểu. Nêu điều kiện, không trách người dùng.

import { ApiError } from "@/shared/lib/api";
import { formatDateTime, formatTime } from "@/shared/lib/format";

export type AlertTone = "ok" | "warn" | "danger" | "info";

export interface AlertSpec {
  tone: AlertTone;
  icon: string;
  title: string;
  body: string;
}

const GENERIC: Record<string, string> = {
  NETWORK_ERROR: "The service did not answer. Check the connection and try again.",
  SERVICE_UNAVAILABLE: "The service did not answer. Nothing was changed. Try again in a moment.",
  EMAIL_TAKEN: "This email already has an account in the system.",
  ROLE_NOT_ALLOWED: "Only Horse Owner accounts can be requested here. Staff accounts are created by the Club Manager.",
  WEAK_PASSWORD: "Add an uppercase letter, a digit or a symbol.",
  CANNOT_LOCK_SELF: "You cannot lock your own account. Ask another Club Manager.",
  CANNOT_CHANGE_SELF: "You cannot do this to your own account. Ask another Club Manager.",
  CANNOT_DELETE_USED: "This account has been used, so it cannot be deleted. Deactivate it instead to keep its history.",
  INVALID_STATE: "The account changed in the meantime. Reload the list and try again.",
  OTP_COOLDOWN: "A new invitation was sent less than a minute ago. Wait a moment before sending another.",
  NOT_FOUND: "This account no longer exists. Reload the list.",
  LAST_MANAGER: "The club must keep at least one active Club Manager.",
  RESET_EXPIRED: "This reset session has expired. Request a new code.",
  FORBIDDEN: "This action is not part of your permissions.",
};

export function messageFor(err: unknown): string {
  if (err instanceof ApiError) return GENERIC[err.code] ?? err.message ?? "Something went wrong. Try again.";
  return "Something went wrong. Try again.";
}

// Câu lỗi cho ô nhập mã OTP.
export function otpMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return messageFor(err);
  const left = Number(err.data.attemptsLeft ?? 0);
  switch (err.code) {
    case "OTP_INVALID":
      return left > 0
        ? `The code is not correct. ${left} ${left === 1 ? "attempt" : "attempts"} left.`
        : "The code is not correct.";
    case "OTP_EXPIRED":
      return "This code has expired. Request a new one.";
    case "OTP_ATTEMPTS_EXCEEDED":
      return "Too many wrong codes. Request a new code to continue.";
    case "OTP_NOT_FOUND":
      return "No code is waiting for this address. Request a new one.";
    default:
      return messageFor(err);
  }
}

export interface LoginFailure {
  alert: AlertSpec;
  passwordError?: string;
  // Nút đăng nhập bị khóa + tooltip giải thích ai xử lý được.
  blockedReason?: string;
  footNote?: string;
  // Khóa tạm sau 5 lần sai: mốc (ms) server cho phép thử lại — trang đăng nhập đếm ngược tới đây.
  retryAt?: number;
  // Nút đi tiếp trong Alert: nhập OTP xác minh email / nhận lời mời.
  next?: "verifyEmail" | "acceptInvite";
}

// Kết quả đăng nhập thất bại (design 0.4 – 0.6) → nội dung Alert, nút và chú thích.
export function loginFailure(err: unknown): LoginFailure {
  if (!(err instanceof ApiError)) {
    return { alert: { tone: "danger", icon: "xCircle", title: "Sign-in failed", body: messageFor(err) } };
  }
  const d = err.data;
  const who = d.fullName ? `${d.fullName} · ${d.roleLabel}` : undefined;
  // Lý do Club Manager ghi khi khóa / từ chối / vô hiệu hóa (có thể trống).
  const reason = d.reason ? ` Reason: ${String(d.reason)}` : "";

  switch (err.code) {
    case "INVALID_CREDENTIALS": {
      // Không nói rõ sai email hay sai mật khẩu. Chỉ khi còn đúng 1 lần mới cảnh báo thêm (WorkFlow 1 §3.2).
      const left = Number(d.attemptsLeft ?? 0);
      return {
        alert: {
          tone: "danger",
          icon: "alert",
          title: "Email or password is incorrect",
          body:
            left === 1
              ? "Check both fields and try again. 1 attempt remaining before this account is temporarily locked."
              : "Check both fields and try again.",
        },
        passwordError: "Password is incorrect.",
        footNote: "Not sure of the password? Use Forgot password to set a new one",
      };
    }
    case "ATTEMPTS_EXCEEDED": {
      // Nội dung đếm ngược do trang đăng nhập dựng từ retryAt (thời gian lấy từ server, không tính ở client).
      const retryAt = d.retryAt ? Date.parse(String(d.retryAt)) : undefined;
      return {
        alert: {
          tone: "danger",
          icon: "alert",
          title: "Too many attempts",
          body: `Sign-in is paused for 15 minutes${retryAt ? ` (until ${formatTime(retryAt)})` : ""}. Use Forgot password to unlock it now.`,
        },
        retryAt,
      };
    }
    case "ACCOUNT_LOCKED":
      return {
        alert: {
          tone: "danger",
          icon: "ban",
          title: "Account is locked",
          body: `The Club Manager locked this account at ${d.lockedAt ? formatDateTime(String(d.lockedAt)) : "an earlier time"}. Contact support@equiflow.vn to have it unlocked.${reason}`,
        },
        blockedReason: "Only the Club Manager can unlock an account.",
        footNote: who,
      };
    case "ACCOUNT_PENDING":
      return {
        alert: {
          tone: "warn",
          icon: "clock",
          title: "Account is pending approval",
          body: `The request${d.requestCode ? ` ${String(d.requestCode)}` : ""} reached the Club Manager at ${d.requestedAt ? formatDateTime(String(d.requestedAt)) : "an earlier time"}. Quote this code when you contact the club; an email follows as soon as it is approved.`,
        },
        blockedReason: "The account works only after the Club Manager approves it.",
        footNote: who ? `${who}${d.requestCode ? ` · ${String(d.requestCode)}` : ""}` : undefined,
      };
    case "EMAIL_NOT_VERIFIED":
      return {
        alert: {
          tone: "warn",
          icon: "mail",
          title: "Email is not verified yet",
          body: "Enter the 6-digit code sent to this address to finish the sign-up request.",
        },
        blockedReason: "Verify the email with the code first.",
        footNote: who,
        next: "verifyEmail",
      };
    case "ACCOUNT_INVITED":
      return {
        alert: {
          tone: "info",
          icon: "mail",
          title: "Invitation not accepted yet",
          body: "Open the invitation email from the Club Manager and enter its code on the Accept invitation page to set a password.",
        },
        blockedReason: "The invitation must be accepted first.",
        footNote: who,
        next: "acceptInvite",
      };
    case "PENDING_INTAKE":
      return {
        alert: {
          tone: "warn",
          icon: "clock",
          title: "Waiting for horse intake",
          body: "The account becomes active once at least one horse is assigned to it at intake.",
        },
        blockedReason: "The Club Manager assigns a horse at intake first.",
        footNote: who,
      };
    case "ACCOUNT_INACTIVE":
      return {
        alert: {
          tone: "danger",
          icon: "ban",
          title: "Account is inactive",
          body: `This account was switched off. Contact support@equiflow.vn to reactivate it.${reason}`,
        },
        blockedReason: "Only the Club Manager can reactivate an account.",
        footNote: who,
      };
    case "ACCOUNT_REJECTED":
      return {
        alert: {
          tone: "danger",
          icon: "xCircle",
          title: "The request was declined",
          body: `The Club Manager declined this account request.${reason} Send a new request if the details were wrong.`,
        },
        blockedReason: "The request was declined by the Club Manager.",
        footNote: who,
      };
    default:
      return { alert: { tone: "danger", icon: "xCircle", title: "Sign-in failed", body: messageFor(err) } };
  }
}
