// CỔNG DUY NHẤT gọi backend. Trang và component KHÔNG gọi fetch trực tiếp.
//  - NEXT_PUBLIC_USE_MOCK=true  => chuyển sang src/shared/mock/ (dữ liệu giả)
//  - ngược lại                  => fetch tới NEXT_PUBLIC_API_URL, gửi kèm cookie phiên
//  - 401 (UNAUTHENTICATED)      => mở modal Session Expired
//  - 403 (FORBIDDEN)            => chuyển tới trang 403

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

    const res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, payload?.code ?? "UNKNOWN", payload?.message, payload?.data ?? {});
    }
    return payload as T;
  } catch (err) {
    const error = err instanceof ApiError ? err : new ApiError(0, "NETWORK_ERROR", "Network error");
    if (!options.silent) {
      if (error.status === 401 && error.code === "UNAUTHENTICATED") handlers.onUnauthorized?.();
      if (error.code === "FORBIDDEN") handlers.onForbidden?.();
    }
    throw error;
  }
}
