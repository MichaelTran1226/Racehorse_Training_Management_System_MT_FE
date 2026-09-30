// NGUỒN SỰ THẬT DUY NHẤT về phân quyền. Sidebar, RoleGuard, trang Permissions đều đọc từ đây.
// Muốn đổi "vai trò nào được làm gì" thì chỉ sửa file này.

import { ROLES } from "@/shared/types/auth";
import type { NotifyKey, NotifyMap, PermissionKey, PermissionMap, Role } from "@/shared/types/auth";

export const ROLE_LABEL: Record<Role, string> = {
  HEAD_TRAINER: "Head Trainer",
  VETERINARIAN: "Veterinarian",
  GROOM: "Groom / Stable Hand",
  HORSE_OWNER: "Horse Owner",
  CLUB_MANAGER: "Club Manager",
};

// Tên "không gian" hiện ở breadcrumb (mục đầu tiên).
export const ROLE_WORKSPACE: Record<Role, string> = {
  HEAD_TRAINER: "Training workspace",
  VETERINARIAN: "Medical workspace",
  GROOM: "Stable workspace",
  HORSE_OWNER: "Owner workspace",
  CLUB_MANAGER: "Management workspace",
};

// ---------------------------------------------------------------- Quyền chức năng

export type PermissionGroup = "HORSE PROFILES" | "TRAINING" | "MEDICAL" | "ADMINISTRATION";
export const PERMISSION_GROUPS: PermissionGroup[] = ["HORSE PROFILES", "TRAINING", "MEDICAL", "ADMINISTRATION"];

export interface PermissionMeta {
  key: PermissionKey;
  group: PermissionGroup;
  name: string;
  note: string;
  // Quyền cốt lõi: luôn bật với mọi vai trò, không thu hồi được.
  core?: boolean;
  // Quyền thuộc về vai trò nào. Vai trò khác thấy công tắc bị khóa (disable + giải thích), không ẩn.
  ownerRoles?: Role[];
  ownerReason?: string;
  // Với các vai trò này quyền luôn bật (tránh Club Manager tự khóa mình).
  alwaysOnFor?: { roles: Role[]; reason: string };
  // Hậu quả khi thu hồi — nêu bằng số trong hộp xác nhận.
  revokeEffect: string;
}

export const PERMISSIONS: PermissionMeta[] = [
  {
    key: "viewHorses", group: "HORSE PROFILES", name: "View Horse Profiles", note: "Core permission for every role",
    core: true, revokeEffect: "",
  },
  {
    key: "editHorses", group: "HORSE PROFILES", name: "Create and edit a Horse Profile", note: "Name, breed, foaling date, stall",
    revokeEffect: "Horse Profiles stay visible but can no longer be created or edited by this account.",
  },
  {
    key: "deleteHorses", group: "HORSE PROFILES", name: "Delete or deactivate a Horse Profile", note: "Club Manager decision",
    ownerRoles: ["CLUB_MANAGER"], ownerReason: "Only the Club Manager can remove a Horse Profile.",
    revokeEffect: "This account can no longer delete or deactivate Horse Profiles.",
  },
  {
    key: "createPlan", group: "TRAINING", name: "Create and edit Training Plans", note: "Phases, distance, volume, surface",
    revokeEffect: "Two active Training Plans stay in place but can no longer be edited by this account.",
  },
  {
    key: "assignSchedule", group: "TRAINING", name: "Assign the daily schedule", note: "Sessions, horses and the care team",
    revokeEffect: "Four sessions already scheduled this week stay in place; new sessions can no longer be assigned.",
  },
  {
    key: "recordMetrics", group: "TRAINING", name: "Record session metrics", note: "Heart rate, speed, actual distance",
    revokeEffect: "Metrics already recorded stay in place; new session metrics can no longer be entered.",
  },
  {
    key: "ackAlerts", group: "TRAINING", name: "Acknowledge Threshold Alerts", note: "Required to clear a red alert",
    revokeEffect: "Open Threshold Alerts stay red until another account acknowledges them.",
  },
  {
    key: "viewMedical", group: "MEDICAL", name: "View medical records", note: "Read-only for a Head Trainer",
    revokeEffect: "Medical records disappear from the screens of this account.",
  },
  {
    key: "placeLock", group: "MEDICAL", name: "Place a Training Lock", note: "Veterinarian decision",
    ownerRoles: ["VETERINARIAN"], ownerReason: "Only a Veterinarian can place a Training Lock.",
    revokeEffect: "Training Locks already in force stay in place; this account can no longer place a new one.",
  },
  {
    key: "liftLock", group: "MEDICAL", name: "Lift a Training Lock", note: "Veterinarian decision",
    ownerRoles: ["VETERINARIAN"], ownerReason: "Only a Veterinarian can lift a Training Lock.",
    revokeEffect: "Locks in force can then be lifted only by another Veterinarian.",
  },
  {
    key: "manageAccounts", group: "ADMINISTRATION", name: "Manage accounts and permissions", note: "Club Manager decision",
    ownerRoles: ["CLUB_MANAGER"], ownerReason: "Only the Club Manager can manage accounts.",
    alwaysOnFor: { roles: ["CLUB_MANAGER"], reason: "The Club Manager always keeps account management." },
    revokeEffect: "This account can no longer approve, lock or edit accounts and permissions.",
  },
  {
    key: "viewAudit", group: "ADMINISTRATION", name: "View the Audit Log", note: "Read-only history of every change",
    revokeEffect: "The Audit Log is no longer readable by this account.",
  },
];

export function permissionMeta(key: PermissionKey): PermissionMeta {
  return PERMISSIONS.find((p) => p.key === key) as PermissionMeta;
}

export interface PermissionLock {
  locked: boolean;
  value?: boolean; // giá trị bị ép khi locked
  reason?: string;
}

// Công tắc của một quyền, xét theo vai trò của tài khoản đang xem.
export function permissionLock(role: Role, meta: PermissionMeta): PermissionLock {
  if (meta.core) return { locked: true, value: true, reason: "Core permission for every role; it cannot be revoked." };
  if (meta.alwaysOnFor?.roles.includes(role)) return { locked: true, value: true, reason: meta.alwaysOnFor.reason };
  if (meta.ownerRoles && !meta.ownerRoles.includes(role)) return { locked: true, value: false, reason: meta.ownerReason };
  return { locked: false };
}

const DEFAULT_ON: Record<Role, PermissionKey[]> = {
  HEAD_TRAINER: ["viewHorses", "editHorses", "createPlan", "assignSchedule", "recordMetrics", "ackAlerts", "viewMedical"],
  VETERINARIAN: ["viewHorses", "viewMedical", "placeLock", "liftLock"],
  GROOM: ["viewHorses"],
  HORSE_OWNER: ["viewHorses"],
  CLUB_MANAGER: ["viewHorses", "editHorses", "deleteHorses", "viewMedical", "manageAccounts", "viewAudit"],
};

export function defaultPermissions(role: Role): PermissionMap {
  const on = new Set(DEFAULT_ON[role]);
  return Object.fromEntries(PERMISSIONS.map((p) => [p.key, on.has(p.key)])) as PermissionMap;
}

// Ép các quyền bị khóa về đúng giá trị (dùng khi backend/mock nhận dữ liệu từ client).
export function normalizePermissions(role: Role, map: PermissionMap): PermissionMap {
  const out = { ...map };
  for (const meta of PERMISSIONS) {
    const lock = permissionLock(role, meta);
    if (lock.locked) out[meta.key] = !!lock.value;
  }
  return out;
}

// ---------------------------------------------------------------- Thông báo

export interface NotifyMeta {
  key: NotifyKey;
  name: string;
  note: string;
}

export const NOTIFY_META: NotifyMeta[] = [
  { key: "thresholdAlert", name: "Threshold Alerts", note: "Heart rate or speed over the plan limit" },
  { key: "lockLifted", name: "Training Lock lifted", note: "A Veterinarian releases a horse back to work" },
  { key: "dailyDigest", name: "Daily summary at 18:00", note: "Completed sessions and tomorrow’s schedule" },
  { key: "raceResults", name: "Race results", note: "A result is recorded for a club horse" },
];

export function defaultNotify(role: Role): NotifyMap {
  return { thresholdAlert: role === "HEAD_TRAINER", lockLifted: true, dailyDigest: false, raceResults: true };
}

// Threshold Alert: bắt buộc bật với Head Trainer, các vai trò khác không nhận.
export function notifyLock(role: Role, key: NotifyKey): PermissionLock {
  if (key !== "thresholdAlert") return { locked: false };
  return role === "HEAD_TRAINER"
    ? { locked: true, value: true, reason: "Mandatory for a Head Trainer; it cannot be switched off." }
    : { locked: true, value: false, reason: "Threshold Alerts go to the Head Trainer only." };
}

// ---------------------------------------------------------------- Điều hướng (Sidebar)

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  requires?: PermissionKey; // thiếu quyền này => mục không hiện trên sidebar và route trả 403
  alert?: boolean; // chấm đỏ: có việc đang chờ
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

function item(id: string, label: string, icon: string, extra: { requires?: PermissionKey; alert?: boolean } = {}): NavItem {
  // "permissions" dẫn tới danh sách tài khoản (nơi chọn tài khoản cần xem quyền).
  const href = id === "dashboard" ? "/dashboard" : id === "permissions" ? "/accounts" : `/${id}`;
  return { id, label, icon, href, ...extra };
}

export const ROLE_NAV: Record<Role, NavGroup[]> = {
  HEAD_TRAINER: [
    { label: "WORKSPACE", items: [item("dashboard", "Dashboard", "home"), item("horses", "Horses", "horse", { requires: "viewHorses" })] },
    {
      label: "TRAINING",
      items: [
        item("plans", "Training Plans", "clipboard", { requires: "createPlan" }),
        item("calendar", "Weekly Calendar", "calendar", { requires: "assignSchedule" }),
        item("trials", "Trial Runs", "play", { requires: "assignSchedule" }),
        item("metrics", "Session Metrics", "pulse", { requires: "recordMetrics" }),
      ],
    },
    {
      label: "MONITORING",
      items: [item("monitor", "Live Monitor", "activity"), item("alerts", "Threshold Alerts", "alert", { requires: "ackAlerts", alert: true })],
    },
    { label: "RACING", items: [item("races", "Race Entries", "trophy")] },
    { label: "REPORTS", items: [item("progress", "Training Progress", "chart")] },
    { label: "OTHER", items: [item("profile", "My Profile", "user")] },
  ],
  VETERINARIAN: [
    { label: "WORKSPACE", items: [item("dashboard", "Dashboard", "home"), item("horses", "Horses", "horse", { requires: "viewHorses" })] },
    {
      label: "MEDICAL",
      items: [
        item("herd", "Herd Health", "stethoscope", { requires: "viewMedical" }),
        item("records", "Medical Records", "file", { requires: "viewMedical" }),
        item("rx", "Prescriptions", "pill", { requires: "viewMedical" }),
        item("locks", "Training Locks", "lock", { requires: "placeLock", alert: true }),
        item("vaccine", "Vaccination Schedule", "syringe", { requires: "viewMedical" }),
      ],
    },
    { label: "REPORTS", items: [item("health-report", "Health Reports", "chart", { requires: "viewMedical" })] },
    { label: "OTHER", items: [item("profile", "My Profile", "user")] },
  ],
  GROOM: [
    { label: "WORKSPACE", items: [item("dashboard", "Dashboard", "home"), item("horses", "Horses", "horse", { requires: "viewHorses" })] },
    {
      label: "DAILY",
      items: [
        item("tasks", "Today's Tasks", "check", { alert: true }),
        item("stalls", "Stall Map", "grid"),
        item("rations", "Meal Rations", "wheat"),
        item("incidents", "Incident Reports", "camera"),
      ],
    },
    { label: "SUPPLIES", items: [item("supplies", "Supply Tracking", "package")] },
    { label: "OTHER", items: [item("profile", "My Profile", "user")] },
  ],
  HORSE_OWNER: [
    { label: "WORKSPACE", items: [item("dashboard", "Dashboard", "home"), item("my-horses", "My Horses", "horse", { requires: "viewHorses" })] },
    { label: "MONITORING", items: [item("progress", "Training Progress", "activity"), item("health", "Health Status", "stethoscope")] },
    { label: "REPORTS", items: [item("costs", "Cost Report", "dollar"), item("race-record", "Race Record", "trophy")] },
    { label: "OTHER", items: [item("profile", "My Profile", "user")] },
  ],
  CLUB_MANAGER: [
    { label: "WORKSPACE", items: [item("dashboard", "Dashboard", "home")] },
    {
      label: "ADMINISTRATION",
      items: [
        item("accounts", "Accounts", "users", { requires: "manageAccounts", alert: true }),
        item("permissions", "Permissions", "shield", { requires: "manageAccounts" }),
        item("staff", "Staff Directory", "user", { requires: "manageAccounts" }),
        item("catalog", "Supplies Catalog", "package", { requires: "manageAccounts" }),
      ],
    },
    { label: "MASTER DATA", items: [item("horses", "Horses", "horse", { requires: "viewHorses" }), item("stalls", "Stall Map", "grid")] },
    {
      label: "REPORTS",
      items: [
        item("performance", "Performance", "chart"),
        item("costs", "Operating Costs", "dollar"),
        item("audit", "Audit Log", "history", { requires: "viewAudit" }),
      ],
    },
    { label: "OTHER", items: [item("profile", "My Profile", "user")] },
  ],
};

// Sidebar chỉ hiện mục mà tài khoản được cấp quyền (xây từ danh sách quyền, không chỉ từ tên vai trò).
export function navFor(role: Role, permissions: PermissionMap): NavGroup[] {
  return ROLE_NAV[role]
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.requires || permissions[it.requires]) }))
    .filter((g) => g.items.length > 0);
}

export function isNavItemActive(navItem: NavItem, pathname: string): boolean {
  if (navItem.id === "permissions") return /^\/accounts\/[^/]+\/permissions/.test(pathname);
  if (navItem.id === "accounts") return pathname === "/accounts";
  return pathname === navItem.href || pathname.startsWith(navItem.href + "/");
}

// ---------------------------------------------------------------- Chặn route (RoleGuard đọc hàm này)

export interface ScreenAccess {
  allowed: boolean;
  group?: string; // "ADMINISTRATION"
  label?: string; // "Accounts"
  ownerRoles: Role[]; // vai trò sở hữu màn hình này
  inOwnRole: boolean; // màn hình có trong sidebar của vai trò hiện tại (nhưng chưa được cấp quyền)
}

const OPEN_PREFIXES = ["/dashboard", "/profile", "/forbidden", "/session-expired"];

function findByHref(groups: NavGroup[], href: string): { group: string; item: NavItem } | undefined {
  for (const g of groups) {
    const found = g.items.find((it) => it.href === href);
    if (found) return { group: g.label, item: found };
  }
  return undefined;
}

export function screenAccess(role: Role, permissions: PermissionMap, pathname: string): ScreenAccess {
  const open: ScreenAccess = { allowed: true, ownerRoles: [], inOwnRole: false };
  if (OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return open;

  if (pathname === "/accounts" || pathname.startsWith("/accounts/")) {
    return {
      allowed: !!permissions.manageAccounts,
      group: "ADMINISTRATION",
      label: "Accounts",
      ownerRoles: ["CLUB_MANAGER"],
      inOwnRole: role === "CLUB_MANAGER",
    };
  }

  const href = "/" + (pathname.split("/")[1] ?? "");
  const own = findByHref(ROLE_NAV[role], href);
  if (own) {
    const need = own.item.requires;
    return { allowed: !need || !!permissions[need], group: own.group, label: own.item.label, ownerRoles: [role], inOwnRole: true };
  }

  const owners = ROLES.filter((r) => r !== role && findByHref(ROLE_NAV[r], href));
  if (owners.length > 0) {
    const first = findByHref(ROLE_NAV[owners[0]], href)!;
    return { allowed: false, group: first.group, label: first.item.label, ownerRoles: owners, inOwnRole: false };
  }

  return open; // đường dẫn không tồn tại: để trang catch-all báo "not found"
}
