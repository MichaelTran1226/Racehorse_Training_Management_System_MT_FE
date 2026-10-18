// Thông báo giả cho chế độ mock (VITE_USE_MOCK=true). Chạy BE thật thì không dùng file này:
// thông báo đến từ API /notifications (xem shared/lib/notifications.ts).
import type { Role } from "@/shared/types/enums";
import type { AppNotification } from "@/shared/lib/notifications";

export interface MockNotification extends AppNotification {
  targetRoles: Role[];
}

const STORAGE_KEY = "equiflow.mock.notifications.v1";

const SEED: MockNotification[] = [
  // VETERINARIAN
  {
    id: "notif-vet-1",
    type: "LOCK_PLACED",
    title: "Active Medical Training Lock in Force",
    message: "Superficial digital flexor tendon desmitis protocol active for Northern Dancer Legacy (EQ-002).",
    category: "LOCK",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    read: false,
    link: "/locks",
    targetRoles: ["VETERINARIAN", "HEAD_TRAINER"],
    senderName: "Dr. Lê Minh Châu (Lead Vet)",
  },
  {
    id: "notif-vet-2",
    type: "GROOM_OBSERVATION",
    title: "Clinical Observation Recorded",
    message: "Groom reported slight warmth at left fetlock during morning stall walk for Northern Dancer Legacy.",
    category: "MEDICAL",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
    link: "/herd",
    targetRoles: ["VETERINARIAN"],
    senderName: "Phạm Thị Bình (Equine Groom)",
  },
  {
    id: "notif-vet-3",
    type: "FOLLOW_UP_REMINDER",
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
    type: "ACCOUNT_SIGNUP_REQUEST",
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
    type: "PERMISSION_REQUEST",
    title: "Permission Access Request",
    message: "Trần Văn Nam requested access permission to screen: Audit Log (Ref: 403-2609-0071).",
    category: "ACCOUNT",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    read: false,
    link: "/accounts",
    targetRoles: ["CLUB_MANAGER"],
    senderName: "Đinh Quang Trung",
  },
  {
    id: "notif-mgr-3",
    type: "COMPLIANCE_REPORT",
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
    type: "LOCK_PLACED",
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
    type: "WORKOUT_METRICS",
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

function readAll(): MockNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockNotification[];
  } catch {
    // localStorage bị chặn: dùng dữ liệu gieo sẵn
  }
  return SEED;
}

function writeAll(items: MockNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // bỏ qua
  }
}

export function mockNotificationsFor(role: Role): MockNotification[] {
  return readAll().filter((n) => n.targetRoles.includes(role));
}

export function updateMockNotifications(role: Role, change: (n: MockNotification) => MockNotification | null): void {
  const next: MockNotification[] = [];
  for (const n of readAll()) {
    if (!n.targetRoles.includes(role)) next.push(n);
    else {
      const changed = change(n);
      if (changed) next.push(changed);
    }
  }
  writeAll(next);
}

// Dữ liệu mock của Flow 3 (đặt/gỡ khóa) gọi hàm này để sinh thông báo giống BE.
export function addAppNotification(item: Omit<MockNotification, "id" | "createdAt" | "read">): void {
  writeAll([
    { ...item, id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), read: false },
    ...readAll(),
  ]);
}
