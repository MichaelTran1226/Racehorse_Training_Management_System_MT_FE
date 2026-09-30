// Hàm gọi API đăng nhập/đăng xuất và hỏi "tôi là ai". Trạng thái phiên nằm ở AuthProvider.

import { api } from "@/shared/lib/api";
import type { AuthUser } from "@/shared/types/auth";

export async function login(email: string, password: string, remember: boolean): Promise<AuthUser> {
  const res = await api<{ user: AuthUser }>("POST", "/auth/login", { email, password, remember });
  return res.user;
}

export async function logout(): Promise<void> {
  await api<{ ok: true }>("POST", "/auth/logout");
}

// silent = true: lúc mở trang mà chưa đăng nhập thì 401 là bình thường, không mở Session Expired.
// silent = false: kiểm tra lại giữa phiên; 401 nghĩa là phiên đã hết (hoặc tài khoản vừa bị khóa).
export async function fetchMe(silent = false): Promise<AuthUser> {
  const res = await api<{ user: AuthUser }>("GET", "/auth/me", undefined, { silent });
  return res.user;
}
