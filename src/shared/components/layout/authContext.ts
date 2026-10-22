import { createContext, useContext } from "react";
import type { AuthUser } from "@/shared/types/auth";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  expired: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  markExpired: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Dùng trong các trang nằm SAU AppShell (đã chắc chắn có người đăng nhập).
export function useCurrentUser(): AuthUser {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser needs a signed-in user");
  return user;
}
