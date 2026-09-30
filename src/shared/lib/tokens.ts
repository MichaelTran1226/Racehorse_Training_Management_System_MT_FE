// Lưu cặp JWT backend cấp (access token 15 phút + refresh token).
// "Remember me" => localStorage (còn sau khi đóng trình duyệt); không thì sessionStorage (mất khi đóng tab).

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const KEY = "equiflow.tokens";

function read(storage: Storage): TokenPair | null {
  try {
    const raw = storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TokenPair) : null;
  } catch {
    return null;
  }
}

export function getTokens(): TokenPair | null {
  return read(sessionStorage) ?? read(localStorage);
}

// `remember` bỏ trống = giữ nơi lưu hiện tại (dùng khi làm mới token).
export function saveTokens(tokens: TokenPair, remember?: boolean): void {
  const persist = remember ?? read(localStorage) !== null;
  clearTokens();
  (persist ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
}
