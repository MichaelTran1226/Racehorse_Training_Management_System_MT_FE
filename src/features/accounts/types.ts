import type { PublicAccount } from "@/shared/types/auth";

export interface CreateAccountInput {
  fullName: string;
  email: string;
  role: PublicAccount["role"];
}

export interface UpdateAccountInput {
  fullName: string;
  phone: string;
}

// Yêu cầu cấp quyền gửi từ màn 403 (bảng permission_requests), kèm người gửi.
export interface PermissionRequest {
  id: number;
  at: string; // ISO
  screen: string; // "Administration / Accounts"
  reference: string; // 403-2609-0072
  status: "OPEN" | "GRANTED" | "DISMISSED";
  resolvedAt: string | null;
  resolvedBy: string | null;
  account: Pick<PublicAccount, "id" | "fullName" | "email" | "role"> | null;
}

export interface SavePermissionsResult {
  account: PublicAccount;
  granted: number;
  revoked: number;
}
