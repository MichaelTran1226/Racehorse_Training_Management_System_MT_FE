// Mã lỗi từ API → câu thông báo tiếng Anh dễ hiểu. Nêu điều kiện, không trách người dùng.

import { ApiError } from "@/shared/lib/api";
import { formatDateTime, formatTime } from "@/shared/lib/format";

export type AlertTone = "ok" | "warn" | "danger" | "info";

export interface AlertSpec {
  tone: AlertTone;
  icon: string;
  title: string;
  body: string;
}

const GENERIC: Record<string, string> = {
  NETWORK_ERROR: "The service did not answer. Check the connection and try again.",
  SERVICE_UNAVAILABLE: "The service did not answer. Nothing was changed. Try again in a moment.",
  EMAIL_TAKEN: "This email already has an account in the system.",
  ROLE_NOT_ALLOWED: "Only Horse Owner accounts can be requested here. Staff accounts are created by the Club Manager.",
  WEAK_PASSWORD: "Use at least 8 characters with an uppercase letter, a digit and a special character.",
  CANNOT_LOCK_SELF: "You cannot lock your own account. Ask another Club Manager.",
  CANNOT_CHANGE_SELF: "You cannot do this to your own account. Ask another Club Manager.",
  CANNOT_DELETE_USED: "This account has been used, so it cannot be deleted. Deactivate it instead to keep its history.",
  INVALID_STATE: "The account changed in the meantime. Reload the list and try again.",
  OTP_COOLDOWN: "A new invitation was sent less than a minute ago. Wait a moment before sending another.",
  NOT_FOUND: "The requested resource could not be found.",
  LAST_MANAGER: "The club must keep at least one active Club Manager.",
  RESET_EXPIRED: "This reset session has expired. Request a new code.",
  ATTEMPTS_EXCEEDED: "Too many wrong passwords. Wait 15 minutes, or use Forgot password to unlock it now.",
  FORBIDDEN: "This action is not part of your permissions.",
  VET_ONLY: "Only a Veterinarian can change medical data. You can still view it.",
  // Flow 1 - hồ sơ ngựa
  HORSE_NOT_FOUND: "This horse profile no longer exists or was deleted. Reload the list.",
  ROLE_RESTRICTION: "Your role cannot make this status change.",
  MEDICAL_LOCK_ACTIVE: "The horse is under a Training Lock: heavy workouts, plan activation and operational status changes are blocked until a Veterinarian lifts it.",
  HORSE_RETIRED: "The horse is no longer managed. A Club Manager must reactivate it first.",
  HORSE_DECEASED: "A deceased horse cannot be reactivated.",
  RETIRE_REASON_REQUIRED: "Please select a reason for stopping management.",
  REASON_REQUIRED: "Reason must be 10 to 500 characters.",
  SAME_STATUS: "The horse is already in this status.",
  CONFIRM_NAME_MISMATCH: "The name does not match.",
  HORSE_LOCKED: "Cannot delete the profile while a Training Lock is in effect.",
  HAS_DEPENDENT_DATA: "The horse already has training, medical, care or racing data, so it cannot be deleted. Use Stop managing instead.",
  UNDO_EXPIRED: "The undo time has passed. Restore the profile from Deleted horses.",
  RESTORE_CONFLICT: "Cannot restore because another horse now uses this name. Rename that horse, then try again.",
  STALL_OCCUPIED: "This stall already has a horse.",
  STALL_MAINTENANCE: "This stall is under maintenance.",
  STALL_UNAVAILABLE: "This stall is under maintenance or no longer in use.",
  STALL_NOT_FOUND: "This stall no longer exists. Reload the map.",
  ALLOCATION_NOT_FOUND: "The horse is no longer in this stall. Reload the map.",
  SAME_STALL: "Choose a stall other than the current one.",
  HORSE_HAS_STALL: "The horse already has a stall. Use Move stall instead.",
  ZONE_NOT_FOUND: "This barn zone no longer exists. Reload the list.",
  ZONE_INACTIVE: "This barn zone is inactive. Reactivate it before adding stalls.",
  ZONE_HAS_HORSES: "The zone still houses horses. Move them out first.",
  DUPLICATE_ZONE_CODE: "This zone code already exists.",
  DUPLICATE_ZONE_NAME: "This zone name already exists.",
  DUPLICATE_STALL_CODE: "This stall code already exists.",
  INVALID_BREED: "This breed does not exist or is no longer in use.",
  INVALID_COLOR: "This coat colour does not exist or is no longer in use.",
  DUPLICATE_CATALOG_CODE: "This code already exists.",
  DUPLICATE_CATALOG_NAME: "This name already exists.",
  CATALOG_ITEM_NOT_FOUND: "This item no longer exists. Reload the list.",
  // Flow 2 - giáo án & buổi tập
  PLAN_NOT_FOUND: "This training plan no longer exists. Reload the list.",
  PLAN_CLOSED: "This plan is completed or cancelled, so it cannot be changed.",
  INVALID_PLAN_TRANSITION: "The plan's current status does not allow this action.",
  HORSE_HAS_ACTIVE_PLAN: "This horse already has an active plan. Complete or cancel it first.",
  PLAN_HAS_NO_WORKOUTS: "Add at least one workout before activating the plan.",
  PLAN_ENDED: "The plan's end date has passed.",
  PHASES_REQUIRED: "A plan needs at least one phase.",
  PLAN_NOT_DELETABLE: "Only a draft without completed workouts can be deleted. Cancel the plan instead.",
  VET_CONFIRMATION_REQUIRED: "The horse is in a medical status. Confirm that you have discussed this with the Veterinarian.",
  SUMMARY_REQUIRED: "Summary must be 10 to 2000 characters.",
  START_DATE_IN_PAST: "The start date cannot be before today.",
  DATE_IN_PAST: "A workout cannot be scheduled on a past date.",
  OUTSIDE_TRAINING_HOURS: "Start time must be between 04:00 and 20:00.",
  OUTSIDE_PLAN_DATES: "The workout date must be within the plan's dates.",
  TARGET_SPEED_REQUIRED: "Target speed is required for breezes and trial runs.",
  JOCKEY_REQUIRED: "Enter the jockey's name for breezes and trial runs.",
  INVALID_GROOM: "Choose an active groom.",
  TRIAL_SLOT_TAKEN: "This track already has a trial run within 15 minutes of that time.",
  MAX_WORKOUTS_PER_DAY: "A horse can have at most 3 workouts per day.",
  WORKOUT_NOT_FOUND: "This workout no longer exists. Reload the schedule.",
  WORKOUT_NOT_EDITABLE: "Only scheduled workouts can be edited.",
  WORKOUT_NOT_STARTED: "Results can be recorded once the workout has started.",
  LATE_RESULT_EXPIRED: "Late results can only be recorded within 7 days of the workout.",
  RESULT_EDIT_EXPIRED: "Results can only be edited within 48 hours of the first save.",
  WORKOUT_NOT_RECORDABLE: "Blocked or cancelled workouts have no result.",
  ABNORMAL_NOTES_REQUIRED: "Describe the abnormal signs.",
  WORKOUT_NOT_CANCELLABLE: "This workout is already completed or cancelled.",
  NOTE_REQUIRED: "Note must be 10 to 500 characters.",
  WORKOUT_NOT_BLOCKED: "Only blocked workouts can be restored.",
  ALERT_NOT_FOUND: "This alert no longer exists. Reload the list.",
  START_DATE_TOO_EARLY: "The start date cannot be more than 7 days ago.",
  PLAN_TOO_LONG: "A plan can last at most 52 weeks.",
  TOO_MANY_PHASES: "A plan can have at most 12 phases.",
  INVALID_PHASE: "A phase is not valid: check its name, dates, quotas and surface.",
  PHASE_OVERLAP: "Two phases overlap. Adjust their dates.",
  PHASE_HAS_COMPLETED_WORKOUTS: "This phase already has completed workouts, so it cannot be removed and its start date cannot change.",
  PHASE_REQUIRED: "Please choose a phase.",
  OUTSIDE_PHASE_DATES: "The workout date must be within the chosen phase.",
  REPEAT_BEYOND_PHASE: "“Repeat until” cannot be after the end of the phase.",
  NO_REPEAT_DATES: "No day matches the chosen weekdays.",
  TOO_MANY_REPEATS: "At most 60 workouts can be created at once.",
  TIME_REQUIRED: "Running time is required for this workout type.",
  RECOVERY_ABOVE_PEAK: "Heart rate after 10 minutes cannot exceed the peak heart rate.",
};

// Câu có chèn dữ liệu BE gửi kèm (data), ví dụ tên ngựa đang ở ô chuồng.
const DYNAMIC: Record<string, (d: Record<string, unknown>) => string | undefined> = {
  STALL_OCCUPIED: (d) =>
    d.horseName ? `Stall ${d.stallCode ?? ""} already houses ${d.horseName}. Move that horse first.`.replace("  ", " ") : undefined,
  HORSE_HAS_STALL: (d) => (d.stallCode ? `The horse is already in stall ${d.stallCode}. Use Move stall instead.` : undefined),
  ZONE_HAS_HORSES: (d) => (d.count ? `The zone still houses ${d.count} horse(s). Move them out first.` : undefined),
  ZONE_ROWS_TOO_SMALL: (d) => `Rows cannot be fewer than ${d.min}: a stall already sits in row ${d.min}.`,
  ZONE_COLS_TOO_SMALL: (d) => `Columns cannot be fewer than ${d.min}: a stall already sits in column ${d.min}.`,
  ROW_OUT_OF_RANGE: (d) => `Row must be between 1 and ${d.max}.`,
  COL_OUT_OF_RANGE: (d) => `Column must be between 1 and ${d.max}.`,
  POSITION_TAKEN: (d) => `This grid position is already used by stall ${d.stallCode}.`,
};

export function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (
      err.message &&
      err.message !== err.code &&
      err.message !== "Not Found" &&
      err.message !== "Bad Request" &&
      err.message !== "Forbidden resource"
    ) {
      return err.message;
    }
    return GENERIC[err.code] ?? err.message ?? "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}

// Câu lỗi cho ô nhập mã OTP.
export function otpMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return messageFor(err);
  const left = Number(err.data.attemptsLeft ?? 0);
  switch (err.code) {
    case "OTP_INVALID":
      return left > 0
        ? `The code is not correct. ${left} ${left === 1 ? "attempt" : "attempts"} left.`
        : "The code is not correct.";
    case "OTP_EXPIRED":
      return "This code has expired. Request a new one.";
    case "OTP_ATTEMPTS_EXCEEDED":
      return "Too many wrong codes. Request a new code to continue.";
    case "OTP_NOT_FOUND":
      return "No code is waiting for this address. Request a new one.";
    default:
      return messageFor(err);
  }
}

export interface LoginFailure {
  alert: AlertSpec;
  passwordError?: string;
  // Nút đăng nhập bị khóa + tooltip giải thích ai xử lý được.
  blockedReason?: string;
  footNote?: string;
  // Khóa tạm sau 5 lần sai: mốc (ms) server cho phép thử lại — trang đăng nhập đếm ngược tới đây.
  retryAt?: number;
  // Nút đi tiếp trong Alert: nhập OTP xác minh email / nhận lời mời.
  next?: "verifyEmail" | "acceptInvite";
}

// Kết quả đăng nhập thất bại (design 0.4 – 0.6) → nội dung Alert, nút và chú thích.
export function loginFailure(err: unknown): LoginFailure {
  if (!(err instanceof ApiError)) {
    return { alert: { tone: "danger", icon: "xCircle", title: "Sign-in failed", body: messageFor(err) } };
  }
  const d = err.data;
  const who = d.fullName ? `${d.fullName} · ${d.roleLabel}` : undefined;
  // Lý do Club Manager ghi khi khóa / từ chối / vô hiệu hóa (có thể trống).
  const reason = d.reason ? ` Reason: ${String(d.reason)}` : "";

  switch (err.code) {
    case "INVALID_CREDENTIALS": {
      // Không nói rõ sai email hay sai mật khẩu. Chỉ khi còn đúng 1 lần mới cảnh báo thêm (WorkFlow 1 §3.2).
      const left = Number(d.attemptsLeft ?? 0);
      return {
        alert: {
          tone: "danger",
          icon: "alert",
          title: "Email or password is incorrect",
          body:
            left === 1
              ? "Check both fields and try again. 1 attempt remaining before this account is temporarily locked."
              : "Check both fields and try again.",
        },
        passwordError: "Password is incorrect.",
        footNote: "Not sure of the password? Use Forgot password to set a new one",
      };
    }
    case "ATTEMPTS_EXCEEDED": {
      // Nội dung đếm ngược do trang đăng nhập dựng từ retryAt (thời gian lấy từ server, không tính ở client).
      const retryAt = d.retryAt ? Date.parse(String(d.retryAt)) : undefined;
      return {
        alert: {
          tone: "danger",
          icon: "alert",
          title: "Too many attempts",
          body: `Sign-in is paused for 15 minutes${retryAt ? ` (until ${formatTime(retryAt)})` : ""}. Use Forgot password to unlock it now.`,
        },
        retryAt,
      };
    }
    case "ACCOUNT_LOCKED":
      return {
        alert: {
          tone: "danger",
          icon: "ban",
          title: "Account is locked",
          body: `The Club Manager locked this account at ${d.lockedAt ? formatDateTime(String(d.lockedAt)) : "an earlier time"}. Contact support@equiflow.vn to have it unlocked.${reason}`,
        },
        blockedReason: "Only the Club Manager can unlock an account.",
        footNote: who,
      };
    case "ACCOUNT_PENDING":
      return {
        alert: {
          tone: "warn",
          icon: "clock",
          title: "Account is pending approval",
          body: `The request${d.requestCode ? ` ${String(d.requestCode)}` : ""} reached the Club Manager at ${d.requestedAt ? formatDateTime(String(d.requestedAt)) : "an earlier time"}. Quote this code when you contact the club; an email follows as soon as it is approved.`,
        },
        blockedReason: "The account works only after the Club Manager approves it.",
        footNote: who ? `${who}${d.requestCode ? ` · ${String(d.requestCode)}` : ""}` : undefined,
      };
    case "EMAIL_NOT_VERIFIED":
      return {
        alert: {
          tone: "warn",
          icon: "mail",
          title: "Email is not verified yet",
          body: "Enter the 6-digit code sent to this address to finish the sign-up request.",
        },
        blockedReason: "Verify the email with the code first.",
        footNote: who,
        next: "verifyEmail",
      };
    case "ACCOUNT_INVITED":
      return {
        alert: {
          tone: "info",
          icon: "mail",
          title: "Invitation not accepted yet",
          body: "Open the invitation email from the Club Manager and enter its code on the Accept invitation page to set a password.",
        },
        blockedReason: "The invitation must be accepted first.",
        footNote: who,
        next: "acceptInvite",
      };
    case "ACCOUNT_INACTIVE":
      return {
        alert: {
          tone: "danger",
          icon: "ban",
          title: "Account is inactive",
          body: `This account was switched off. Contact support@equiflow.vn to reactivate it.${reason}`,
        },
        blockedReason: "Only the Club Manager can reactivate an account.",
        footNote: who,
      };
    case "ACCOUNT_REJECTED":
      return {
        alert: {
          tone: "danger",
          icon: "xCircle",
          title: "The request was declined",
          body: `The Club Manager declined this account request.${reason} Send a new request if the details were wrong.`,
        },
        blockedReason: "The request was declined by the Club Manager.",
        footNote: who,
      };
    default:
      return { alert: { tone: "danger", icon: "xCircle", title: "Sign-in failed", body: messageFor(err) } };
  }
}
