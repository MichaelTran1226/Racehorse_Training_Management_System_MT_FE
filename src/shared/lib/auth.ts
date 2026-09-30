// Hàm gọi API đăng nhập/đăng xuất và hỏi "tôi là ai". Trạng thái phiên nằm ở AuthProvider.

import { api } from "@/shared/lib/api";
import { clearTokens, getTokens, saveTokens, type TokenPair } from "@/shared/lib/tokens";
import type { AuthUser } from "@/shared/types/auth";

// Backend thật trả kèm cặp JWT; mock chỉ trả { user }.
type LoginResponse = { user: AuthUser } & Partial<TokenPair>;

export async function login(email: string, password: string, remember: boolean): Promise<AuthUser> {
  const res = await api<LoginResponse>("POST", "/auth/login", { email, password, remember });
  if (res.accessToken && res.refreshToken) {
    saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken }, remember);
  }
  return res.user;
}

export async function logout(): Promise<void> {
  try {
    // Thu hồi refresh token ở backend (mock bỏ qua body).
    await api<unknown>("POST", "/auth/logout", { refreshToken: getTokens()?.refreshToken });
  } finally {
    clearTokens();
  }
}

// silent = true: lúc mở trang mà chưa đăng nhập thì 401 là bình thường, không mở Session Expired.
// silent = false: kiểm tra lại giữa phiên; 401 nghĩa là phiên đã hết (hoặc tài khoản vừa bị khóa).
export async function fetchMe(silent = false): Promise<AuthUser> {
  // Backend thật trả thẳng hồ sơ; mock trả { user }.
  const res = await api<AuthUser | { user: AuthUser }>("GET", "/auth/me", undefined, { silent });
  return "user" in res ? res.user : res;
}
