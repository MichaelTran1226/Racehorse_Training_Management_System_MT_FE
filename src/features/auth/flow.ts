// Lưu tạm dữ liệu giữa các bước của một luồng nhiều màn hình (đăng ký, quên mật khẩu).
// Dùng sessionStorage: mất khi đóng tab, không rơi vào URL. KHÔNG lưu mật khẩu ở đây.

import type { RegistrationResult } from "./types";

const SIGNUP_KEY = "equiflow.flow.signup";
const RESET_KEY = "equiflow.flow.reset";

export interface ResetFlow {
  email: string;
  token: string;
  expiresAt: number;
  // "invite" = nhân viên đặt mật khẩu lần đầu từ lời mời (mặc định: quên mật khẩu).
  kind?: "reset" | "invite";
  fullName?: string;
}

function read<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // bỏ qua: bước sau sẽ đưa người dùng quay lại bước đầu
  }
}

function clear(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // bỏ qua
  }
}

export const signupFlow = {
  get: () => read<RegistrationResult>(SIGNUP_KEY),
  set: (value: RegistrationResult) => write(SIGNUP_KEY, value),
  clear: () => clear(SIGNUP_KEY),
};

export const resetFlow = {
  get: () => read<ResetFlow>(RESET_KEY),
  set: (value: ResetFlow) => write(RESET_KEY, value),
  clear: () => clear(RESET_KEY),
};

// Chỉ cho phép chuyển hướng tới đường dẫn nội bộ (chặn ?next=https://trang-la.com).
export function safeNext(value: string | null | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}
