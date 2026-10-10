// Giả lập backend REST. lib/api.ts gọi handleMock() khi NEXT_PUBLIC_USE_MOCK=true.
// Mỗi route trả dữ liệu hoặc ném ApiError(status, code, ...) giống backend thật sẽ làm,
// nhờ vậy khi đổi sang backend thật, giao diện không phải sửa.
//
// Mã OTP demo luôn là 123456 (hiệu lực 10 phút, gửi lại sau 60 giây, sai tối đa 5 lần).

import { ApiError } from "@/shared/lib/api";
import type { HttpMethod } from "@/shared/lib/api";
import { passwordError } from "@/shared/lib/password";
import { defaultNotify, defaultPermissions, normalizePermissions, notifyLock, PERMISSIONS, ROLE_LABEL } from "@/shared/lib/permissions";
import { clearSession, readSession, writeSession } from "@/shared/lib/session";
import { audit, getDb, saveDb, toPublic } from "@/shared/mock/db";
import type { Db, OtpPurpose, OtpRecord } from "@/shared/mock/db";
import type { Account, NotifyKey, PermissionKey, PermissionMap, Role } from "@/shared/types/auth";
import { buildMockProfile, getMockMedicalStore, saveMockMedicalStore } from "@/shared/mock/medicalData";
import {
  getStoredHorses,
  addStoredHorse,
  deleteStoredHorse,
  saveStoredHorses,
  getStoredLocks,
  placeHorseTrainingLock,
  liftHorseTrainingLock,
  extendHorseTrainingLock,
} from "@/shared/mock/horsesData";
import type { FollowUpItem, MedicalRecord, PrescriptionItem, TreatmentPhase } from "@/features/health/types";

const OTP_CODE = "123456";
const OTP_TTL = 10 * 60 * 1000;
const INVITE_TTL = 48 * 3600 * 1000; // mã mời nhân viên còn hạn 48 giờ
const OTP_COOLDOWN = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK = 15 * 60 * 1000;
const PASSWORD_MAX_AGE_DAYS = 180;
const EMAIL_RE = /^[^\s@]+@gmail\.com$/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const norm = (email: unknown) => String(email ?? "").trim().toLowerCase();

interface Ctx {
  db: Db;
  url: URL;
  body: Record<string, unknown>;
  params: string[];
}

interface Route {
  method: HttpMethod;
  pattern: RegExp;
  handler: (ctx: Ctx) => unknown | Promise<unknown>;
}

// ------------------------------------------------------------------ tiện ích dùng chung

function currentUser(db: Db): Account {
  const session = readSession();
  const user = session ? db.accounts.find((a) => a.id === session.accountId) : undefined;
  // Tài khoản bị khóa/vô hiệu giữa chừng => phiên coi như hết hạn ngay.
  if (!user || user.status !== "ACTIVE") {
    clearSession();
    throw new ApiError(401, "UNAUTHENTICATED", "Session expired");
  }
  return user;
}

function requirePermission(user: Account, key: PermissionKey): void {
  if (!user.permissions[key]) throw new ApiError(403, "FORBIDDEN", "Not allowed");
}

function findAccount(db: Db, id: string): Account {
  const account = db.accounts.find((a) => a.id === id);
  if (!account) throw new ApiError(404, "NOT_FOUND", "Account not found");
  return account;
}

function issueOtp(db: Db, email: string, purpose: OtpPurpose): OtpRecord {
  const now = Date.now();
  const record: OtpRecord = {
    email, purpose, code: OTP_CODE, sentAt: now, expiresAt: now + (purpose === "invite" ? INVITE_TTL : OTP_TTL),
    resendAt: now + OTP_COOLDOWN, attempts: 0,
  };
  db.otps = db.otps.filter((o) => !(o.email === email && o.purpose === purpose));
  db.otps.push(record);
  return record;
}

function otpTimes(r: OtpRecord) {
  return { sentAt: r.sentAt, expiresAt: r.expiresAt, resendAt: r.resendAt };
}

// `valid` = false khi email không tồn tại: vẫn trả lỗi y như nhập sai mã (không lộ email có tồn tại hay không).
function checkOtp(db: Db, email: string, purpose: OtpPurpose, code: string, valid = true): void {
  const record = db.otps.find((o) => o.email === email && o.purpose === purpose);
  if (!record) throw new ApiError(404, "OTP_NOT_FOUND", "No code");
  if (Date.now() > record.expiresAt) throw new ApiError(400, "OTP_EXPIRED", "Code expired");
  if (record.attempts >= OTP_MAX_ATTEMPTS) throw new ApiError(429, "OTP_ATTEMPTS_EXCEEDED", "Too many attempts");
  if (!valid || code !== record.code) {
    record.attempts += 1;
    saveDb(db);
    const left = OTP_MAX_ATTEMPTS - record.attempts;
    if (left <= 0) throw new ApiError(429, "OTP_ATTEMPTS_EXCEEDED", "Too many attempts");
    throw new ApiError(400, "OTP_INVALID", "Wrong code", { attemptsLeft: left });
  }
  db.otps = db.otps.filter((o) => o !== record);
}

function requestCode(db: Db): string {
  const now = new Date();
  db.seq += 1;
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `REQ-${yy}${mm}-${String(db.seq).padStart(3, "0")}`;
}

function purposeOf(value: unknown): OtpPurpose {
  return value === "signup" || value === "invite" ? value : "reset";
}

const REASON_MAX = 300;

function reasonOf(body: Record<string, unknown>): string | null {
  const reason = String(body.reason ?? "").trim();
  if (reason.length > REASON_MAX) throw new ApiError(400, "VALIDATION", `Reason must be at most ${REASON_MAX} characters.`, { field: "reason" });
  return reason || null;
}

// Không tự khóa / vô hiệu hóa chính mình; CLB luôn còn ít nhất 1 Club Manager hoạt động.
function assertCanRemove(db: Db, actor: Account, target: Account, selfCode: string): void {
  if (target.id === actor.id) throw new ApiError(409, selfCode, "Not allowed on your own account");
  const activeManagers = db.accounts.filter((a) => a.role === "CLUB_MANAGER" && a.status === "ACTIVE");
  if (target.role === "CLUB_MANAGER" && target.status === "ACTIVE" && activeManagers.length <= 1) {
    throw new ApiError(409, "LAST_MANAGER", "Last manager");
  }
}

// Chỉ xóa hẳn tài khoản chưa từng hoạt động; tài khoản đã dùng thì vô hiệu hóa.
const DELETABLE: Account["status"][] = ["INVITED", "PENDING_EMAIL", "REJECTED"];

// ------------------------------------------------------------------ các route

const routes: Route[] = [
  {
    method: "GET", pattern: /^\/audit-logs$/,
    handler: ({ db, url }) => {
      requirePermission(currentUser(db), "viewAudit");
      const q = url.searchParams;
      const page = Number(q.get("page") ?? 1), pageSize = Number(q.get("pageSize") ?? 20);
      const from = q.get("from"), to = q.get("to");
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
          (from && !Number.isFinite(Date.parse(from))) || (to && !Number.isFinite(Date.parse(to))) ||
          (from && to && Date.parse(from) > Date.parse(to))) throw new ApiError(400, "VALIDATION", "Invalid audit filters");
      const logs = db.audit.map((entry, index) => {
        const user = db.accounts.find(a => a.fullName === entry.actor || (entry.actor.includes("Tran") && a.id === "viet"));
        return { id: `demo-${entry.at}-${db.audit.length - index}`, userId: user?.id ?? null, actor: entry.actor, action: entry.action,
          entityName: "DemoActivity", entityId: null, oldValuesJson: null,
          newValuesJson: JSON.stringify({ actor: entry.actor, detail: entry.detail }), ipAddress: null, userAgent: null,
          timestamp: entry.at, user: user ? { id: user.id, fullName: user.fullName } : null };
      }).filter(entry => {
        const actorFilter = q.get("actor")?.toLowerCase().trim();
        if (actorFilter) {
          const nameMatch = entry.user?.fullName.toLowerCase().includes(actorFilter);
          const rawActorMatch = entry.actor.toLowerCase().includes(actorFilter);
          const legacyMatch = (actorFilter === "việt" || actorFilter === "viet") && (entry.user?.id === "viet" || entry.actor.toLowerCase().includes("tran"));
          if (!nameMatch && !rawActorMatch && !legacyMatch) return false;
        }
        if (q.get("userId") && entry.userId !== q.get("userId")) return false;
        if (q.get("action") && entry.action !== q.get("action")) return false;
        if (q.get("entityName") && entry.entityName !== q.get("entityName")) return false;
        if (from && Date.parse(entry.timestamp) < Date.parse(from)) return false;
        if (to && Date.parse(entry.timestamp) > Date.parse(to)) return false;
        return true;
      })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp) || b.id.localeCompare(a.id));
      return { logs: logs.slice((page - 1) * pageSize, page * pageSize), total: logs.length, page, pageSize };
    },
  },
  // ----- đăng nhập / phiên -----
  {
    method: "POST",
    pattern: /^\/auth\/login$/,
    async handler({ db, body }) {
      await sleep(650); // để thấy trạng thái "Signing in…" (design 0.2)
      const email = norm(body.email);
      const password = String(body.password ?? "");
      const now = Date.now();
      const attempt = db.loginFails[email] ?? { fails: 0, lockedUntil: 0 };

      if (attempt.lockedUntil > now) {
        throw new ApiError(429, "ATTEMPTS_EXCEEDED", "Too many attempts", { retryAt: new Date(attempt.lockedUntil).toISOString() });
      }

      const account = db.accounts.find((a) => a.email.toLowerCase() === email);
      if (!account || account.password !== password) {
        attempt.fails += 1;
        if (attempt.fails >= LOGIN_MAX_FAILS) {
          db.loginFails[email] = { fails: 0, lockedUntil: now + LOGIN_LOCK };
          audit(db, email || "anonymous", "LOGIN_LOCKED_OUT", "Too many wrong passwords");
          saveDb(db);
          throw new ApiError(429, "ATTEMPTS_EXCEEDED", "Too many attempts", { retryAt: new Date(now + LOGIN_LOCK).toISOString() });
        }
        db.loginFails[email] = attempt;
        audit(db, email || "anonymous", "LOGIN_FAILED", "Wrong email or password");
        saveDb(db);
        throw new ApiError(401, "INVALID_CREDENTIALS", "Wrong credentials", { attemptsLeft: LOGIN_MAX_FAILS - attempt.fails });
      }

      delete db.loginFails[email];
      const info = {
        fullName: account.fullName,
        roleLabel: ROLE_LABEL[account.role],
        lockedAt: account.lockedAt,
        requestedAt: account.requestedAt,
        requestCode: account.requestCode,
        reason: account.statusReason,
      };
      const blocked: Partial<Record<Account["status"], [number, string]>> = {
        LOCKED: [423, "ACCOUNT_LOCKED"],
        PENDING_APPROVAL: [403, "ACCOUNT_PENDING"],
        PENDING_EMAIL: [403, "EMAIL_NOT_VERIFIED"],
        PENDING_INTAKE: [403, "PENDING_INTAKE"],
        INVITED: [403, "ACCOUNT_INVITED"],
        INACTIVE: [403, "ACCOUNT_INACTIVE"],
        REJECTED: [403, "ACCOUNT_REJECTED"],
      };
      const block = blocked[account.status];
      if (block) {
        saveDb(db);
        throw new ApiError(block[0], block[1], "Account cannot sign in", info);
      }

      account.lastActive = new Date().toISOString();
      audit(db, account.fullName, "AUTH_LOGIN", "Signed in");
      saveDb(db);
      writeSession(account.id, Boolean(body.remember));
      return { user: toPublic(account) };
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/logout$/,
    handler({ db }) {
      const session = readSession();
      const user = session ? db.accounts.find((a) => a.id === session.accountId) : undefined;
      if (user) {
        audit(db, user.fullName, "AUTH_LOGOUT", "Signed out");
        saveDb(db);
      }
      clearSession();
      return { ok: true };
    },
  },
  {
    method: "GET",
    pattern: /^\/auth\/me$/,
    handler({ db }) {
      return { user: toPublic(currentUser(db)) };
    },
  },

  // ----- đăng ký + xác minh email bằng OTP -----
  {
    method: "POST",
    pattern: /^\/auth\/register$/,
    handler({ db, body }) {
      const email = norm(body.email);
      const fullName = String(body.fullName ?? "").trim();
      const role = body.role as Role;
      if (role !== "HORSE_OWNER") throw new ApiError(403, "ROLE_NOT_ALLOWED", "Only Horse Owner can self-register");
      if (!fullName || !EMAIL_RE.test(email) || String(body.password ?? "").length < 8) {
        throw new ApiError(400, "VALIDATION", "Invalid input");
      }
      const existing = db.accounts.find((a) => a.email.toLowerCase() === email);
      if (existing && existing.status !== "PENDING_EMAIL") throw new ApiError(409, "EMAIL_TAKEN", "Email taken");

      const account: Account = existing ?? {
        id: `u${Date.now()}`, fullName, email, role, status: "PENDING_EMAIL", password: "",
        phone: "", createdAt: new Date().toISOString(), lastActive: null, requestedAt: null, requestCode: null, lockedAt: null,
        invitedBy: null, statusReason: null, statusChangedAt: null, statusChangedBy: null,
        permissions: defaultPermissions(role), permissionsChangedAt: null,
        permissionsChangedBy: null, notify: defaultNotify(role),
      };
      account.fullName = fullName;
      account.password = String(body.password);
      account.requestCode = account.requestCode ?? requestCode(db);
      if (!existing) db.accounts.push(account);

      const record = issueOtp(db, email, "signup");
      audit(db, fullName, "REGISTER", `Sign-up request ${account.requestCode}`);
      saveDb(db);
      return { email, ...otpTimes(record) };
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/verify-email$/,
    handler({ db, body }) {
      const email = norm(body.email);
      const account = db.accounts.find((a) => a.email.toLowerCase() === email && a.status === "PENDING_EMAIL");
      checkOtp(db, email, "signup", String(body.code ?? ""), Boolean(account));
      if (!account) throw new ApiError(404, "OTP_NOT_FOUND", "No code");
      account.status = "PENDING_APPROVAL";
      account.requestedAt = new Date().toISOString();
      audit(db, account.fullName, "EMAIL_VERIFIED", `Request ${account.requestCode} sent for approval`);
      saveDb(db);
      const reviewer = db.accounts.find((a) => a.role === "CLUB_MANAGER" && a.status === "ACTIVE");
      return {
        email: account.email, fullName: account.fullName, role: account.role,
        requestCode: account.requestCode, requestedAt: account.requestedAt, reviewer: reviewer?.fullName ?? "the Club Manager",
      };
    },
  },
  {
    method: "GET",
    pattern: /^\/auth\/otp$/,
    handler({ db, url }) {
      const email = norm(url.searchParams.get("email"));
      const purpose = purposeOf(url.searchParams.get("purpose"));
      const record = db.otps.find((o) => o.email === email && o.purpose === purpose);
      if (!record) throw new ApiError(404, "OTP_NOT_FOUND", "No code");
      return otpTimes(record);
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/otp\/resend$/,
    handler({ db, body }) {
      const email = norm(body.email);
      const purpose = purposeOf(body.purpose);
      const existing = db.otps.find((o) => o.email === email && o.purpose === purpose);
      if (existing && existing.resendAt > Date.now()) {
        throw new ApiError(429, "OTP_COOLDOWN", "Wait before requesting a new code", { resendAt: existing.resendAt });
      }
      const record = issueOtp(db, email, purpose);
      saveDb(db);
      return otpTimes(record);
    },
  },

  // ----- quên mật khẩu bằng OTP -----
  {
    method: "POST",
    pattern: /^\/auth\/forgot-password$/,
    handler({ db, body }) {
      const email = norm(body.email);
      if (!EMAIL_RE.test(email)) throw new ApiError(400, "INVALID_EMAIL", "Invalid email");
      // Luôn trả kết quả giống nhau dù email có tồn tại hay không (thông báo trung tính).
      const existing = db.otps.find((o) => o.email === email && o.purpose === "reset" && o.resendAt > Date.now());
      const record = existing ?? issueOtp(db, email, "reset");
      if (!existing) {
        const account = db.accounts.find((a) => a.email.toLowerCase() === email);
        audit(db, account?.fullName ?? "anonymous", "PASSWORD_RESET_REQUESTED", "OTP issued");
        saveDb(db);
      }
      return { sent: true, ...otpTimes(record) };
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/reset-password\/verify$/,
    handler({ db, body }) {
      const email = norm(body.email);
      const account = db.accounts.find((a) => a.email.toLowerCase() === email);
      checkOtp(db, email, "reset", String(body.code ?? ""), Boolean(account));
      const token = `rt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      const expiresAt = Date.now() + OTP_TTL;
      db.resetTokens[token] = { email, expiresAt };
      saveDb(db);
      return { resetToken: token, expiresAt };
    },
  },
  {
    method: "POST",
    pattern: /^\/auth\/reset-password$/,
    handler({ db, body }) {
      const entry = db.resetTokens[String(body.resetToken ?? "")];
      if (!entry || entry.expiresAt < Date.now()) throw new ApiError(400, "RESET_EXPIRED", "Reset expired");
      const weak = passwordError(String(body.password ?? ""));
      if (weak) throw new ApiError(400, "WEAK_PASSWORD", weak);
      const account = db.accounts.find((a) => a.email.toLowerCase() === entry.email);
      if (!account) throw new ApiError(400, "RESET_EXPIRED", "Reset expired");
      account.password = String(body.password);
      delete db.resetTokens[String(body.resetToken)];
      db.loginFails[entry.email] = { fails: 0, lockedUntil: 0 };
      // Nhân viên được mời đặt mật khẩu lần đầu => kích hoạt tài khoản.
      const accepting = account.status === "INVITED";
      if (accepting) {
        account.status = "ACTIVE";
        account.statusReason = null;
        db.otps = db.otps.filter((o) => !(o.email === entry.email && o.purpose === "invite"));
        audit(db, account.fullName, "INVITE_ACCEPTED", "Password set; account is active");
      } else {
        audit(db, account.fullName, "PASSWORD_RESET", "Password changed with OTP");
      }
      saveDb(db);
      return { ok: true, activated: accepting };
    },
  },

  // ----- nhận lời mời (nhân viên): mã trong email mời → vé đặt mật khẩu -----
  {
    method: "POST",
    pattern: /^\/auth\/accept-invite\/verify$/,
    handler({ db, body }) {
      const email = norm(body.email);
      const invited = db.accounts.find((a) => a.email.toLowerCase() === email && a.status === "INVITED");
      checkOtp(db, email, "invite", String(body.code ?? ""), Boolean(invited));
      const token = `rt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      const expiresAt = Date.now() + OTP_TTL;
      db.resetTokens[token] = { email, expiresAt };
      saveDb(db);
      return { resetToken: token, expiresAt, fullName: invited?.fullName ?? "", role: invited?.role ?? null };
    },
  },

  // ----- quản lý tài khoản (chỉ ai có quyền manageAccounts) -----
  {
    method: "GET",
    pattern: /^\/accounts$/,
    handler({ db }) {
      requirePermission(currentUser(db), "manageAccounts");
      // Thêm ?mockError=1 vào URL trang để xem trạng thái lỗi tải danh sách (design 1.9f).
      if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("mockError")) {
        throw new ApiError(503, "SERVICE_UNAVAILABLE", "Service did not answer");
      }
      return { accounts: db.accounts.map(toPublic) };
    },
  },
  {
    method: "POST",
    pattern: /^\/accounts$/,
    handler({ db, body }) {
      const actor = currentUser(db);
      requirePermission(actor, "manageAccounts");
      const email = norm(body.email);
      const fullName = String(body.fullName ?? "").trim();
      const role = body.role as Role;
      if (!fullName || !EMAIL_RE.test(email) || !ROLE_LABEL[role] || role === "HORSE_OWNER") throw new ApiError(400, "VALIDATION", "Invalid input");
      if (db.accounts.some((a) => a.email.toLowerCase() === email)) throw new ApiError(409, "EMAIL_TAKEN", "Email taken");
      const account: Account = {
        id: `u${Date.now()}`, fullName, email, role, status: "INVITED", password: "", phone: "",
        createdAt: new Date().toISOString(), lastActive: null, requestedAt: null, requestCode: null, lockedAt: null,
        invitedBy: actor.fullName, statusReason: null, statusChangedAt: null, statusChangedBy: null,
        permissions: defaultPermissions(role), permissionsChangedAt: null, permissionsChangedBy: null,
        notify: defaultNotify(role),
      };
      db.accounts.push(account);
      issueOtp(db, email, "invite"); // backend thật gửi email kèm mã mời
      audit(db, actor.fullName, "ACCOUNT_INVITED", `${fullName} invited as ${ROLE_LABEL[role]}`);
      saveDb(db);
      return { account: toPublic(account) };
    },
  },
  {
    method: "GET",
    pattern: /^\/accounts\/([^/]+)$/,
    handler({ db, params }) {
      requirePermission(currentUser(db), "manageAccounts");
      return { account: toPublic(findAccount(db, params[0])) };
    },
  },
  {
    method: "POST",
    pattern: /^\/accounts\/([^/]+)\/(approve|decline|lock|unlock|deactivate|reactivate)$/,
    handler({ db, params, body }) {
      const actor = currentUser(db);
      requirePermission(actor, "manageAccounts");
      const target = findAccount(db, params[0]);
      const action = params[1];
      const reason = reasonOf(body);

      if (action === "approve" || action === "decline") {
        if (target.status !== "PENDING_APPROVAL") throw new ApiError(409, "INVALID_STATE", "Not waiting for approval");
        target.status = action === "approve" ? "ACTIVE" : "REJECTED";
        target.statusReason = action === "approve" ? null : reason;
      } else if (action === "lock") {
        if (target.status !== "ACTIVE") throw new ApiError(409, "INVALID_STATE", "Only an active account can be locked");
        assertCanRemove(db, actor, target, "CANNOT_LOCK_SELF");
        target.status = "LOCKED";
        target.lockedAt = new Date().toISOString();
        target.statusReason = reason;
      } else if (action === "unlock") {
        if (target.status !== "LOCKED") throw new ApiError(409, "INVALID_STATE", "Not locked");
        target.status = "ACTIVE";
        target.lockedAt = null;
        target.statusReason = null;
      } else if (action === "deactivate") {
        if (target.status !== "ACTIVE" && target.status !== "LOCKED") throw new ApiError(409, "INVALID_STATE", "Cannot deactivate");
        assertCanRemove(db, actor, target, "CANNOT_CHANGE_SELF");
        target.status = "INACTIVE";
        target.lockedAt = null;
        target.statusReason = reason;
      } else {
        if (target.status !== "INACTIVE") throw new ApiError(409, "INVALID_STATE", "Not inactive");
        target.status = "ACTIVE";
        target.statusReason = null;
      }
      target.statusChangedAt = new Date().toISOString();
      target.statusChangedBy = actor.fullName;
      audit(db, actor.fullName, `ACCOUNT_${action.toUpperCase()}`, reason ? `${target.fullName} — ${reason}` : target.fullName);
      saveDb(db);
      return { account: toPublic(target) };
    },
  },
  {
    method: "POST",
    pattern: /^\/accounts\/([^/]+)\/resend-invite$/,
    handler({ db, params }) {
      const actor = currentUser(db);
      requirePermission(actor, "manageAccounts");
      const target = findAccount(db, params[0]);
      if (target.status !== "INVITED") throw new ApiError(409, "INVALID_STATE", "Not an open invitation");
      const email = target.email.toLowerCase();
      const existing = db.otps.find((o) => o.email === email && o.purpose === "invite");
      if (existing && existing.resendAt > Date.now()) {
        throw new ApiError(429, "OTP_COOLDOWN", "Wait before requesting a new code", { resendAt: existing.resendAt });
      }
      const record = issueOtp(db, email, "invite");
      audit(db, actor.fullName, "INVITE_RESENT", target.fullName);
      saveDb(db);
      return { account: toPublic(target), ...otpTimes(record) };
    },
  },
  {
    method: "PUT",
    pattern: /^\/accounts\/([^/]+)$/,
    handler({ db, params, body }) {
      const actor = currentUser(db);
      requirePermission(actor, "manageAccounts");
      const target = findAccount(db, params[0]);
      const fullName = String(body.fullName ?? "").trim();
      const phone = String(body.phone ?? "").trim();
      if (!fullName) throw new ApiError(400, "VALIDATION", "Full name is required.", { field: "fullName" });
      if (phone.length > 30) throw new ApiError(400, "VALIDATION", "Phone number is too long.", { field: "phone" });
      const changes: string[] = [];
      if (fullName !== target.fullName) changes.push(`name ${target.fullName} → ${fullName}`);
      if (phone !== target.phone) changes.push(`phone ${target.phone || "—"} → ${phone || "—"}`);
      if (changes.length > 0) {
        audit(db, actor.fullName, "ACCOUNT_EDITED", `${target.fullName}: ${changes.join(", ")}`);
        target.fullName = fullName;
        target.phone = phone;
        saveDb(db);
      }
      return { account: toPublic(target) };
    },
  },
  {
    method: "DELETE",
    pattern: /^\/accounts\/([^/]+)$/,
    handler({ db, params }) {
      const actor = currentUser(db);
      requirePermission(actor, "manageAccounts");
      const target = findAccount(db, params[0]);
      if (target.id === actor.id) throw new ApiError(409, "CANNOT_CHANGE_SELF", "Not allowed on your own account");
      if (!DELETABLE.includes(target.status)) throw new ApiError(409, "CANNOT_DELETE_USED", "Deactivate it instead");
      const email = target.email.toLowerCase();
      db.accounts = db.accounts.filter((a) => a.id !== target.id);
      db.otps = db.otps.filter((o) => o.email !== email);
      delete db.loginFails[email];
      audit(db, actor.fullName, "ACCOUNT_DELETED", `${target.fullName} (${target.email}, ${target.status})`);
      saveDb(db);
      return { ok: true };
    },
  },
  {
    method: "PUT",
    pattern: /^\/accounts\/([^/]+)\/permissions$/,
    handler({ db, params, body }) {
      const actor = currentUser(db);
      requirePermission(actor, "manageAccounts");
      const target = findAccount(db, params[0]);
      const next = normalizePermissions(target.role, { ...target.permissions, ...(body.permissions as Partial<PermissionMap>) });
      let granted = 0;
      let revoked = 0;
      for (const p of PERMISSIONS) {
        if (next[p.key] && !target.permissions[p.key]) granted += 1;
        if (!next[p.key] && target.permissions[p.key]) revoked += 1;
      }
      target.permissions = next;
      target.permissionsChangedAt = new Date().toISOString();
      target.permissionsChangedBy = actor.fullName;
      audit(db, actor.fullName, "PERMISSIONS_CHANGED", `${target.fullName}: ${granted} granted, ${revoked} revoked`);
      saveDb(db);
      return { account: toPublic(target), granted, revoked };
    },
  },

  // ----- hồ sơ cá nhân -----
  {
    method: "PUT",
    pattern: /^\/me\/profile$/,
    handler({ db, body }) {
      const user = currentUser(db);
      const fullName = String(body.fullName ?? "").trim();
      if (!fullName) throw new ApiError(400, "VALIDATION", "Full name is required.", { field: "fullName" });
      if (fullName !== user.fullName) audit(db, user.fullName, "NAME_CHANGED", `${user.fullName} → ${fullName}`);
      user.fullName = fullName;
      user.phone = String(body.phone ?? "").trim();
      saveDb(db);
      return { user: toPublic(user) };
    },
  },
  {
    method: "PUT",
    pattern: /^\/me\/notifications$/,
    handler({ db, body }) {
      const user = currentUser(db);
      const key = body.key as NotifyKey;
      if (!(key in user.notify)) throw new ApiError(400, "VALIDATION", "Unknown notification");
      if (notifyLock(user.role, key).locked) throw new ApiError(409, "LOCKED", "This notification cannot be changed");
      user.notify[key] = Boolean(body.value);
      saveDb(db);
      return { user: toPublic(user) };
    },
  },
  {
    method: "POST",
    pattern: /^\/me\/password$/,
    handler({ db, body }) {
      const user = currentUser(db);
      const current = String(body.current ?? "");
      const next = String(body.next ?? "");
      if (user.password !== current) throw new ApiError(400, "WRONG_PASSWORD", "Current password is wrong");
      if (next === current) throw new ApiError(400, "SAME_PASSWORD", "Same password");
      const weak = passwordError(next);
      if (weak) throw new ApiError(400, "WEAK_PASSWORD", weak);
      user.password = next;
      audit(db, user.fullName, "PASSWORD_CHANGED", "Changed in My Profile");
      saveDb(db);
      const due = new Date(Date.now() + PASSWORD_MAX_AGE_DAYS * 24 * 3600 * 1000).toISOString();
      return { nextChangeDue: due };
    },
  },

  // ----- 403: ghi nhật ký + xin cấp quyền -----
  {
    method: "POST",
    pattern: /^\/audit\/forbidden$/,
    handler({ db, body }) {
      const user = currentUser(db);
      const now = new Date();
      const reference = `403-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}-${String(72 + db.audit.length).padStart(4, "0")}`;
      audit(db, user.fullName, "ACCESS_DENIED", `${String(body.screen ?? "")} (${reference})`);
      saveDb(db);
      const manager = db.accounts.find((a) => a.role === "CLUB_MANAGER" && a.status === "ACTIVE");
      return { reference, managerName: manager?.fullName ?? "the Club Manager" };
    },
  },
  {
    method: "POST",
    pattern: /^\/permission-requests$/,
    handler({ db, body }) {
      const user = currentUser(db);
      const screen = String(body.screen ?? "");
      const reference = String(body.reference ?? "");
      // Đã có yêu cầu đang chờ cho cùng màn hình => cập nhật lại, không tạo trùng.
      const open = db.requests.find((r) => r.accountId === user.id && r.screen === screen && r.status === "OPEN");
      if (open) {
        open.reference = reference;
        open.at = new Date().toISOString();
      } else {
        const id = db.requests.reduce((max, r) => Math.max(max, r.id), 0) + 1;
        db.requests.unshift({ id, at: new Date().toISOString(), accountId: user.id, screen, reference, status: "OPEN", resolvedAt: null, resolvedBy: null });
      }
      audit(db, user.fullName, "PERMISSION_REQUESTED", screen);
      saveDb(db);
      return { ok: true };
    },
  },

  // ----- danh sách chờ của Club Manager -----
  {
    method: "GET",
    pattern: /^\/permission-requests$/,
    handler({ db, url }) {
      requirePermission(currentUser(db), "manageAccounts");
      const all = url.searchParams.get("status") === "ALL";
      const requests = db.requests
        .filter((r) => all || r.status === "OPEN")
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((r) => withAccount(db, r));
      return { requests };
    },
  },
  {
    method: "POST",
    pattern: /^\/permission-requests\/(\d+)\/resolve$/,
    handler({ db, params, body }) {
      const actor = currentUser(db);
      requirePermission(actor, "manageAccounts");
      const status = body.status;
      if (status !== "GRANTED" && status !== "DISMISSED") throw new ApiError(400, "VALIDATION", "Status must be GRANTED or DISMISSED");
      const request = db.requests.find((r) => r.id === Number(params[0]));
      if (!request) throw new ApiError(404, "NOT_FOUND", "Request not found");
      if (request.status !== "OPEN") throw new ApiError(409, "INVALID_STATE", "Request already handled");
      request.status = status;
      request.resolvedAt = new Date().toISOString();
      request.resolvedBy = actor.fullName;
      const who = db.accounts.find((a) => a.id === request.accountId)?.fullName ?? "unknown";
      audit(db, actor.fullName, `PERMISSION_REQUEST_${status}`, `${who}: ${request.screen} (${request.reference})`);
      saveDb(db);
      return { request: withAccount(db, request) };
    },
  },

  // ===== FLOW 3: MEDICAL & HEALTH ROUTES =====
  {
    method: "GET",
    pattern: /^\/medical\/horses\/([^/]+)$/,
    handler({ db, params }) {
      const user = currentUser(db);
      return buildMockProfile(params[0], user.role);
    },
  },
  {
    method: "GET",
    pattern: /^\/horses\/([^/]+)\/health-board$/,
    handler({ db, params }) {
      const user = currentUser(db);
      return buildMockProfile(params[0], user.role);
    },
  },
  {
    method: "GET",
    pattern: /^\/medical\/horses\/([^/]+)\/observations$/,
    handler({ params, url }) {
      const store = getMockMedicalStore();
      const urgency = url.searchParams.get("urgency");
      const list = store.observations.filter(
        (o) => o.horseId === params[0] && (!urgency || o.urgency === urgency),
      );
      return { observations: list };
    },
  },
  {
    method: "GET",
    pattern: /^\/medical\/records$/,
    handler({ url }) {
      const store = getMockMedicalStore();
      const horseId = url.searchParams.get("horseId");
      const status = url.searchParams.get("status");
      const search = url.searchParams.get("search")?.toLowerCase();

      let list = store.records;
      if (horseId) list = list.filter((r) => r.horseId === horseId);
      if (status) list = list.filter((r) => r.status === status);
      if (search) {
        list = list.filter(
          (r) =>
            r.recordNumber.toLowerCase().includes(search) ||
            r.horseName?.toLowerCase().includes(search) ||
            r.diagnosis?.toLowerCase().includes(search),
        );
      }

      return {
        records: list,
        total: list.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
    },
  },
  {
    method: "GET",
    pattern: /^\/medical\/records\/([^/]+)$/,
    handler({ params }) {
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0] || r.recordNumber === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Medical record not found");
      return { record: rec };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/records$/,
    handler({ db, body }) {
      const user = currentUser(db);
      const store = getMockMedicalStore();
      const id = `rec-${Date.now()}`;
      const seq = store.records.length + 1;
      const recordNumber = `BA-26${String(seq).padStart(4, "0")}`;

      const newRec: MedicalRecord = {
        id,
        recordNumber,
        horseId: String(body.horseId || "horse-1"),
        horseName: body.horseId === "horse-2" ? "Northern Dancer Legacy" : "Thunderbolt Swift",
        status: body.saveAsDraft ? "DRAFT" : "OPEN",
        examinationDate: String(body.examinationDate || new Date().toISOString()),
        examinationType: String(body.examinationType || "General Examination"),
        examinationReason: String(body.examinationReason || "Routine checkup"),
        symptoms: body.symptoms ? String(body.symptoms) : undefined,
        discoverySource: body.discoverySource ? String(body.discoverySource) : undefined,
        vitals: body.vitals as any,
        labTests: (body.labTests as any) || [],
        diagnosis: body.diagnosis ? String(body.diagnosis) : undefined,
        severity: (body.severity as any) || "MODERATE",
        proposedStatus: body.proposedStatus ? String(body.proposedStatus) : undefined,
        proposeMedicalLock: Boolean(body.proposeMedicalLock),
        treatmentPhases: [],
        prescriptions: [],
        followUps: [],
        createdAt: new Date().toISOString(),
        vetId: user.id,
        vetName: user.fullName,
      };

      store.records.unshift(newRec);
      saveMockMedicalStore(store);
      return { record: newRec };
    },
  },
  {
    method: "PUT",
    pattern: /^\/medical\/records\/([^/]+)$/,
    handler({ params, body }) {
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Record not found");
      if (rec.status !== "DRAFT") throw new ApiError(400, "INVALID_STATE", "Only DRAFT records can be edited");

      Object.assign(rec, {
        examinationDate: body.examinationDate || rec.examinationDate,
        examinationType: body.examinationType || rec.examinationType,
        examinationReason: body.examinationReason || rec.examinationReason,
        symptoms: body.symptoms !== undefined ? body.symptoms : rec.symptoms,
        discoverySource: body.discoverySource || rec.discoverySource,
        vitals: body.vitals || rec.vitals,
        labTests: body.labTests || rec.labTests,
        diagnosis: body.diagnosis !== undefined ? body.diagnosis : rec.diagnosis,
        severity: body.severity || rec.severity,
        proposedStatus: body.proposedStatus || rec.proposedStatus,
        proposeMedicalLock: body.proposeMedicalLock !== undefined ? body.proposeMedicalLock : rec.proposeMedicalLock,
      });

      saveMockMedicalStore(store);
      return { record: rec };
    },
  },
  {
    method: "DELETE",
    pattern: /^\/medical\/records\/([^/]+)$/,
    handler({ params }) {
      const store = getMockMedicalStore();
      const idx = store.records.findIndex((r) => r.id === params[0]);
      if (idx === -1) throw new ApiError(404, "NOT_FOUND", "Record not found");
      store.records.splice(idx, 1);
      saveMockMedicalStore(store);
      return { ok: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/records\/([^/]+)\/finalize$/,
    handler({ params }) {
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Record not found");
      rec.status = "OPEN";
      saveMockMedicalStore(store);
      return { record: rec };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/records\/([^/]+)\/treatment-phases$/,
    handler({ params, body }) {
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Record not found");
      const phase: TreatmentPhase = {
        id: `phase-${Date.now()}`,
        phaseName: String(body.phaseName || "Phase"),
        startDate: String(body.startDate),
        endDate: String(body.endDate),
        target: String(body.target),
        allowedActivity: String(body.allowedActivity),
        careInstructions: (body.careInstructions as any) || [],
      };
      rec.treatmentPhases = rec.treatmentPhases || [];
      rec.treatmentPhases.push(phase);
      saveMockMedicalStore(store);
      return { phase };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/records\/([^/]+)\/prescriptions$/,
    handler({ params, body }) {
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Record not found");
      const rx: PrescriptionItem = {
        id: `rx-${Date.now()}`,
        medicationName: String(body.medicationName),
        dosage: Number(body.dosage),
        unit: String(body.unit),
        route: String(body.route),
        frequencyPerDay: Number(body.frequencyPerDay),
        startDate: String(body.startDate),
        daysCount: Number(body.daysCount),
        withdrawalDays: body.withdrawalDays ? Number(body.withdrawalDays) : undefined,
        notes: body.notes ? String(body.notes) : undefined,
        status: "ACTIVE",
      };
      rec.prescriptions = rec.prescriptions || [];
      rec.prescriptions.push(rx);
      saveMockMedicalStore(store);
      return { prescription: rx };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/records\/([^/]+)\/prescriptions\/([^/]+)\/stop$/,
    handler({ params, body }) {
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Record not found");
      const rx = rec.prescriptions?.find((p) => p.id === params[1]);
      if (!rx) throw new ApiError(404, "NOT_FOUND", "Prescription not found");
      rx.status = "STOPPED";
      rx.stoppedReason = String(body.stoppedReason || "Discontinued");
      rx.stoppedDate = String(body.stoppedDate || new Date().toISOString().split("T")[0]);
      saveMockMedicalStore(store);
      return { prescription: rx };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/records\/([^/]+)\/follow-ups$/,
    handler({ db, params, body }) {
      const user = currentUser(db);
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Record not found");
      const fu: FollowUpItem = {
        id: `fu-${Date.now()}`,
        followUpDate: String(body.followUpDate || new Date().toISOString()),
        temperature: Number(body.temperature),
        restingHeartRate: Number(body.restingHeartRate),
        respiratoryRate: Number(body.respiratoryRate),
        progressNotes: String(body.progressNotes),
        adjustments: body.adjustments ? String(body.adjustments) : undefined,
        vetName: user.fullName,
      };
      rec.followUps = rec.followUps || [];
      rec.followUps.unshift(fu);
      saveMockMedicalStore(store);
      return { followUp: fu };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/records\/([^/]+)\/close$/,
    handler({ params, body }) {
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Record not found");
      rec.status = "CLOSED";
      rec.conclusion = String(body.conclusion);
      rec.treatmentResult = String(body.treatmentResult || "Full Recovery");
      rec.closedAt = new Date().toISOString();
      if (rec.prescriptions) {
        for (const p of rec.prescriptions) {
          if (p.status === "ACTIVE") p.status = "COMPLETED";
        }
      }
      saveMockMedicalStore(store);
      return { record: rec };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/records\/([^/]+)\/reopen$/,
    handler({ params }) {
      const store = getMockMedicalStore();
      const rec = store.records.find((r) => r.id === params[0]);
      if (!rec) throw new ApiError(404, "NOT_FOUND", "Record not found");
      rec.status = "OPEN";
      saveMockMedicalStore(store);
      return { record: rec };
    },
  },

  // ===== TRAINING LOCKS ROUTES (TASK P2-04 / DL-3.01 -> DL-3.03) =====
  {
    method: "GET",
    pattern: /^\/medical\/locks$/,
    handler() {
      const stored = getStoredLocks();
      return stored.map((l) => ({
        id: l.id,
        lockCode: l.lockCode,
        horseId: l.horseId,
        horseName: l.horseName,
        horseCode: l.horseCode,
        appliedMedicalStatus: l.appliedMedicalStatus,
        lockedAt: l.lockedAt,
        lockedBy: l.lockedBy,
        lockReason: l.lockReason,
        reviewDate: l.reviewDate,
        releasedAt: l.releasedAt,
        releasedBy: l.releasedBy,
        releaseReason: l.releaseReason,
        durationDays: l.durationDays,
        status: l.status,
      }));
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/locks$/,
    handler({ body }) {
      const horseId = String(body.horseId);
      const expectedDays = Number(body.expectedRestDays || 7);
      const reviewDate = body.reviewDate ? String(body.reviewDate) : new Date(Date.now() + expectedDays * 86400000).toISOString().split("T")[0];
      const lock = placeHorseTrainingLock(horseId, {
        appliedStatus: String(body.medicalStatus || "INJURED"),
        reviewDate,
        reason: String(body.lockReason || "Under protective clinical training suspension"),
        unlockConditions: body.unlockConditions ? String(body.unlockConditions) : undefined,
      });
      return { ok: true, lock };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/locks\/([^/]+)\/release$/,
    handler({ params, body }) {
      const lockId = params[0];
      const locks = getStoredLocks();
      const matched = locks.find((l) => l.id === lockId || l.horseId === lockId);
      const horseId = matched?.horseId || lockId;
      const releaseReason = String(body.unlockReason || body.releaseReason || "Fit for normal activity");
      const targetStatus = String(body.newHorseStatus || body.targetStatus || "FIT");

      const releasedLock = liftHorseTrainingLock(horseId, {
        restoreStatus: targetStatus,
        reason: releaseReason,
      });
      return { ok: true, lock: releasedLock };
    },
  },
  {
    method: "POST",
    pattern: /^\/medical\/locks\/([^/]+)\/extend$/,
    handler({ params, body }) {
      const lockId = params[0];
      const locks = getStoredLocks();
      const matched = locks.find((l) => l.id === lockId || l.horseId === lockId);
      const horseId = matched?.horseId || lockId;
      const additionalDays = Number(body.additionalDays || 7);
      const reason = String(body.recheckNotes || body.reason || "Extended recovery needed");
      const currentReview = matched?.reviewDate || new Date().toISOString().split("T")[0];
      const newReviewDate = new Date(new Date(currentReview).getTime() + additionalDays * 86400000).toISOString().split("T")[0];

      const extended = extendHorseTrainingLock(horseId, {
        newReviewDate,
        reason,
      });
      return { ok: true, lock: extended };
    },
  },

  // ---- Flow 1: Horse Profile Mock Routes (P1-07)
  {
    method: "GET",
    pattern: /^\/horses$/,
    handler({ db, url }) {
      const user = currentUser(db);
      const stored = getStoredHorses();
      const search = url.searchParams.get("search")?.toLowerCase().trim() || "";
      const status = url.searchParams.get("status") || "ALL";
      const isLocked = url.searchParams.get("isMedicalLocked");
      const breed = url.searchParams.get("breed");
      const gender = url.searchParams.get("gender");
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "20", 10);

      let list = stored.map((h: any) => {
        let st = h.statusText || h.status;
        if (h.healthGroup === "FIT") st = "ACTIVE";
        else if (h.healthGroup === "WATCH") st = "UNDER_OBSERVATION";
        else if (h.healthGroup === "QUARANTINED") st = "ISOLATED";
        else if (h.healthGroup === "INJURED") st = "INJURED";
        else if (!st) st = "RESTING";

        let microchip = h.microchip || h.code;
        let microchipRfid = h.code || h.microchip || "985141002341001";
        if (user.role === "GROOM") {
          if (microchip && microchip.length > 4) {
            microchip = "*".repeat(microchip.length - 4) + microchip.slice(-4);
          }
          if (microchipRfid && microchipRfid.length > 4) {
            microchipRfid = "*".repeat(microchipRfid.length - 4) + microchipRfid.slice(-4);
          }
        }

        return {
          id: h.id,
          horseCode: h.horseCode || (h.id.startsWith("horse-") ? `HR-${h.id.slice(-6)}` : `HR-000001`),
          name: h.name,
          microchip,
          rfid: h.rfid || null,
          microchipRfid,
          breed: h.breed || "Thoroughbred",
          dob: h.dob || "2021-04-12",
          gender: h.gender || "Colt",
          color: h.color || "Bay Dark",
          status: st,
          isMedicalLocked: Boolean(h.isLocked),
          ownerId: h.ownerId || "owner-1",
          ownerName: h.ownerName || "Robert Sterling (Horse Owner)",
          owner: { id: h.ownerId || "owner-1", fullName: h.ownerName || "Robert Sterling (Horse Owner)", email: "owner@gmail.com" },
          stallCode: user.role === "HORSE_OWNER" ? null : (h.stall || "STALL-A01"),
          zone: user.role === "HORSE_OWNER" ? null : "Zone A - Barn 1",
          primaryGroom: user.role === "HORSE_OWNER" ? null : "Michael Groom",
          createdAt: h.createdAt || new Date().toISOString(),
          updatedAt: h.updatedAt || new Date().toISOString(),
        };
      });

      // Role scoping: Owner chỉ xem ngựa sở hữu
      if (user.role === "HORSE_OWNER") {
        list = list.filter((h) => h.ownerId === user.id);
      }

      if (status && status !== "ALL") {
        list = list.filter((h) => h.status === status);
      }
      if (isLocked !== null && isLocked !== undefined && isLocked !== "") {
        const lockBool = isLocked === "true";
        list = list.filter((h) => h.isMedicalLocked === lockBool);
      }
      if (breed && breed !== "ALL") {
        list = list.filter((h) => h.breed.toLowerCase() === breed.toLowerCase());
      }
      if (gender && gender !== "ALL") {
        list = list.filter((h) => h.gender.toLowerCase() === gender.toLowerCase());
      }
      if (search) {
        list = list.filter(
          (h) =>
            h.name.toLowerCase().includes(search) ||
            (h.horseCode && h.horseCode.toLowerCase().includes(search)) ||
            (h.microchip && h.microchip.toLowerCase().includes(search)) ||
            (h.rfid && h.rfid.toLowerCase().includes(search)) ||
            h.breed.toLowerCase().includes(search),
        );
      }

      const total = list.length;
      const skip = (page - 1) * limit;
      const items = list.slice(skip, skip + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
  },
  {
    method: "GET",
    pattern: /^\/horses\/([^/]+)$/,
    handler({ db, params }) {
      const user = currentUser(db);
      const stored = getStoredHorses();
      const h: any = stored.find((item) => item.id === params[0]);
      if (!h) throw new ApiError(404, "HORSE_NOT_FOUND", "Horse profile not found or permission denied.");

      if (user.role === "HORSE_OWNER" && h.ownerId && h.ownerId !== user.id) {
        throw new ApiError(404, "HORSE_NOT_FOUND", "Horse profile not found or permission denied.");
      }

      let st = h.statusText || h.status;
      if (h.healthGroup === "FIT") st = "ACTIVE";
      else if (h.healthGroup === "WATCH") st = "UNDER_OBSERVATION";
      else if (h.healthGroup === "QUARANTINED") st = "ISOLATED";
      else if (h.healthGroup === "INJURED") st = "INJURED";
      else if (!st) st = "RESTING";

      let microchip = h.microchip || h.code;
      let microchipRfid = h.code || h.microchip || "985141002341001";
      if (user.role === "GROOM") {
        if (microchip && microchip.length > 4) {
          microchip = "*".repeat(microchip.length - 4) + microchip.slice(-4);
        }
        if (microchipRfid && microchipRfid.length > 4) {
          microchipRfid = "*".repeat(microchipRfid.length - 4) + microchipRfid.slice(-4);
        }
      }

      return {
        id: h.id,
        horseCode: h.horseCode || (h.id.startsWith("horse-") ? `HR-${h.id.slice(-6)}` : `HR-000001`),
        name: h.name,
        microchip,
        rfid: h.rfid || null,
        microchipRfid,
        breed: h.breed || "Thoroughbred",
        dob: h.dob || "2021-04-12",
        gender: h.gender || "Colt",
        color: h.color || "Bay Dark",
        status: st,
        isMedicalLocked: Boolean(h.isLocked),
        ownerId: h.ownerId || "owner-1",
        ownerName: h.ownerName || "Robert Sterling (Horse Owner)",
        owner: { id: h.ownerId || "owner-1", fullName: h.ownerName || "Robert Sterling (Horse Owner)", email: "owner@gmail.com" },
        stallCode: user.role === "HORSE_OWNER" ? null : (h.stall || "STALL-A01"),
        zone: user.role === "HORSE_OWNER" ? null : "Zone A - Barn 1",
        primaryGroom: user.role === "HORSE_OWNER" ? null : "Michael Groom",
        createdAt: h.createdAt || new Date().toISOString(),
        updatedAt: h.updatedAt || new Date().toISOString(),
      };
    },
  },
  {
    method: "GET",
    pattern: /^\/horses\/([^/]+)\/history$/,
    handler({ db, params }) {
      const user = currentUser(db);
      const stored = getStoredHorses();
      const h: any = stored.find((item) => item.id === params[0]);
      if (!h) throw new ApiError(404, "HORSE_NOT_FOUND", "Horse profile not found or permission denied.");

      if (user.role === "HORSE_OWNER" && h.ownerId && h.ownerId !== user.id) {
        throw new ApiError(404, "HORSE_NOT_FOUND", "Horse profile not found or permission denied.");
      }

      let st = h.statusText || h.status;
      if (h.healthGroup === "FIT") st = "ACTIVE";
      else if (h.healthGroup === "WATCH") st = "UNDER_OBSERVATION";
      else if (h.healthGroup === "QUARANTINED") st = "ISOLATED";
      else if (h.healthGroup === "INJURED") st = "INJURED";
      else if (!st) st = "RESTING";

      const horse = {
        id: h.id,
        horseCode: h.horseCode || (h.id.startsWith("horse-") ? `HR-${h.id.slice(-6)}` : `HR-000001`),
        name: h.name,
        breed: h.breed || "Thoroughbred",
        dob: h.dob || "2021-04-12",
        gender: h.gender || "Colt",
        color: h.color || "Bay Dark",
        status: st,
        isMedicalLocked: Boolean(h.isLocked),
        stallCode: user.role === "HORSE_OWNER" ? null : (h.stall || "STALL-A01"),
        zone: user.role === "HORSE_OWNER" ? null : "Zone A - Barn 1",
        primaryGroom: user.role === "HORSE_OWNER" ? null : "Michael Groom",
      };

      const statusHistory = [
        {
          id: `sh-${h.id}-1`,
          timestamp: h.updatedAt || new Date().toISOString(),
          changedBy: "Dr. Sarah Connor (Veterinarian)",
          action: "HORSE_STATUS_CHANGED",
          oldStatus: "RESTING",
          newStatus: st,
        },
      ];

      const ownershipHistory = [
        {
          id: `oh-${h.id}-1`,
          timestamp: h.createdAt || new Date(Date.now() - 60 * 86400000).toISOString(),
          previousOwner: "EquiFlow Racing Stable",
          newOwner: h.ownerName || "Robert Sterling (Horse Owner)",
          reason: "Purchased at Autumn Yearling Auction",
          transferredBy: "Michael Tran (Club Manager)",
        },
      ];

      const stallHistory = user.role === "HORSE_OWNER" ? [] : [
        {
          id: `stall-${h.id}-1`,
          stallCode: h.stall || "STALL-A01",
          zone: "Zone A - Barn 1",
          groomName: "John Smith (Groom Hand)",
          startDate: h.createdAt || new Date(Date.now() - 30 * 86400000).toISOString(),
          endDate: null,
          isActive: true,
        },
      ];

      const medicalHistory = {
        records: [
          {
            id: `mr-${h.id}-1`,
            examinationDate: new Date(Date.now() - 5 * 86400000).toISOString(),
            veterinarianName: "Dr. Sarah Connor",
            symptoms: h.isLocked ? (h.lockReason || "Left forelimb swelling and lameness") : "Routine pre-training health screening",
            clinicalDiagnosis: h.isLocked ? "Acute desmitis of suspensory ligament" : "Clinically sound, fit for regular conditioning",
            treatmentProtocol: h.isLocked ? "Cryotherapy, bandage support, rest" : "Routine maintenance",
          },
        ],
        injuries: h.isLocked ? [
          {
            id: `inj-${h.id}-1`,
            discoveryDate: new Date(Date.now() - 5 * 86400000).toISOString(),
            anatomicalZone: "Superficial Digital Flexor Tendon (SDFT)",
            layer: "MUSCLE",
            viewSide: "LEFT",
            injuryType: "Tendon Strain & Mild Synovitis",
            severity: "MODERATE",
            stage: "ACUTE",
            status: "ACTIVE",
          },
        ] : [],
        locks: h.isLocked ? [
          {
            id: `lock-${h.id}-1`,
            lockCode: "KH-000001",
            lockedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
            lockReason: h.lockReason || "Suspensory ligament acute desmitis during intense trial run",
            veterinarianName: "Dr. Sarah Connor",
            isLocked: true,
          },
        ] : [],
      };

      const trainingHistory = [
        {
          id: `tp-${h.id}-1`,
          phaseName: "Endurance & Speed Conditioning",
          targetSpeed: 45,
          targetDistance: 1600,
          trackSurface: "TURF",
          startDate: new Date(Date.now() - 20 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
          status: h.isLocked ? "SUSPENDED" : "ACTIVE",
          trainerName: "David Nguyen (Head Trainer)",
          totalWorkouts: 8,
          completedWorkouts: 6,
        },
      ];

      const timeline = [
        {
          id: `tl-${h.id}-1`,
          category: "IDENTITY" as const,
          title: "Horse identity profile created",
          description: `Registered as ${h.name} (${horse.horseCode}), breed ${horse.breed}.`,
          timestamp: h.createdAt || new Date(Date.now() - 60 * 86400000).toISOString(),
          badgeTone: "info" as const,
        },
        ...(h.isLocked ? [
          {
            id: `tl-${h.id}-lock`,
            category: "MEDICAL" as const,
            title: "Veterinary Medical Lock enforced (KH-000001)",
            description: `Reason: ${h.lockReason || "Acute desmitis"}. Issued by Dr. Sarah Connor.`,
            timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
            badgeTone: "danger" as const,
          },
        ] : []),
        {
          id: `tl-${h.id}-plan`,
          category: "TRAINING" as const,
          title: "Training plan issued: Endurance & Speed Conditioning",
          description: `Status: ${h.isLocked ? "SUSPENDED" : "ACTIVE"}. Surface: TURF. Trainer: David Nguyen.`,
          timestamp: new Date(Date.now() - 20 * 86400000).toISOString(),
          badgeTone: "ok" as const,
        },
        {
          id: `tl-${h.id}-med`,
          category: "MEDICAL" as const,
          title: "Clinical examination completed",
          description: `Diagnosis: ${h.isLocked ? "Acute desmitis" : "Clinically sound"}. Examined by Dr. Sarah Connor.`,
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
          badgeTone: "warn" as const,
        },
      ];

      return {
        horse,
        statusHistory,
        ownershipHistory,
        stallHistory,
        medicalHistory,
        trainingHistory,
        timeline,
      };
    },
  },
  {
    method: "POST",
    pattern: /^\/horses$/,
    handler({ db, body }) {
      const user = currentUser(db);
      if (user.role !== "CLUB_MANAGER") {
        throw new ApiError(403, "FORBIDDEN", "Only Club Manager can create horse profiles.");
      }

      const name = String(body.name || "").trim();
      const microchip = String(body.microchip || "").trim();
      const rfid = body.rfid ? String(body.rfid).trim().toUpperCase() : undefined;

      if (!name) throw new ApiError(400, "VALIDATION", "Horse name is required.");
      if (!microchip || !/^\d{15}$/.test(microchip)) {
        throw new ApiError(400, "VALIDATION", "Microchip must be exactly 15 digits.");
      }

      const stored = getStoredHorses();
      if (stored.some((h) => h.name.toLowerCase() === name.toLowerCase())) {
        throw new ApiError(409, "DUPLICATE_NAME", "A horse with this name already exists in the system.");
      }
      if (stored.some((h) => (h as any).microchip === microchip || h.code === microchip)) {
        throw new ApiError(409, "DUPLICATE_MICROCHIP", "Microchip number is already registered to another horse.");
      }
      if (rfid && stored.some((h) => (h as any).rfid === rfid)) {
        throw new ApiError(409, "DUPLICATE_RFID", "RFID code is already registered to another horse.");
      }

      const id = `horse-${Date.now()}`;
      const horseCode = `HR-${String(stored.length + 1).padStart(6, "0")}`;
      const newHorse: any = {
        id,
        horseCode,
        name,
        code: microchip,
        microchip,
        rfid: rfid || null,
        stall: body.stallCode || "STALL-A01",
        healthGroup: "FIT",
        status: body.status || "RESTING",
        statusText: body.status || "RESTING",
        isLocked: false,
        restingHeartRate: 38,
        temp: 38.0,
        breed: body.breed || "Thoroughbred",
        dob: body.dob || "2021-04-12",
        gender: body.gender || "Colt",
        color: body.color || "Bay Dark",
        ownerId: body.ownerId || null,
      };

      addStoredHorse(newHorse);
      audit(db, user.fullName, "HORSE_CREATED", `Created horse profile ${name} (${horseCode})`);
      return newHorse;
    },
  },
  {
    method: "PUT",
    pattern: /^\/horses\/([^/]+)$/,
    handler({ db, params, body }) {
      const user = currentUser(db);
      if (user.role !== "CLUB_MANAGER") {
        throw new ApiError(403, "FORBIDDEN", "Only Club Manager can update horse profiles.");
      }

      const stored = getStoredHorses();
      const existing = stored.find((h) => h.id === params[0]);
      if (!existing) throw new ApiError(404, "HORSE_NOT_FOUND", "Horse profile not found.");

      if ((existing as any).status === "RETIRED") {
        throw new ApiError(400, "HORSE_RETIRED", "Horse is retired. Reactivate horse before modifying.");
      }

      if (body.name) {
        const name = String(body.name).trim();
        if (stored.some((h) => h.id !== params[0] && h.name.toLowerCase() === name.toLowerCase())) {
          throw new ApiError(409, "DUPLICATE_NAME", "A horse with this name already exists in the system.");
        }
        existing.name = name;
      }
      if (body.microchip) {
        const chip = String(body.microchip).trim();
        if (stored.some((h) => h.id !== params[0] && ((h as any).microchip === chip || h.code === chip))) {
          throw new ApiError(409, "DUPLICATE_MICROCHIP", "Microchip number is already registered to another horse.");
        }
        (existing as any).microchip = chip;
        existing.code = chip;
      }
      if (body.rfid) {
        const rfid = String(body.rfid).trim().toUpperCase();
        if (stored.some((h) => h.id !== params[0] && (h as any).rfid === rfid)) {
          throw new ApiError(409, "DUPLICATE_RFID", "RFID code is already registered to another horse.");
        }
        (existing as any).rfid = rfid;
      }
      if (body.breed) existing.breed = String(body.breed);
      if (body.dob) existing.dob = String(body.dob);
      if (body.gender) existing.gender = String(body.gender);
      if (body.color) existing.color = String(body.color);
      if (body.status) (existing as any).status = body.status;

      saveStoredHorses(stored);
      audit(db, user.fullName, "HORSE_UPDATED", `Updated horse profile ${existing.name}`);
      return existing;
    },
  },
  {
    method: "DELETE",
    pattern: /^\/horses\/([^/]+)$/,
    handler({ db, params }) {
      const user = currentUser(db);
      if (user.role !== "CLUB_MANAGER") {
        throw new ApiError(403, "FORBIDDEN", "Only Club Manager can delete horse profiles.");
      }
      const stored = getStoredHorses();
      const existing = stored.find((h) => h.id === params[0]);
      if (!existing) throw new ApiError(404, "HORSE_NOT_FOUND", "Horse profile not found.");
      if (existing.isLocked) {
        throw new ApiError(400, "HORSE_LOCKED", "Cannot delete horse profile while an active Medical Lock is in effect.");
      }

      deleteStoredHorse(params[0]);
      audit(db, user.fullName, "HORSE_DELETED", `Deleted horse profile ${existing.name}`);
      return { success: true, message: `Successfully deleted horse ${existing.name}.` };
    },
  },
  {
    method: "PATCH",
    pattern: /^\/horses\/([^/]+)\/transfer-owner$/,
    handler({ db, params, body }) {
      const user = currentUser(db);
      if (user.role !== "CLUB_MANAGER") {
        throw new ApiError(403, "FORBIDDEN", "Only Club Manager can transfer horse ownership.");
      }
      const stored = getStoredHorses();
      const existing = stored.find((h) => h.id === params[0]);
      if (!existing) throw new ApiError(404, "HORSE_NOT_FOUND", "Horse profile not found.");
      if ((existing as any).status === "RETIRED") {
        throw new ApiError(400, "HORSE_RETIRED", "Cannot transfer ownership of a retired horse.");
      }

      const newOwnerId = String(body.newOwnerId || "");
      if (!newOwnerId) throw new ApiError(400, "VALIDATION", "New owner ID is required.");
      if (existing.ownerId === newOwnerId) {
        throw new ApiError(400, "ALREADY_OWNED", "Horse is already assigned to this owner.");
      }

      const accounts = db.accounts;
      const newOwner = accounts.find((a) => a.id === newOwnerId) || {
        id: newOwnerId,
        fullName: newOwnerId === "usr-owner-002" ? "Alexander Hamilton (Equine Syndicate)" : "Robert Sterling (Horse Owner)",
        email: "owner@gmail.com",
      };

      existing.ownerId = newOwner.id;
      existing.ownerName = newOwner.fullName;
      saveStoredHorses(stored);
      audit(db, user.fullName, "HORSE_OWNERSHIP_TRANSFERRED", `Transferred ownership of ${existing.name} to ${newOwner.fullName}. Reason: ${body.reason || "None"}`);
      return {
        ...existing,
        owner: { id: newOwner.id, fullName: newOwner.fullName, email: newOwner.email },
      };
    },
  },
  {
    method: "PATCH",
    pattern: /^\/horses\/([^/]+)\/status$/,
    handler({ db, params, body }) {
      const user = currentUser(db);
      const stored = getStoredHorses();
      const existing = stored.find((h) => h.id === params[0]);
      if (!existing) throw new ApiError(404, "HORSE_NOT_FOUND", "Horse profile not found.");
      
      const newStatus = String(body.status);
      (existing as any).status = newStatus;
      
      saveStoredHorses(stored);
      audit(db, user.fullName, "HORSE_STATUS_CHANGED", `Changed status of ${existing.name} to ${newStatus}`);
      return { success: true, message: `Status updated to ${newStatus}`, data: existing };
    },
  },
  // ===== FLOW 2: TRAINING PLANS =====
  {
    method: "GET",
    pattern: /^\/training\/plans$/,
    handler() {
      const { getStoredPlans } = require("@/shared/mock/trainingData");
      return getStoredPlans();
    },
  },
  {
    method: "GET",
    pattern: /^\/training\/plans\/([^/]+)$/,
    handler({ params }) {
      const { getStoredPlans } = require("@/shared/mock/trainingData");
      const p = getStoredPlans().find((x: any) => x.id === params[0]);
      if (!p) throw new ApiError(404, "NOT_FOUND", "Training plan not found");
      return p;
    },
  },
  {
    method: "POST",
    pattern: /^\/training\/plans$/,
    handler({ body }) {
      const { getStoredPlans, saveStoredPlans } = require("@/shared/mock/trainingData");
      const plans = getStoredPlans();
      const newPlan = {
        id: `plan-${Date.now()}`,
        planCode: `PLAN-2026-${Math.floor(100 + Math.random() * 900)}`,
        name: body.name || "New Training Plan",
        horseId: body.horseId || "horse-1",
        horseName: body.horseName || "Thunderbolt Swift",
        horseCode: body.horseCode || "HR-000001",
        target: body.target || "",
        targetDistanceMeters: body.targetDistanceMeters || 1600,
        startDate: body.startDate || new Date().toISOString().split("T")[0],
        endDate: body.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        status: body.status || "DRAFT",
        phases: body.phases || [],
        headTrainerId: "usr-ht-1",
        headTrainerName: "David Nguyen (HT)",
        notes: body.notes || "",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      plans.unshift(newPlan);
      saveStoredPlans(plans);
      return newPlan;
    },
  },
  {
    method: "PATCH",
    pattern: /^\/training\/plans\/([^/]+)\/status$/,
    handler({ params, body }) {
      const { getStoredPlans, saveStoredPlans } = require("@/shared/mock/trainingData");
      const plans = getStoredPlans();
      const p = plans.find((x: any) => x.id === params[0]);
      if (!p) throw new ApiError(404, "NOT_FOUND", "Training plan not found");
      if (body.status === "ACTIVE" && p.isLockedByMedical) {
        throw new ApiError(400, "LOCKED", "Cannot activate training plan: Horse is under active Veterinary Medical Lock!");
      }
      p.status = String(body.status);
      if (body.status === "CANCELLED") p.cancelledReason = body.reason;
      if (body.status === "COMPLETED") p.completedAt = new Date().toISOString().split("T")[0];
      p.updatedAt = new Date().toISOString().split("T")[0];
      saveStoredPlans(plans);
      return p;
    },
  },
  {
    method: "POST",
    pattern: /^\/training\/plans\/([^/]+)\/clone$/,
    handler({ params, body }) {
      const { getStoredPlans, saveStoredPlans } = require("@/shared/mock/trainingData");
      const plans = getStoredPlans();
      const source = plans.find((x: any) => x.id === params[0]);
      if (!source) throw new ApiError(404, "NOT_FOUND", "Source training plan not found");
      const cloned = {
        ...JSON.parse(JSON.stringify(source)),
        id: `plan-${Date.now()}`,
        planCode: `PLAN-2026-${Math.floor(100 + Math.random() * 900)}`,
        name: `${source.name} (Copy)`,
        horseId: String(body.targetHorseId),
        horseName: String(body.targetHorseName),
        status: "DRAFT",
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      plans.unshift(cloned);
      saveStoredPlans(plans);
      return cloned;
    },
  },
];

// Yêu cầu cấp quyền kèm thông tin người gửi (giống `include: { account }` của backend).
function withAccount(db: Db, r: Db["requests"][number]) {
  const a = db.accounts.find((x) => x.id === r.accountId);
  return { ...r, account: a ? { id: a.id, fullName: a.fullName, email: a.email, role: a.role } : null };
}

// ------------------------------------------------------------------ điểm vào

export async function handleMock(method: HttpMethod, path: string, body?: unknown): Promise<unknown> {
  await sleep(180 + Math.random() * 220);
  const url = new URL(path, "http://mock.local");
  const db = getDb();

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = url.pathname.match(route.pattern);
    if (!match) continue;
    const result = await route.handler({ db, url, body: (body ?? {}) as Record<string, unknown>, params: match.slice(1) });
    return JSON.parse(JSON.stringify(result ?? null)); // tách khỏi đối tượng nội bộ, giống dữ liệu qua mạng
  }
  throw new ApiError(404, "NOT_FOUND", `No mock route for ${method} ${url.pathname}`);
}
