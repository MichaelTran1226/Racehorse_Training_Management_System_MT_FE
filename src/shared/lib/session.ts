// Lưu "phiên đăng nhập" phía trình duyệt CHO CHẾ ĐỘ MOCK.
// Khi có backend thật, phiên nằm trong cookie do server set và file này không còn được dùng.
// remember = true  => localStorage (còn sau khi đóng trình duyệt)
// remember = false => sessionStorage (mất khi đóng tab)

const KEY = "equiflow.session";

export interface StoredSession {
  accountId: string;
  remember: boolean;
}

export function readSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function writeSession(accountId: string, remember: boolean): void {
  try {
    clearSession();
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(KEY, JSON.stringify({ accountId, remember } satisfies StoredSession));
  } catch {
    // Trình duyệt chặn storage: bỏ qua, người dùng sẽ phải đăng nhập lại.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
}
