// CỔNG DUY NHẤT gọi backend. Trang và component KHÔNG gọi fetch trực tiếp.
//  - VITE_USE_MOCK=true         => chuyển sang src/shared/mock/ (dữ liệu giả)
//  - ngược lại                  => fetch tới VITE_API_URL, gửi kèm "Authorization: Bearer <access token>"
//  - backend bọc kết quả trong { success, data } => trả về phần data
//  - 401 (UNAUTHENTICATED)      => thử làm mới token một lần; vẫn lỗi thì mở modal Session Expired
//  - 403 (FORBIDDEN)            => chuyển tới trang 403

import { clearTokens, getTokens, saveTokens } from "@/shared/lib/tokens";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
    public data: Record<string, unknown> = {},
  ) {
    super(message ?? code);
    this.name = "ApiError";
  }
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const API_URL = import.meta.env.VITE_API_URL ?? "";

interface ApiHandlers {
  onUnauthorized?: () => void;
  onForbidden?: () => void;
}

let handlers: ApiHandlers = {};

// AuthProvider đăng ký hàm xử lý 401/403 một lần khi khởi động.
export function registerApiHandlers(next: ApiHandlers): void {
  handlers = next;
}

interface ApiOptions {
  // true = không kích hoạt xử lý 401/403 chung (dùng cho lần hỏi "tôi là ai" lúc mở trang).
  silent?: boolean;
}

export async function api<T>(method: HttpMethod, path: string, body?: unknown, options: ApiOptions = {}): Promise<T> {
  try {
    if (USE_MOCK) {
      // import() động: mã mock chỉ được nạp khi thật sự chạy chế độ mock.
      const { handleMock } = await import("@/shared/mock/handlers");
      return (await handleMock(method, path, body)) as T;
    }

    try {
      return await request<T>(method, path, body);
    } catch (err) {
      // Access token hết hạn (15 phút) => đổi refresh token lấy cặp mới rồi gọi lại đúng một lần.
      if (err instanceof ApiError && err.status === 401 && err.code === "UNAUTHENTICATED" && (await refreshTokens())) {
        return await request<T>(method, path, body);
      }
      throw err;
    }
  } catch (err) {
    const error = err instanceof ApiError ? err : new ApiError(0, "NETWORK_ERROR", "Network error");
    if (!options.silent) {
      if (error.status === 401 && error.code === "UNAUTHENTICATED") handlers.onUnauthorized?.();
      if (error.code === "FORBIDDEN") handlers.onForbidden?.();
    }
    throw error;
  }
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const accessToken = getTokens()?.accessToken;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    // Lỗi từ backend: { success: false, code, message, data }
    const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
    throw new ApiError(res.status, payload?.code ?? "UNKNOWN", message, payload?.data ?? {});
  }
  return (payload && typeof payload === "object" && "success" in payload && "data" in payload ? payload.data : payload) as T;
}

// Dùng chung một lần làm mới cho các request 401 xảy ra cùng lúc.
let refreshing: Promise<boolean> | null = null;

function refreshTokens(): Promise<boolean> {
  const refreshToken = getTokens()?.refreshToken;
  if (!refreshToken) return Promise.resolve(false);
  refreshing ??= request<{ accessToken: string; refreshToken: string }>("POST", "/auth/refresh", { refreshToken })
    .then((tokens) => {
      saveTokens(tokens);
      return true;
    })
    .catch(() => {
      clearTokens();
      return false;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}
