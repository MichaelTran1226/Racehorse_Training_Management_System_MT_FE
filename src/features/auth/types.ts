// Kiểu dữ liệu riêng của feature auth (khớp phản hồi của các route /auth/* ở backend).

export type OtpPurpose = "signup" | "reset" | "invite";

// Mốc thời gian (mili-giây epoch) của mã OTP đang hiệu lực.
export interface OtpTimes {
  sentAt: number;
  expiresAt: number;
  resendAt: number; // sau mốc này mới được xin gửi lại
}

export interface RegisterInput {
  fullName: string;
  email: string;
  role: "HORSE_OWNER"; // chỉ Horse Owner được tự đăng ký; nhân viên do Club Manager tạo
  password: string;
}

// Kết quả sau khi xác minh email: yêu cầu đã chuyển tới Club Manager.
export interface RegistrationResult {
  email: string;
  fullName: string;
  role: string;
  requestCode: string;
  requestedAt: string;
  reviewer: string;
}

export interface ResetVerifyResult {
  resetToken: string;
  expiresAt: number;
}

// Nhân viên nhập đúng mã mời => vé đặt mật khẩu + tên, vai trò đã được mời.
export interface InviteVerifyResult extends ResetVerifyResult {
  fullName: string;
  role: string | null;
}

export interface ForbiddenInfo {
  reference: string;
  managerName: string;
}
