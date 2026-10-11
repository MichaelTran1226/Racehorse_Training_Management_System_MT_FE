// Chấm điểm mật khẩu 0–4 và bảng nhãn cho thanh độ mạnh (design 1.6 / 1.16).

export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/[0-9]/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(s, 4);
}

export type StrengthTone = "danger" | "warn" | "ok";

export interface Strength {
  label: string;
  value: number; // 0–100 cho ProgressBar
  tone: StrengthTone;
  hint: string;
}

const LEVELS: Strength[] = [
  { label: "Too weak", value: 8, tone: "danger", hint: "At least 8 characters with an uppercase letter, a digit and a special character." },
  { label: "Weak", value: 30, tone: "danger", hint: "Add an uppercase letter, a digit and a special character." },
  { label: "Fair", value: 55, tone: "warn", hint: "Acceptable. A longer passphrase is safer than a short complex one." },
  { label: "Strong", value: 80, tone: "ok", hint: "Good. Do not reuse a password from another system." },
  { label: "Very strong", value: 100, tone: "ok", hint: "Good. Do not reuse a password from another system." },
];

// Chưa gõ gì => mức "Too weak" (giống design).
export function strengthOf(pw: string): Strength {
  return LEVELS[pw ? scorePassword(pw) : 0];
}

// Luật chung cho mọi form đặt mật khẩu mới (giống BE common/utils/password.ts). Trả về câu lỗi hoặc "" nếu hợp lệ.
// Luật: ≥ 8 ký tự, có ít nhất 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt.
export function passwordError(pw: string): string {
  if (!pw) return "New password is required.";
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Add at least one uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Add at least one digit.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Add at least one special character.";
  return "";
}
