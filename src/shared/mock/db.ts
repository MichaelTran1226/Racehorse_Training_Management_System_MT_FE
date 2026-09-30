// "Cơ sở dữ liệu" giả nằm trong localStorage của trình duyệt, để thay đổi (duyệt, khóa, đổi quyền...)
// còn nguyên khi chuyển trang hoặc tải lại. Xóa key này (hoặc gọi resetDb) để về dữ liệu ban đầu.
// Mỗi lần gọi getDb() đọc lại từ localStorage => hai tab thấy dữ liệu của nhau.
// getDb() cũng tự xóa và gieo lại khi SEED_VERSION trong accounts.ts đổi, để mỗi lần
// sửa danh sách tài khoản mẫu, ai đang mở web (dữ liệu cũ trong localStorage) cũng thấy ngay.

import { seedAccounts, SEED_VERSION } from "@/shared/mock/accounts";
import type { Account, PublicAccount } from "@/shared/types/auth";

const KEY = "equiflow.mock.db.v1";

export type OtpPurpose = "signup" | "reset" | "invite";

export interface OtpRecord {
  email: string;
  purpose: OtpPurpose;
  code: string;
  sentAt: number;
  expiresAt: number;
  resendAt: number;
  attempts: number;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface PermissionRequest {
  id: number;
  at: string;
  accountId: string;
  screen: string;
  reference: string;
  status: "OPEN" | "GRANTED" | "DISMISSED";
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface Db {
  seedVersion: number;
  accounts: Account[];
  otps: OtpRecord[];
  loginFails: Record<string, { fails: number; lockedUntil: number }>;
  resetTokens: Record<string, { email: string; expiresAt: number }>;
  audit: AuditEntry[];
  requests: PermissionRequest[];
  seq: number; // số thứ tự cho mã yêu cầu REQ-YYMM-NNN
}

function fresh(): Db {
  return {
    seedVersion: SEED_VERSION, accounts: seedAccounts(), otps: [], loginFails: {},
    resetTokens: {}, audit: [], seq: 14,
    // Một yêu cầu cấp quyền đang chờ (giống seed của backend).
    requests: [{ id: 1, at: "2026-09-19T07:30:00", accountId: "nam", screen: "Audit Log", reference: "403-2609-0071", status: "OPEN", resolvedAt: null, resolvedBy: null }],
  };
}

export function getDb(): Db {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as Db;
      if (db.seedVersion === SEED_VERSION) return db;
    }
  } catch {
    // dữ liệu hỏng hoặc bị chặn: dùng dữ liệu mới
  }
  return fresh();
}

export function saveDb(db: Db): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // bỏ qua: mock sẽ quay về dữ liệu ban đầu ở lần đọc sau
  }
}

export function resetDb(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
}

// Không bao giờ gửi mật khẩu xuống giao diện.
export function toPublic(account: Account): PublicAccount {
  const { password: _password, ...rest } = account;
  void _password;
  return rest;
}

export function audit(db: Db, actor: string, action: string, detail: string): void {
  db.audit.unshift({ at: new Date().toISOString(), actor, action, detail });
  db.audit = db.audit.slice(0, 200);
}
