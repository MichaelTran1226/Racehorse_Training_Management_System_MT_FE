import type { Role } from "@/shared/types/enums";
import { api } from "@/shared/lib/api";
import { isVietnamese } from "@/shared/i18n/tr";
import { formatShortDate } from "./format";

// Thông báo trong ứng dụng (C-01): dữ liệu từ BE GET /notifications, giữ trong bộ nhớ và hỏi lại mỗi 30 giây.
// Các màn hình đọc bản sao trong bộ nhớ (getNotifications) và đăng ký nghe thay đổi (subscribeNotifications).
export interface AppNotification {
  id: string;
  type?: string; // mã sự kiện từ BE (VD LOCK_PLACED) — dùng để dịch
  params?: Record<string, string | number>;
  title: string;
  message: string;
  category: "LOCK" | "MEDICAL" | "TRAINING" | "ACCOUNT" | "HORSE" | "SYSTEM";
  createdAt: string;
  read: boolean;
  link?: string;
  senderName?: string;
}

interface NotificationList {
  notifications: AppNotification[];
  unreadCount: number;
}

const POLL_MS = 30_000;
const NOTIFICATIONS_EVENT = "equiflow:notifications_updated";

let items: AppNotification[] = [];
let pollTimer: number | undefined;

function apply(res: NotificationList): void {
  items = res.notifications;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
}

export async function refreshNotifications(): Promise<void> {
  try {
    apply(await api<NotificationList>("GET", "/notifications"));
  } catch {
    // Lỗi mạng/hết phiên: giữ danh sách cũ, lần hỏi sau thử lại (401 đã được api.ts xử lý chung).
  }
}

// Gọi khi đã đăng nhập; trả về hàm dừng (gọi khi đăng xuất / rời app).
export function startNotificationPolling(): () => void {
  void refreshNotifications();
  window.clearInterval(pollTimer);
  pollTimer = window.setInterval(() => void refreshNotifications(), POLL_MS);
  return () => {
    window.clearInterval(pollTimer);
    pollTimer = undefined;
    items = [];
  };
}

export function getNotifications(): AppNotification[] {
  return items;
}

export function getUnreadNotificationsCount(): number {
  return items.filter((n) => !n.read).length;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  items = items.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n));
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
  try {
    apply(await api<NotificationList>("POST", "/notifications/read", { ids }));
  } catch {
    void refreshNotifications();
  }
}

export function markNotificationAsRead(id: string): Promise<void> {
  return markNotificationsRead([id]);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    apply(await api<NotificationList>("POST", "/notifications/read-all"));
  } catch {
    void refreshNotifications();
  }
}

export async function clearAllNotifications(): Promise<void> {
  try {
    apply(await api<NotificationList>("DELETE", "/notifications"));
  } catch {
    void refreshNotifications();
  }
}

export function subscribeNotifications(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(NOTIFICATIONS_EVENT, onChange);
  return () => window.removeEventListener(NOTIFICATIONS_EVENT, onChange);
}

export function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const vi = isVietnamese();
    if (diffSec < 60) return vi ? "Vừa xong" : "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return vi ? `${diffMin} phút trước` : `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return vi ? `${diffHour} giờ trước` : `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return vi ? "Hôm qua" : "Yesterday";
    if (diffDay < 7) return vi ? `${diffDay} ngày trước` : `${diffDay}d ago`;
    return formatShortDate(isoString);
  } catch {
    return isVietnamese() ? "Gần đây" : "Recently";
  }
}

export function isToday(isoString: string): boolean {
  try {
    const date = new Date(isoString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- Facebook-style Notification Settings
export interface CategoryConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultPush: boolean;
  defaultEmail: boolean;
  defaultSms: boolean;
  alwaysOnFor?: Role[];
  alwaysOnReason?: string;
}

export const NOTIFICATION_CATEGORIES: CategoryConfig[] = [
  {
    id: "medical",
    name: "Medical & Clinical Alerts",
    description: "Emergency health alarms, abnormal vital signs, injury updates, and medication administration reminders.",
    icon: "stethoscope",
    defaultPush: true,
    defaultEmail: true,
    defaultSms: true,
    alwaysOnFor: ["VETERINARIAN"],
    alwaysOnReason: "Veterinarians must receive real-time medical updates.",
  },
  {
    id: "locks",
    name: "Training Locks & Resumptions",
    description: "Veterinary medical holds placed on horses, review date extension notices, and fit-for-training release orders.",
    icon: "lock",
    defaultPush: true,
    defaultEmail: true,
    defaultSms: false,
    alwaysOnFor: ["VETERINARIAN", "HEAD_TRAINER"],
    alwaysOnReason: "Core safety protocol. Cannot be muted by clinical and training leaders.",
  },
  {
    id: "training",
    name: "Training Plans & Workouts",
    description: "Daily training schedule publications, workout session metrics, heart rate recovery warnings, and track sensor alerts.",
    icon: "activity",
    defaultPush: true,
    defaultEmail: false,
    defaultSms: false,
    alwaysOnFor: ["HEAD_TRAINER"],
    alwaysOnReason: "Head Trainers require ongoing workout updates.",
  },
  {
    id: "barn",
    name: "Barn & Stable Operations",
    description: "Stall reassignments, quarantine zone updates, barn maintenance notices, and daily groom observations.",
    icon: "home",
    defaultPush: true,
    defaultEmail: false,
    defaultSms: false,
  },
  {
    id: "accounts",
    name: "Account & Access Requests",
    description: "New membership applications, access permission requests for restricted screens, and staff onboarding alerts.",
    icon: "users",
    defaultPush: true,
    defaultEmail: true,
    defaultSms: false,
    alwaysOnFor: ["CLUB_MANAGER"],
    alwaysOnReason: "Club Managers are responsible for membership intake.",
  },
  {
    id: "compliance",
    name: "Audits & Compliance Reports",
    description: "Quarterly equine welfare audits, pharmaceutical inventory reconciliation, and facility inspection reports.",
    icon: "clipboard",
    defaultPush: true,
    defaultEmail: true,
    defaultSms: false,
    alwaysOnFor: ["CLUB_MANAGER"],
    alwaysOnReason: "Club Managers oversee compliance auditing.",
  },
];

export interface ChannelSettings {
  desktopPush: boolean;
  badgeCounter: boolean;
  sound: boolean;
  emailEnabled: boolean;
  emailFrequency: "INSTANT" | "DAILY_DIGEST" | "IMPORTANT_ONLY";
  smsEnabled: boolean;
  smsEmergencyOnly: boolean;
}

export interface UserNotificationSettings {
  categories: Record<string, { enabled: boolean; push: boolean; email: boolean; sms: boolean }>;
  channels: ChannelSettings;
}

const SETTINGS_STORAGE_KEY = "equiflow.notification_settings.v1";
const SETTINGS_EVENT = "equiflow:notification_settings_updated";

export function getDefaultNotificationSettings(userRole?: Role): UserNotificationSettings {
  const categories: UserNotificationSettings["categories"] = {};

  NOTIFICATION_CATEGORIES.forEach((cat) => {
    const isAlwaysOn = userRole && cat.alwaysOnFor?.includes(userRole);
    categories[cat.id] = {
      enabled: isAlwaysOn ? true : true,
      push: cat.defaultPush,
      email: isAlwaysOn ? true : cat.defaultEmail,
      sms: cat.defaultSms,
    };
  });

  return {
    categories,
    channels: {
      desktopPush: true,
      badgeCounter: true,
      sound: true,
      emailEnabled: true,
      emailFrequency: "INSTANT",
      smsEnabled: false,
      smsEmergencyOnly: true,
    },
  };
}

export function getStoredNotificationSettings(userRole?: Role): UserNotificationSettings {
  const defaults = getDefaultNotificationSettings(userRole);
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UserNotificationSettings>;
    return {
      categories: { ...defaults.categories, ...(parsed.categories || {}) },
      channels: { ...defaults.channels, ...(parsed.channels || {}) },
    };
  } catch {
    return defaults;
  }
}

export function saveStoredNotificationSettings(settings: UserNotificationSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeNotificationSettings(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(SETTINGS_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(SETTINGS_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export interface LocalizedNotification {
  title: string;
  message: string;
  categoryLabel: string;
}

export function localizeNotification(n: AppNotification, isVi: boolean): LocalizedNotification {
  const CATEGORY_MAP_VI: Record<string, string> = {
    LOCK: "Khóa huấn luyện",
    MEDICAL: "Hồ sơ y tế",
    TRAINING: "Huấn luyện & Buổi tập",
    ACCOUNT: "Tài khoản & vai trò",
    HORSE: "Hồ sơ ngựa",
    SYSTEM: "Hệ thống",
  };

  const CATEGORY_MAP_EN: Record<string, string> = {
    LOCK: "Training Lock",
    MEDICAL: "Health & Medical",
    TRAINING: "Training & Workouts",
    ACCOUNT: "Accounts & Roles",
    HORSE: "Horse Profiles",
    SYSTEM: "System Notification",
  };

  const categoryLabel = isVi
    ? CATEGORY_MAP_VI[n.category] || "Thông báo"
    : CATEGORY_MAP_EN[n.category] || "Notification";

  if (!isVi) {
    return {
      title: n.title,
      message: n.message,
      categoryLabel,
    };
  }

  let title = n.title;
  let message = n.message;

  if (/Horse Status Update/i.test(n.title)) {
    title = "Cập nhật trạng thái y tế ngựa";
  } else if (/New Account Pending Approval/i.test(n.title)) {
    title = "Yêu cầu đăng ký tài khoản mới";
  } else if (/Training Lock Placed/i.test(n.title)) {
    title = "Áp đặt lệnh khóa huấn luyện y tế";
  } else if (/Care Schedule Overdue/i.test(n.title)) {
    title = "Lịch chăm sóc sức khỏe quá hạn";
  } else if (/New Stall Allocation/i.test(n.title)) {
    title = "Phân bổ vị trí chuồng mới";
  } else if (/Workout Completed/i.test(n.title)) {
    title = "Hoàn thành buổi tập luyện";
  }

  const lockMatch = n.message.match(/^(.*?) was placed on Medical Lock due to (.*?)\.?$/i);
  if (lockMatch) {
    const [, horse, reason] = lockMatch;
    message = `Ngựa ${horse} đã bị bác sĩ thú y áp đặt Lệnh Khóa Y Tế do ${reason}.`;
  }

  const regMatch = n.message.match(/^(.*?) has registered for (.*?) role and is pending approval\.?$/i);
  if (regMatch) {
    const [, name, role] = regMatch;
    const roleMap: Record<string, string> = {
      "Groom Hand": "Nhân viên chăm sóc (Groom)",
      "Head Trainer": "Huấn luyện viên trưởng",
      "Veterinarian": "Bác sĩ thú y",
      "Horse Owner": "Chủ ngựa",
      "Club Manager": "Quản lý câu lạc bộ",
    };
    const roleVi = roleMap[role.trim()] || role;
    message = `${name} đã đăng ký tài khoản vai trò ${roleVi} và đang chờ phê duyệt.`;
  }

  if (/Medical Lock (.*?) placed on (.*?)\. Heavy workouts blocked\./i.test(n.message)) {
    const m = n.message.match(/Medical Lock (.*?) placed on (.*?)\. Heavy workouts blocked\./i);
    if (m) message = `Lệnh khóa y tế ${m[1]} đã áp dụng cho ngựa ${m[2]}. Các buổi tập nặng đã tạm dừng.`;
  }

  if (/Farrier Hoof Care schedule for (.*?) is overdue by (\d+) days/i.test(n.message)) {
    const m = n.message.match(/Farrier Hoof Care schedule for (.*?) is overdue by (\d+) days/i);
    if (m) message = `Lịch đóng móng & chăm sóc móng cho ngựa ${m[1]} đã quá hạn ${m[2]} ngày.`;
  }

  if (/You have been assigned as primary groom for (.*?) at (.*?)\./i.test(n.message)) {
    const m = n.message.match(/You have been assigned as primary groom for (.*?) at (.*?)\./i);
    if (m) message = `Bạn được phân công làm người chăm sóc chính cho ngựa ${m[1]} tại chuồng ${m[2]}.`;
  }

  if (/(.*?) completed a trial workout session with score (.*?)\./i.test(n.message)) {
    const m = n.message.match(/(.*?) completed a trial workout session with score (.*?)\./i);
    if (m) message = `Ngựa ${m[1]} đã hoàn thành buổi tập với điểm số đạt được là ${m[2]}.`;
  }

  return { title, message, categoryLabel };
}


