import type { Role } from "@/shared/types/enums";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: "LOCK" | "MEDICAL" | "TRAINING" | "ACCOUNT" | "SYSTEM";
  createdAt: string;
  read: boolean;
  link?: string;
  targetRoles: Role[];
  senderName?: string;
}

// Version v5 to automatically purge any legacy notifications and ensure full English
const NOTIFICATIONS_STORAGE_KEY = "equiflow.notifications.v5";
const NOTIFICATIONS_EVENT = "equiflow:notifications_updated";

if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("equiflow.notifications.v1");
    localStorage.removeItem("equiflow.notifications.v2");
    localStorage.removeItem("equiflow.notifications.v3");
    localStorage.removeItem("equiflow.notifications.v4");
  } catch {
    // ignore
  }
}

const INITIAL_ROLE_NOTIFICATIONS: AppNotification[] = [
  // VETERINARIAN
  {
    id: "notif-vet-1",
    title: "Active Medical Training Lock in Force",
    message: "Superficial digital flexor tendon desmitis protocol active for Northern Dancer Legacy (EQ-002).",
    category: "LOCK",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    read: false,
    link: "/locks",
    targetRoles: ["VETERINARIAN", "HEAD_TRAINER"],
    senderName: "Dr. Le Minh Chau (Lead Vet)",
  },
  {
    id: "notif-vet-2",
    title: "Clinical Observation Recorded",
    message: "Groom reported slight warmth at left fetlock during morning stall walk for Northern Dancer Legacy.",
    category: "MEDICAL",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
    link: "/herd",
    targetRoles: ["VETERINARIAN"],
    senderName: "Pham Thi Binh (Equine Groom)",
  },
  {
    id: "notif-vet-3",
    title: "Ultrasound Re-evaluation Reminder",
    message: "7-day post-injury ultrasound follow-up scheduled to evaluate lock release criteria.",
    category: "MEDICAL",
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    read: true,
    link: "/locks",
    targetRoles: ["VETERINARIAN"],
    senderName: "EquiFlow Veterinary Station",
  },

  // CLUB_MANAGER
  {
    id: "notif-mgr-1",
    title: "New Account Registration Request",
    message: "Nguyễn Hoàng Anh (HORSE_OWNER) submitted membership application (REQ-2609-012).",
    category: "ACCOUNT",
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    read: false,
    link: "/accounts",
    targetRoles: ["CLUB_MANAGER"],
    senderName: "Membership Intake",
  },
  {
    id: "notif-mgr-2",
    title: "Permission Access Request",
    message: "Trần Văn Nam requested access permission to screen: Audit Log (Ref: 403-2609-0071).",
    category: "ACCOUNT",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    read: false,
    link: "/accounts",
    targetRoles: ["CLUB_MANAGER"],
    senderName: "Trần Văn Nam (Head Trainer)",
  },
  {
    id: "notif-mgr-3",
    title: "Monthly Facility Compliance Report",
    message: "Q3 Equine health audit and medication stock verification report ready for sign-off.",
    category: "SYSTEM",
    createdAt: new Date(Date.now() - 28 * 3600000).toISOString(),
    read: true,
    link: "/audit",
    targetRoles: ["CLUB_MANAGER"],
    senderName: "Barn Operations",
  },

  // HEAD_TRAINER
  {
    id: "notif-trn-1",
    title: "Medical Training Lock Alert",
    message: "Northern Dancer Legacy is medically locked by Vet. Fast-work and gallop sessions are suspended.",
    category: "TRAINING",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    read: false,
    link: "/locks",
    targetRoles: ["HEAD_TRAINER"],
    senderName: "Dr. Lê Minh Châu (Lead Vet)",
  },
  {
    id: "notif-trn-2",
    title: "Workout Session Metrics Uploaded",
    message: "Sensor metrics uploaded for Thunderbolt Swift: Avg HR 118 bpm, Recovery 6 mins.",
    category: "TRAINING",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    read: true,
    link: "/plans",
    targetRoles: ["HEAD_TRAINER"],
    senderName: "Track Sensor Station",
  },
];

export function getStoredNotifications(userRole?: Role): AppNotification[] {
  let all: AppNotification[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) {
        all = JSON.parse(raw) as AppNotification[];
      } else {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_ROLE_NOTIFICATIONS));
        all = INITIAL_ROLE_NOTIFICATIONS;
      }
    } catch {
      all = INITIAL_ROLE_NOTIFICATIONS;
    }
  } else {
    all = INITIAL_ROLE_NOTIFICATIONS;
  }

  if (!userRole) return all;
  return all.filter((n) => !n.targetRoles || n.targetRoles.includes(userRole));
}

export function saveStoredNotifications(items: AppNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
  } catch {
    // ignore
  }
}

export function addAppNotification(item: {
  title: string;
  message: string;
  category: "LOCK" | "MEDICAL" | "TRAINING" | "ACCOUNT" | "SYSTEM";
  targetRoles: Role[];
  link?: string;
  senderName?: string;
}): AppNotification {
  let all: AppNotification[] = [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    all = raw ? (JSON.parse(raw) as AppNotification[]) : INITIAL_ROLE_NOTIFICATIONS;
  } catch {
    all = INITIAL_ROLE_NOTIFICATIONS;
  }

  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: item.title,
    message: item.message,
    category: item.category,
    createdAt: new Date().toISOString(),
    read: false,
    link: item.link,
    targetRoles: item.targetRoles,
    senderName: item.senderName,
  };

  saveStoredNotifications([newNotif, ...all]);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  let all: AppNotification[] = [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    all = raw ? (JSON.parse(raw) as AppNotification[]) : INITIAL_ROLE_NOTIFICATIONS;
  } catch {
    all = INITIAL_ROLE_NOTIFICATIONS;
  }
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
}

export function markAllNotificationsAsRead(userRole?: Role): void {
  let all: AppNotification[] = [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    all = raw ? (JSON.parse(raw) as AppNotification[]) : INITIAL_ROLE_NOTIFICATIONS;
  } catch {
    all = INITIAL_ROLE_NOTIFICATIONS;
  }
  const updated = all.map((n) => {
    if (!userRole || n.targetRoles.includes(userRole)) {
      return { ...n, read: true };
    }
    return n;
  });
  saveStoredNotifications(updated);
}

export function clearAllNotifications(userRole?: Role): void {
  if (!userRole) {
    saveStoredNotifications([]);
    return;
  }
  let all: AppNotification[] = [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    all = raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    all = [];
  }
  const remaining = all.filter((n) => !n.targetRoles.includes(userRole));
  saveStoredNotifications(remaining);
}

export function getUnreadNotificationsCount(userRole?: Role): number {
  const list = getStoredNotifications(userRole);
  return list.filter((n) => !n.read).length;
}

export function subscribeNotifications(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(NOTIFICATIONS_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
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

