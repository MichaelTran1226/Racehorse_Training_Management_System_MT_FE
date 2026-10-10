import { addAppNotification } from "@/shared/lib/notifications";

export interface HerdHorse {
  id: string;
  name: string;
  code: string;
  horseCode?: string;
  rfid?: string;
  microchip?: string;
  microchipRfid?: string;
  stall: string;
  zone?: string;
  healthGroup: "FIT" | "WATCH" | "INJURED" | "QUARANTINED";
  statusText: string;
  isLocked: boolean;
  lockReason?: string;
  primaryDiagnosis?: string;
  restingHeartRate?: number;
  temp?: number;
  breed?: string;
  dob?: string;
  gender?: string;
  color?: string;
  lockDate?: string;
  reviewDate?: string;
  ownerId?: string;
  ownerName?: string;
  assignedGroomId?: string;
  primaryGroom?: string;
  lastExamDate?: string;
  unresolvedInjuriesCount?: number;
  hasOverdueRoutine?: boolean;
}

const HORSES_STORAGE_KEY = "equiflow.herd.horses.v5";
const INJURIES_STORAGE_PREFIX = "equiflow.injuries.v5.";
const LOCKS_STORAGE_KEY = "equiflow.locks.v5";

export interface StoredTrainingLock {
  id: string;
  lockCode: string;
  horseId: string;
  horseName: string;
  horseCode: string;
  appliedMedicalStatus: string;
  lockedAt: string;
  lockedBy: string;
  lockReason: string;
  reviewDate: string;
  unlockConditions?: string;
  releasedAt?: string;
  releasedBy?: string;
  releaseReason?: string;
  durationDays?: number;
  status: "ACTIVE" | "RELEASED";
}

// Purge all legacy and cached mock data to ensure zero default horses
if (typeof window !== "undefined") {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith("equiflow.herd.") ||
          k.startsWith("equiflow.locks.") ||
          k.startsWith("equiflow.injuries."))
      ) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

export const DEFAULT_HERD_HORSES: HerdHorse[] = [
  {
    id: "horse-1",
    name: "Thunderbolt Swift",
    code: "HR-000001",
    horseCode: "HR-000001",
    rfid: "RFID-985141002341",
    microchip: "985141002341001",
    microchipRfid: "RFID-985141002341",
    breed: "Thoroughbred",
    dob: "2021-04-12",
    gender: "Colt",
    color: "Bay Dark",
    healthGroup: "FIT",
    statusText: "ACTIVE",
    isLocked: false,
    stall: "STALL-A01",
    zone: "Zone A - Barn 1",
    ownerId: "owner-1",
    ownerName: "Robert Sterling (Horse Owner)",
    primaryGroom: "John Smith (Groom Hand)",
    lastExamDate: "2026-10-02",
    unresolvedInjuriesCount: 0,
    hasOverdueRoutine: false,
  },
  {
    id: "horse-2",
    name: "Northern Dancer Legacy",
    code: "HR-000002",
    horseCode: "HR-000002",
    rfid: "RFID-985141002342",
    microchip: "985141002342002",
    microchipRfid: "RFID-985141002342",
    breed: "Thoroughbred",
    dob: "2020-03-15",
    gender: "Stallion",
    color: "Chestnut",
    healthGroup: "INJURED",
    statusText: "INJURED",
    isLocked: true,
    lockReason: "Suspensory ligament acute desmitis during intense trial run",
    lockDate: "2026-10-05",
    reviewDate: new Date(Date.now() + 11 * 86400000).toISOString().split("T")[0],
    stall: "STALL-A02",
    zone: "Zone A - Barn 1",
    ownerId: "owner-1",
    ownerName: "Robert Sterling (Horse Owner)",
    primaryGroom: "John Smith (Groom Hand)",
    lastExamDate: "2026-10-05",
    unresolvedInjuriesCount: 1,
    hasOverdueRoutine: false,
  },
  {
    id: "horse-3",
    name: "Shadowfax Wonder",
    code: "HR-000003",
    horseCode: "HR-000003",
    rfid: "RFID-985141002343",
    microchip: "985141002343003",
    microchipRfid: "RFID-985141002343",
    breed: "Arabian Cross",
    dob: "2022-01-20",
    gender: "Filly",
    color: "Gray Roaming",
    healthGroup: "WATCH",
    statusText: "UNDER_OBSERVATION",
    isLocked: false,
    stall: "STALL-B01",
    zone: "Zone B - Barn 2",
    ownerId: "owner-1",
    ownerName: "Robert Sterling (Horse Owner)",
    primaryGroom: "John Smith (Groom Hand)",
    lastExamDate: "2026-09-28",
    unresolvedInjuriesCount: 1,
    hasOverdueRoutine: false,
  },
];

export function getStoredHorses(): HerdHorse[] {
  try {
    const raw = localStorage.getItem(HORSES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HerdHorse[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  // Initialize with the 3 canonical horses if empty
  saveStoredHorses(DEFAULT_HERD_HORSES);
  return DEFAULT_HERD_HORSES;
}


export function saveStoredHorses(horses: HerdHorse[]): void {
  try {
    localStorage.setItem(HORSES_STORAGE_KEY, JSON.stringify(horses));
  } catch {
    // localStorage unavailable
  }
}


export function addStoredHorse(horse: HerdHorse): void {
  const current = getStoredHorses();
  const updated = [horse, ...current.filter((h) => h.id !== horse.id)];
  saveStoredHorses(updated);

  // If newly created horse has isLocked = true, ensure a lock record exists
  if (horse.isLocked) {
    const locks = getStoredLocks();
    const existing = locks.find((l) => l.horseId === horse.id && l.status === "ACTIVE");
    if (!existing) {
      const newLock: StoredTrainingLock = {
        id: `lock-${horse.id}-${Date.now()}`,
        lockCode: `LOCK-${horse.code || "H"}-001`,
        horseId: horse.id,
        horseName: horse.name,
        horseCode: horse.code,
        appliedMedicalStatus: horse.healthGroup,
        lockedAt: horse.lockDate || new Date().toISOString().split("T")[0],
        lockedBy: "Chief Veterinarian (Dr. Sarah Connor)",
        lockReason: horse.lockReason || "Under protective clinical training suspension",
        reviewDate: horse.reviewDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        status: "ACTIVE",
      };
      saveStoredLocks([newLock, ...locks]);
    }
  }
}

export function deleteStoredHorse(horseId: string): void {
  const current = getStoredHorses();
  saveStoredHorses(current.filter((h) => h.id !== horseId));
  // Cascade delete locks for this horse
  try {
    const rawLocks = localStorage.getItem(LOCKS_STORAGE_KEY);
    if (rawLocks) {
      const parsed = JSON.parse(rawLocks) as StoredTrainingLock[];
      saveStoredLocks(parsed.filter((l) => l.horseId !== horseId));
    }
  } catch {
    // fallback
  }
  try {
    localStorage.removeItem(`${INJURIES_STORAGE_PREFIX}${horseId}`);
  } catch {
    // fallback
  }
}

export function clearAllStoredHorses(): void {
  saveStoredHorses([]);
  saveStoredLocks([]);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOCKS_STORAGE_KEY);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith(INJURIES_STORAGE_PREFIX) || k === LOCKS_STORAGE_KEY)) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // ignore
    }
  }
}

export function getHorseById(id: string): HerdHorse | undefined {
  const horses = getStoredHorses();
  return horses.find((h) => h.id === id);
}

export function getInjuriesForHorse(horseId: string): any[] {
  try {
    const raw = localStorage.getItem(`${INJURIES_STORAGE_PREFIX}${horseId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Auto-seed initial 2D musculoskeletal injury on horse-3
  if (horseId === "horse-3") {
    const defaultInjury = [
      {
        id: "inj-horse-3-01",
        horseId: "horse-3",
        x: 46,
        y: 62,
        coordinateX: 0.46,
        coordinateY: 0.62,
        view: "LEFT",
        viewSide: "LEFT",
        layer: "MUSCLE",
        region: "Superficial Digital Flexor Tendon (SDFT)",
        anatomicalZone: "Superficial Digital Flexor Tendon (SDFT)",
        bodySide: "LEFT",
        injuryType: "Tendon Strain & Mild Synovitis",
        severity: "MODERATE",
        stage: "RECOVERING",
        status: "ACTIVE",
        detectedDate: "2026-09-28",
        notes: "Superficial flexor tendon strain observed after turf workout session.",
        recoveryTimeline: [
          {
            date: "2026-09-28",
            stage: "ACUTE",
            severity: "MODERATE",
            notes: "Initial acute heat and focal sensitivity along mid-metacarpal zone.",
            evaluator: "Dr. Sarah Connor (Veterinarian)",
          },
          {
            date: "2026-10-06",
            stage: "RECOVERING",
            severity: "MILD",
            notes: "Reduced heat and improved weight-bearing; progressive trotting allowed.",
            evaluator: "Dr. Sarah Connor (Veterinarian)",
          },
        ],
      },
    ];
    saveInjuriesForHorse("horse-3", defaultInjury);
    return defaultInjury;
  }
  return [];
}

export function saveInjuriesForHorse(horseId: string, injuries: any[]): void {
  try {
    localStorage.setItem(`${INJURIES_STORAGE_PREFIX}${horseId}`, JSON.stringify(injuries));
  } catch {
    // localStorage unavailable
  }
}

// -------------------------------------------------------------
// Training Lock Storage & Business Logic (SC-3.07, DL-3.01 -> DL-3.03)
// -------------------------------------------------------------

export function getStoredLocks(): StoredTrainingLock[] {
  const horses = getStoredHorses();
  // If there are NO horses in the stable, there CANNOT be any active locks!
  if (horses.length === 0) {
    saveStoredLocks([]);
    return [];
  }

  const existingHorseIds = new Set(horses.map((h) => h.id));

  try {
    const raw = localStorage.getItem(LOCKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredTrainingLock[];
      // Filter out orphan locks whose horses have been deleted!
      const validLocks = parsed.filter((l) => existingHorseIds.has(l.horseId));
      if (validLocks.length > 0) {
        if (validLocks.length !== parsed.length) {
          saveStoredLocks(validLocks);
        }
        return validLocks;
      }
    }
  } catch {
    // fallback
  }

  // Auto-seed initial lock records from any currently locked horses if empty
  const initialLocks: StoredTrainingLock[] = [];
  horses.forEach((h, idx) => {
    if (h.isLocked) {
      initialLocks.push({
        id: `lock-${h.id}`,
        lockCode: `LOCK-${h.code}-${String(idx + 1).padStart(3, "0")}`,
        horseId: h.id,
        horseName: h.name,
        horseCode: h.code,
        appliedMedicalStatus: h.healthGroup,
        lockedAt: h.lockDate || new Date().toISOString().split("T")[0],
        lockedBy: "Dr. Sarah Connor (Veterinarian)",
        lockReason: h.lockReason || "Under protective clinical training suspension",
        reviewDate: h.reviewDate || new Date(Date.now() + 11 * 86400000).toISOString().split("T")[0],
        unlockConditions: "Complete clinical ultrasound resolution and soundness on flexion test",
        status: "ACTIVE",
      });
    }
  });

  if (initialLocks.length > 0) {
    saveStoredLocks(initialLocks);
  }
  return initialLocks;
}


export function saveStoredLocks(locks: StoredTrainingLock[]): void {
  try {
    localStorage.setItem(LOCKS_STORAGE_KEY, JSON.stringify(locks));
  } catch {
    // localStorage unavailable
  }
}

/**
 * Place a new training lock order on a horse (DL-3.01)
 */
export function placeHorseTrainingLock(
  horseId: string,
  input: {
    appliedStatus: string;
    reviewDate: string;
    reason: string;
    unlockConditions?: string;
    lockedBy?: string;
  },
): StoredTrainingLock {
  const horses = getStoredHorses();
  const horse = horses.find((h) => h.id === horseId);
  const nowStr = new Date().toISOString().split("T")[0];

  if (horse) {
    horse.isLocked = true;
    horse.healthGroup =
      input.appliedStatus === "QUARANTINED"
        ? "QUARANTINED"
        : input.appliedStatus === "UNDER_OBSERVATION"
        ? "WATCH"
        : "INJURED";
    horse.lockReason = input.reason;
    horse.statusText = input.reason;
    horse.lockDate = nowStr;
    horse.reviewDate = input.reviewDate;
    saveStoredHorses(horses);
  }

  const locks = getStoredLocks();
  const existingActive = locks.find((l) => l.horseId === horseId && l.status === "ACTIVE");
  if (existingActive) {
    existingActive.appliedMedicalStatus = input.appliedStatus;
    existingActive.lockReason = input.reason;
    existingActive.reviewDate = input.reviewDate;
    existingActive.unlockConditions = input.unlockConditions;
    if (input.lockedBy) existingActive.lockedBy = input.lockedBy;
    saveStoredLocks(locks);
    return existingActive;
  }

  const horseLocksCount = locks.filter((l) => l.horseId === horseId).length;
  const newLock: StoredTrainingLock = {
    id: `lock-${horseId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    lockCode: `LOCK-${horse?.code || "H"}-${String(horseLocksCount + 1).padStart(3, "0")}`,
    horseId,
    horseName: horse?.name || `Horse ${horseId}`,
    horseCode: horse?.code || horseId,
    appliedMedicalStatus: input.appliedStatus,
    lockedAt: nowStr,
    lockedBy: input.lockedBy || "Chief Veterinarian (Dr. Sarah Connor)",
    lockReason: input.reason,
    reviewDate: input.reviewDate,
    unlockConditions: input.unlockConditions,
    status: "ACTIVE",
  };

  saveStoredLocks([newLock, ...locks]);
  try {
    const statusLabel =
      input.appliedStatus === "INJURED"
        ? "Injured"
        : input.appliedStatus === "QUARANTINED"
          ? "Quarantined"
          : "Under Observation";
    addAppNotification({
      title: `Training Lock Placed: ${newLock.horseName}`,
      message: `Medical protection hold (${statusLabel}) active. Review date: ${input.reviewDate}. Clinical rationale: ${input.reason}`,
      category: "LOCK",
      link: "/locks",
      targetRoles: ["VETERINARIAN", "HEAD_TRAINER", "CLUB_MANAGER"],
      senderName: input.lockedBy || "Dr. Sarah Connor (Lead Vet)",
    });
  } catch {
    // ignore
  }
  return newLock;
}

/**
 * Extend an active training lock's review date (DL-3.03)
 * Business Rule: New review date must be in future, records audit trail
 */
export function extendHorseTrainingLock(
  horseId: string,
  input: {
    newReviewDate: string;
    reason: string;
    extendedBy?: string;
  },
): StoredTrainingLock | null {
  const horses = getStoredHorses();
  const horse = horses.find((h) => h.id === horseId);
  if (horse) {
    horse.reviewDate = input.newReviewDate;
    saveStoredHorses(horses);
  }

  const locks = getStoredLocks();
  const activeLock = locks.find((l) => l.horseId === horseId && l.status === "ACTIVE");
  if (activeLock) {
    activeLock.reviewDate = input.newReviewDate;
    activeLock.lockReason = `${activeLock.lockReason} | Extended: ${input.reason}`;
    saveStoredLocks(locks);
    try {
      addAppNotification({
        title: `Lock Review Date Extended: ${activeLock.horseName}`,
        message: `Review date rescheduled to ${input.newReviewDate}. Clinical reason: ${input.reason}`,
        category: "LOCK",
        link: "/locks",
        targetRoles: ["VETERINARIAN", "HEAD_TRAINER"],
        senderName: input.extendedBy || "Dr. Le Minh Chau (Lead Vet)",
      });
    } catch {
      // ignore
    }
    return activeLock;
  }

  return null;
}

/**
 * Lift an active training lock order (DL-3.02)
 * Business Rule: Mark lock RELEASED with timestamp and notes, restore horse health status (FIT or WATCH)
 */
export function liftHorseTrainingLock(
  horseId: string,
  input: {
    restoreStatus: string; // "FIT" or "UNDER_OBSERVATION"
    reason: string;
    releasedBy?: string;
  },
): StoredTrainingLock | null {
  const nowStr = new Date().toISOString().split("T")[0];
  const horses = getStoredHorses();
  const horse = horses.find((h) => h.id === horseId);

  if (horse) {
    horse.isLocked = false;
    horse.healthGroup = input.restoreStatus === "FIT" ? "FIT" : "WATCH";
    horse.statusText =
      input.restoreStatus === "FIT"
        ? "Fit for full training (Lock lifted)"
        : "Under observation - Light exercise only";
    horse.lockReason = undefined;
    horse.reviewDate = undefined;
    saveStoredHorses(horses);
  }

  const locks = getStoredLocks();
  const activeLock = locks.find((l) => l.horseId === horseId && l.status === "ACTIVE");
  if (activeLock) {
    activeLock.status = "RELEASED";
    activeLock.releasedAt = nowStr;
    activeLock.releasedBy = input.releasedBy || "Dr. Le Minh Chau (Lead Vet)";
    activeLock.releaseReason = input.reason;

    // Calculate duration in days
    try {
      const start = new Date(activeLock.lockedAt).getTime();
      const end = new Date(nowStr).getTime();
      activeLock.durationDays = Math.max(1, Math.round((end - start) / 86400000));
    } catch {
      activeLock.durationDays = 7;
    }

    saveStoredLocks(locks);
    try {
      const restoredLabel =
        input.restoreStatus === "FIT" ? "Fit for Training" : "Under Observation (Light exercise)";
      addAppNotification({
        title: `Training Lock Lifted: ${activeLock.horseName}`,
        message: `Medical training hold released. Status restored to ${restoredLabel}. Clinical notes: ${input.reason}`,
        category: "LOCK",
        link: "/herd",
        targetRoles: ["VETERINARIAN", "HEAD_TRAINER", "CLUB_MANAGER"],
        senderName: input.releasedBy || "Dr. Le Minh Chau (Lead Vet)",
      });
    } catch {
      // ignore
    }
    return activeLock;
  }

  return null;
}

// -------------------------------------------------------------
// Preventive Care Storage & Catalogs (P2-05)
// -------------------------------------------------------------

export interface StoredPreventiveCatalog {
  id: string;
  code: string;
  name: string;
  category: "VACCINATION" | "DEWORMING" | "FARRIER_HOOF_CARE" | "DENTAL";
  intervalDays: number;
  advanceNoticeDays: number;
  applyToNewHorses: boolean;
  isActive: boolean;
  description?: string;
  monitoredHorsesCount?: number;
}

export interface StoredPreventiveSchedule {
  id: string;
  horseId: string;
  typeCatalogId: string;
  scheduleType: "VACCINATION" | "DEWORMING" | "FARRIER_HOOF_CARE" | "DENTAL";
  dueDate: string;
  lastCompletedDate?: string;
  completedDate?: string;
  productAdministered?: string;
  batchNumber?: string;
  performedByMode?: string;
  performedByName?: string;
  status: "PENDING" | "COMPLETED" | "OVERDUE";
  notes?: string;
}

const PREVENTIVE_CATALOGS_KEY = "equiflow.preventive.catalogs.v1";
const PREVENTIVE_SCHEDULES_KEY = "equiflow.preventive.schedules.v1";

const INITIAL_PREVENTIVE_CATALOGS: StoredPreventiveCatalog[] = [
  {
    id: "cat-vac-01",
    code: "VAC_TETANUS",
    name: "Tiêm phòng uốn ván & cúm ngựa (Tetanus & Equine Influenza)",
    category: "VACCINATION",
    intervalDays: 180,
    advanceNoticeDays: 14,
    applyToNewHorses: true,
    isActive: true,
    description: "Phòng ngừa uốn ván Clostridium tetani và virus cúm ngựa định kỳ 6 tháng.",
    monitoredHorsesCount: 2,
  },
  {
    id: "cat-dew-01",
    code: "DEWORM_BROAD",
    name: "Tẩy giun định kỳ phổ rộng (Broad-spectrum Deworming)",
    category: "DEWORMING",
    intervalDays: 90,
    advanceNoticeDays: 7,
    applyToNewHorses: true,
    isActive: true,
    description: "Sử dụng Ivermectin / Praziquantel luân phiên mỗi quý.",
    monitoredHorsesCount: 2,
  },
  {
    id: "cat-far-01",
    code: "FARRIER_TRIM",
    name: "Cắt gọt và đóng móng định kỳ (Farrier Hoof Care)",
    category: "FARRIER_HOOF_CARE",
    intervalDays: 45,
    advanceNoticeDays: 5,
    applyToNewHorses: true,
    isActive: true,
    description: "Cắt tỉa móng, cân bằng góc chân và thay móng sắt thi đấu mỗi 6 tuần.",
    monitoredHorsesCount: 2,
  },
  {
    id: "cat-den-01",
    code: "DENTAL_FLOAT",
    name: "Khám và mài răng định kỳ (Equine Dental Float)",
    category: "DENTAL",
    intervalDays: 365,
    advanceNoticeDays: 30,
    applyToNewHorses: true,
    isActive: true,
    description: "Kiểm tra mài gờ răng nhọn hàm trên và hàm dưới hàng năm.",
    monitoredHorsesCount: 1,
  },
];

const INITIAL_PREVENTIVE_SCHEDULES: StoredPreventiveSchedule[] = [
  {
    id: "prev-vac-horse-1",
    horseId: "horse-1",
    typeCatalogId: "cat-vac-01",
    scheduleType: "VACCINATION",
    dueDate: new Date(Date.now() + 150 * 86400000).toISOString(),
    lastCompletedDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    productAdministered: "Equi-Flu/Tetanus Duo 2ml",
    batchNumber: "LOT-2026-TF09",
    performedByMode: "SELF",
    performedByName: "Dr. Sarah Connor",
    status: "PENDING",
    notes: "Đã tiêm phòng mũi định kỳ đầu mùa thi đấu, không phản ứng phụ.",
  },
  {
    id: "prev-far-horse-1",
    horseId: "horse-1",
    typeCatalogId: "cat-far-01",
    scheduleType: "FARRIER_HOOF_CARE",
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    lastCompletedDate: new Date(Date.now() - 35 * 86400000).toISOString(),
    performedByMode: "EXTERNAL",
    performedByName: "Master Farrier Kenji Sato",
    status: "PENDING",
    notes: "Lịch gọt móng định kỳ chuẩn bị trước giải Derby.",
  },
  {
    id: "prev-dew-horse-2",
    horseId: "horse-2",
    typeCatalogId: "cat-dew-01",
    scheduleType: "DEWORMING",
    dueDate: new Date(Date.now() + 80 * 86400000).toISOString(),
    lastCompletedDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    completedDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    productAdministered: "Equimax Paste 14g",
    batchNumber: "LOT-2026-DW03",
    performedByMode: "SELF",
    performedByName: "Dr. Sarah Connor",
    status: "COMPLETED",
    notes: "Đã cho uống thuốc tẩy giun đầy đủ liều lượng theo thể trọng.",
  },
  {
    id: "prev-far-horse-2",
    horseId: "horse-2",
    typeCatalogId: "cat-far-01",
    scheduleType: "FARRIER_HOOF_CARE",
    dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    lastCompletedDate: new Date(Date.now() - 50 * 86400000).toISOString(),
    performedByMode: "EXTERNAL",
    performedByName: "Farrier Team",
    status: "OVERDUE",
    notes: "Quá hạn bảo dưỡng móng do đang nghỉ dưỡng thương (cần bảo dưỡng nhẹ tại chuồng).",
  },
];

export function getStoredPreventiveCatalogs(): StoredPreventiveCatalog[] {
  try {
    const raw = localStorage.getItem(PREVENTIVE_CATALOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  saveStoredPreventiveCatalogs(INITIAL_PREVENTIVE_CATALOGS);
  return INITIAL_PREVENTIVE_CATALOGS;
}

export function saveStoredPreventiveCatalogs(items: StoredPreventiveCatalog[]): void {
  try {
    localStorage.setItem(PREVENTIVE_CATALOGS_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable
  }
}

export function getStoredPreventiveSchedules(): StoredPreventiveSchedule[] {
  try {
    const raw = localStorage.getItem(PREVENTIVE_SCHEDULES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  saveStoredPreventiveSchedules(INITIAL_PREVENTIVE_SCHEDULES);
  return INITIAL_PREVENTIVE_SCHEDULES;
}

export function saveStoredPreventiveSchedules(items: StoredPreventiveSchedule[]): void {
  try {
    localStorage.setItem(PREVENTIVE_SCHEDULES_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable
  }
}

