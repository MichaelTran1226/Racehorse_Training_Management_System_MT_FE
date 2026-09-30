import { api } from "@/shared/lib/api";
import type { PermissionMap, PublicAccount } from "@/shared/types/auth";
import type { CreateAccountInput, PermissionRequest, SavePermissionsResult, UpdateAccountInput } from "./types";

export const listAccounts = () => api<{ accounts: PublicAccount[] }>("GET", "/accounts");

export const getAccount = (id: string) => api<{ account: PublicAccount }>("GET", `/accounts/${id}`);

// Tạo tài khoản nhân viên: trạng thái INVITED, người được mời nhận email kèm mã để đặt mật khẩu.
export const createAccount = (input: CreateAccountInput) => api<{ account: PublicAccount }>("POST", "/accounts", input);

// Club Manager sửa họ tên + số điện thoại (email và vai trò không đổi ở đây).
export const updateAccount = (id: string, input: UpdateAccountInput) =>
  api<{ account: PublicAccount }>("PUT", `/accounts/${id}`, input);

// Xóa hẳn: chỉ tài khoản chưa từng hoạt động (INVITED, PENDING_EMAIL, REJECTED).
export const deleteAccount = (id: string) => api<{ ok: true }>("DELETE", `/accounts/${id}`);

export type AccountAction = "approve" | "decline" | "lock" | "unlock" | "deactivate" | "reactivate";

// `reason` (không bắt buộc) được lưu kèm khi từ chối / khóa / vô hiệu hóa.
export const runAccountAction = (id: string, action: AccountAction, reason?: string) =>
  api<{ account: PublicAccount }>("POST", `/accounts/${id}/${action}`, reason ? { reason } : undefined);

export const resendInvite = (id: string) => api<{ account: PublicAccount }>("POST", `/accounts/${id}/resend-invite`);

// Danh sách chờ: yêu cầu cấp quyền người dùng gửi từ màn 403 (mặc định chỉ yêu cầu đang chờ).
export const listPermissionRequests = () => api<{ requests: PermissionRequest[] }>("GET", "/permission-requests");

// Đánh dấu đã xử lý. GRANTED chỉ ghi nhận — quyền thật bật ở màn Permissions của tài khoản.
export const resolvePermissionRequest = (id: number, status: "GRANTED" | "DISMISSED") =>
  api<{ request: PermissionRequest }>("POST", `/permission-requests/${id}/resolve`, { status });

export const savePermissions = (id: string, permissions: PermissionMap) =>
  api<SavePermissionsResult>("PUT", `/accounts/${id}/permissions`, { permissions });
