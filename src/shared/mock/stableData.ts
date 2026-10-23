import type { SupplyCatalogItem, ShiftCatalogItem } from "@/features/master-data/types/supplies";
import type { ShiftRosterItem } from "@/features/stable/types/shiftRoster";
import type { StockItemRow, RestockRequestItem } from "@/features/stable/types/inventory";

const SUPPLIES_KEY = "equiflow.mock.supplies.v1";
const SHIFTS_KEY = "equiflow.mock.shifts.v1";
const ROSTERS_KEY = "equiflow.mock.shiftRosters.v1";
const STOCKS_KEY = "equiflow.mock.stocks.v1";
const RESTOCK_REQUESTS_KEY = "equiflow.mock.restockRequests.v1";

const DEFAULT_SUPPLIES: SupplyCatalogItem[] = [
  {
    id: "sup-1",
    code: "FEED-OAT-01",
    name: "Yến mạch nhập khẩu (Rolled Oats)",
    category: "FEED_GRAIN",
    unit: "KG",
    unitPrice: 28000,
    withdrawalDays: null,
    description: "Thức ăn tinh giàu năng lượng cho ngựa thi đấu",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "sup-2",
    code: "FEED-HAY-TIM",
    name: "Cỏ khô Timothy cao cấp",
    category: "FEED_HAY",
    unit: "KG",
    unitPrice: 150000,
    withdrawalDays: null,
    description: "Cỏ khô thô giàu xơ tiêu chuẩn",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "sup-3",
    code: "SUPP-ELEC-01",
    name: "Bột bù điện giải Post-Workout Electrolyte",
    category: "SUPPLEMENT_ELECTROLYTE",
    unit: "PACKET",
    unitPrice: 650000,
    withdrawalDays: 0,
    description: "Bù khoáng và cân bằng điện giải sau vận động",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "sup-4",
    code: "MED-BETAD-01",
    name: "Dung dịch sát trùng Betadine 10%",
    category: "MEDICINE",
    unit: "BOTTLE",
    unitPrice: 95000,
    withdrawalDays: 3,
    description: "Sát khuẩn vết thương và khử trùng móng",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "sup-5",
    code: "TOOL-BRUSH-01",
    name: "Bàn chải lông cứng Dandy Brush",
    category: "TOOL_EQUIPMENT",
    unit: "PIECE",
    unitPrice: 120000,
    withdrawalDays: null,
    description: "Dụng cụ vệ sinh lông ngựa chuyên dụng",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "sup-6",
    code: "CLEAN-DET-01",
    name: "Dung dịch tẩy rửa sát khuẩn chuồng StableClean",
    category: "CLEANING_SUPPLY",
    unit: "LITER",
    unitPrice: 180000,
    withdrawalDays: null,
    description: "Khử trùng sàn và tường ô chuồng",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
];

const DEFAULT_SHIFTS: ShiftCatalogItem[] = [
  {
    id: "shift-morning",
    code: "CA-SANG",
    name: "Ca Sáng",
    startTime: "06:00",
    endTime: "14:00",
    isOvernight: false,
    sortOrder: 1,
    description: "Cho ăn sáng, vệ sinh ô chuồng, hỗ trợ huấn luyện",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "shift-afternoon",
    code: "CA-CHIEU",
    name: "Ca Chiều",
    startTime: "14:00",
    endTime: "22:00",
    isOvernight: false,
    sortOrder: 2,
    description: "Cho ăn chiều, vệ sinh và kiểm tra móng",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "shift-night",
    code: "CA-TOI",
    name: "Ca Tối (Trực Đêm)",
    startTime: "22:00",
    endTime: "06:00",
    isOvernight: true,
    sortOrder: 3,
    description: "Tuần tra đêm, cấp nước và giám sát an ninh chuồng",
    isActive: true,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
];

export function getStoredSupplies(): SupplyCatalogItem[] {
  try {
    const raw = localStorage.getItem(SUPPLIES_KEY);
    if (!raw) {
      saveStoredSupplies(DEFAULT_SUPPLIES);
      return DEFAULT_SUPPLIES;
    }
    return JSON.parse(raw) as SupplyCatalogItem[];
  } catch {
    return DEFAULT_SUPPLIES;
  }
}

export function saveStoredSupplies(items: SupplyCatalogItem[]): void {
  localStorage.setItem(SUPPLIES_KEY, JSON.stringify(items));
}

export function getStoredShifts(): ShiftCatalogItem[] {
  try {
    const raw = localStorage.getItem(SHIFTS_KEY);
    if (!raw) {
      saveStoredShifts(DEFAULT_SHIFTS);
      return DEFAULT_SHIFTS;
    }
    return JSON.parse(raw) as ShiftCatalogItem[];
  } catch {
    return DEFAULT_SHIFTS;
  }
}

export function saveStoredShifts(items: ShiftCatalogItem[]): void {
  localStorage.setItem(SHIFTS_KEY, JSON.stringify(items));
}

export function getStoredRosters(): ShiftRosterItem[] {
  try {
    const raw = localStorage.getItem(ROSTERS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as ShiftRosterItem[];
  } catch {
    return [];
  }
}

export function saveStoredRosters(items: ShiftRosterItem[]): void {
  localStorage.setItem(ROSTERS_KEY, JSON.stringify(items));
}

const NUTRITION_KEY = "equiflow.mock.nutritionPlans.v1";

export interface MockNutritionPlanItem {
  id: string;
  planCode: string;
  horseId: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  dailyFeedWeightKg: number;
  targetWeightRatioPct: number;
  horseWeightSnapshot: number;
  horseWeight?: number;
  isWithinSafeRange?: boolean;
  mealsJson: Array<{
    mealType: 'MORNING' | 'NOON' | 'EVENING';
    time?: string;
    items: Array<{
      supplyId: string;
      supplyCode?: string;
      supplyName: string;
      category: string;
      amount: number;
      unit: string;
      notes?: string;
    }>;
  }>;
  specialInstructions?: string;
  createdById?: string;
  createdBy?: { id: string; fullName: string; role: string };
  approvedById?: string;
  approvedBy?: { id: string; fullName: string; role: string };
  approvedAt?: string;
  rejectionReason?: string;
  vetNotes?: string;
  validFrom: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_NUTRITION_PLANS: MockNutritionPlanItem[] = [
  {
    id: "np-001",
    planCode: "NP-2610-001",
    horseId: "h-01",
    status: "APPROVED",
    dailyFeedWeightKg: 10.5,
    targetWeightRatioPct: 2.1,
    horseWeightSnapshot: 500,
    horseWeight: 500,
    isWithinSafeRange: true,
    mealsJson: [
      {
        mealType: "MORNING",
        time: "06:00",
        items: [
          { supplyId: "sup-2", supplyCode: "FEED-HAY-TIM", supplyName: "Cỏ khô Timothy cao cấp", category: "FEED_HAY", amount: 3.5, unit: "KG", notes: "Lắc bụi trước khi cho ăn" },
          { supplyId: "sup-1", supplyCode: "FEED-OAT-01", supplyName: "Yến mạch nhập khẩu (Rolled Oats)", category: "FEED_GRAIN", amount: 1.0, unit: "KG" },
        ],
      },
      {
        mealType: "NOON",
        time: "11:30",
        items: [
          { supplyId: "sup-2", supplyCode: "FEED-HAY-TIM", supplyName: "Cỏ khô Timothy cao cấp", category: "FEED_HAY", amount: 2.5, unit: "KG" },
          { supplyId: "sup-3", supplyCode: "SUPP-ELEC-01", supplyName: "Bột bù điện giải Post-Workout Electrolyte", category: "SUPPLEMENT_ELECTROLYTE", amount: 1, unit: "PACKET", notes: "Pha cùng 20L nước sạch" },
        ],
      },
      {
        mealType: "EVENING",
        time: "17:00",
        items: [
          { supplyId: "sup-2", supplyCode: "FEED-HAY-TIM", supplyName: "Cỏ khô Timothy cao cấp", category: "FEED_HAY", amount: 3.5, unit: "KG" },
        ],
      },
    ],
    specialInstructions: "Sau khi tập nặng, cho nghỉ 30 phút trước khi ăn bữa trưa. Bổ sung cỏ thô tự do ban đêm.",
    createdById: "acc-ht",
    createdBy: { id: "acc-ht", fullName: "Đinh Quang Trung", role: "HEAD_TRAINER" },
    approvedById: "acc-vet",
    approvedBy: { id: "acc-vet", fullName: "BS. Nguyễn Văn Dũng", role: "VETERINARIAN" },
    approvedAt: "2026-10-15T10:00:00.000Z",
    vetNotes: "Khẩu phần cân bằng tốt cho giai đoạn duy trì thể lực chuẩn bị giải.",
    validFrom: "2026-10-15T00:00:00.000Z",
    createdAt: "2026-10-14T08:00:00.000Z",
    updatedAt: "2026-10-15T10:00:00.000Z",
  },
  {
    id: "np-002",
    planCode: "NP-2610-002",
    horseId: "h-02",
    status: "PENDING_APPROVAL",
    dailyFeedWeightKg: 11.2,
    targetWeightRatioPct: 2.3,
    horseWeightSnapshot: 480,
    horseWeight: 480,
    isWithinSafeRange: true,
    mealsJson: [
      {
        mealType: "MORNING",
        time: "06:00",
        items: [
          { supplyId: "sup-2", supplyCode: "FEED-HAY-TIM", supplyName: "Cỏ khô Timothy cao cấp", category: "FEED_HAY", amount: 4.0, unit: "KG" },
          { supplyId: "sup-1", supplyCode: "FEED-OAT-01", supplyName: "Yến mạch nhập khẩu (Rolled Oats)", category: "FEED_GRAIN", amount: 1.2, unit: "KG" },
        ],
      },
      {
        mealType: "NOON",
        time: "11:30",
        items: [
          { supplyId: "sup-2", supplyCode: "FEED-HAY-TIM", supplyName: "Cỏ khô Timothy cao cấp", category: "FEED_HAY", amount: 2.5, unit: "KG" },
        ],
      },
      {
        mealType: "EVENING",
        time: "17:00",
        items: [
          { supplyId: "sup-2", supplyCode: "FEED-HAY-TIM", supplyName: "Cỏ khô Timothy cao cấp", category: "FEED_HAY", amount: 3.5, unit: "KG" },
        ],
      },
    ],
    specialInstructions: "Tăng lượng yến mạch thêm 200g so với tuần trước do bắt đầu chu kỳ tập tốc độ cao.",
    createdById: "acc-ht",
    createdBy: { id: "acc-ht", fullName: "Đinh Quang Trung", role: "HEAD_TRAINER" },
    validFrom: "2026-10-18T00:00:00.000Z",
    createdAt: "2026-10-17T14:30:00.000Z",
    updatedAt: "2026-10-17T14:30:00.000Z",
  },
];

export function getStoredNutritionPlans(): MockNutritionPlanItem[] {
  try {
    const raw = localStorage.getItem(NUTRITION_KEY);
    if (!raw) {
      saveStoredNutritionPlans(DEFAULT_NUTRITION_PLANS);
      return DEFAULT_NUTRITION_PLANS;
    }
    return JSON.parse(raw) as MockNutritionPlanItem[];
  } catch {
    return DEFAULT_NUTRITION_PLANS;
  }
}

export function saveStoredNutritionPlans(items: MockNutritionPlanItem[]): void {
  localStorage.setItem(NUTRITION_KEY, JSON.stringify(items));
}

// -------------------------------------------------------------
// FLOW 4 - PHASE 3: DAILY CARE TASKS & INCIDENTS MOCKS
// -------------------------------------------------------------

import type { DailyCareTask } from "@/features/stable/types/dailyTasks";
import type { IncidentReport } from "@/features/stable/types/incidents";

const TASKS_KEY = "equiflow.mock.dailyTasks.v1";
const INCIDENTS_KEY = "equiflow.mock.incidents.v1";

const TODAY_STR = new Date().toISOString().slice(0, 10);

const DEFAULT_DAILY_TASKS: DailyCareTask[] = [
  {
    id: "tsk-001",
    taskCode: `TSK-${TODAY_STR.replace(/-/g, "")}-001`,
    date: TODAY_STR,
    horseId: "h-01",
    horse: {
      id: "h-01",
      name: "Bạch Mã Hoàng Tử (Flash)",
      horseCode: "EQ-2024-001",
      avatarUrl: undefined,
      status: "ACTIVE",
      isMedicalLocked: false,
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    stallId: "stall-a01",
    stall: { id: "stall-a01", code: "A-01", zone: "Khu Chuồng A" },
    taskType: "FEEDING",
    title: "Cho ăn bữa Sáng: Cỏ khô Timothy + Cám yến mạch",
    description: "Thực đơn đã duyệt: Cỏ khô Timothy: 4.0kg + Yến mạch: 1.5kg",
    mealType: "MORNING",
    scheduledTime: "06:00",
    isMedicalLocked: false,
    isCompleted: true,
    completedAt: `${TODAY_STR}T06:15:00.000Z`,
    completedById: "acc-groom",
    completedBy: { id: "acc-groom", fullName: "Trần Văn Nam", role: "GROOM" },
    assignedGroomUserId: "acc-groom",
    assignedGroom: { id: "acc-groom", fullName: "Trần Văn Nam" },
    undoUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    createdAt: `${TODAY_STR}T00:05:00.000Z`,
    updatedAt: `${TODAY_STR}T06:15:00.000Z`,
  },
  {
    id: "tsk-002",
    taskCode: `TSK-${TODAY_STR.replace(/-/g, "")}-002`,
    date: TODAY_STR,
    horseId: "h-01",
    horse: {
      id: "h-01",
      name: "Bạch Mã Hoàng Tử (Flash)",
      horseCode: "EQ-2024-001",
      avatarUrl: undefined,
      status: "ACTIVE",
      isMedicalLocked: false,
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    stallId: "stall-a01",
    stall: { id: "stall-a01", code: "A-01", zone: "Khu Chuồng A" },
    taskType: "CLEANING",
    title: "Vệ sinh ô chuồng & dọn phân buổi sáng",
    description: "Dọn sạch phân, thay rơm lót chuồng mới, khử trùng đáy chuồng và kiểm tra máng nước tự động.",
    mealType: null,
    scheduledTime: "07:00",
    isMedicalLocked: false,
    isCompleted: true,
    completedAt: `${TODAY_STR}T07:20:00.000Z`,
    completedById: "acc-groom",
    completedBy: { id: "acc-groom", fullName: "Trần Văn Nam", role: "GROOM" },
    assignedGroomUserId: "acc-groom",
    assignedGroom: { id: "acc-groom", fullName: "Trần Văn Nam" },
    undoUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    createdAt: `${TODAY_STR}T00:05:00.000Z`,
    updatedAt: `${TODAY_STR}T07:20:00.000Z`,
  },
  {
    id: "tsk-003",
    taskCode: `TSK-${TODAY_STR.replace(/-/g, "")}-003`,
    date: TODAY_STR,
    horseId: "h-01",
    horse: {
      id: "h-01",
      name: "Bạch Mã Hoàng Tử (Flash)",
      horseCode: "EQ-2024-001",
      avatarUrl: undefined,
      status: "ACTIVE",
      isMedicalLocked: false,
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    stallId: "stall-a01",
    stall: { id: "stall-a01", code: "A-01", zone: "Khu Chuồng A" },
    taskType: "FEEDING",
    title: "Cho ăn bữa Trưa: Cỏ khô Timothy + Điện giải",
    description: "Thực đơn đã duyệt: Cỏ khô Timothy: 2.5kg + Nước bù điện giải Post-Workout: 1 gói",
    mealType: "NOON",
    scheduledTime: "11:30",
    isMedicalLocked: false,
    isCompleted: false,
    assignedGroomUserId: "acc-groom",
    assignedGroom: { id: "acc-groom", fullName: "Trần Văn Nam" },
    createdAt: `${TODAY_STR}T00:05:00.000Z`,
    updatedAt: `${TODAY_STR}T00:05:00.000Z`,
  },
  {
    id: "tsk-004",
    taskCode: `TSK-${TODAY_STR.replace(/-/g, "")}-004`,
    date: TODAY_STR,
    horseId: "h-01",
    horse: {
      id: "h-01",
      name: "Bạch Mã Hoàng Tử (Flash)",
      horseCode: "EQ-2024-001",
      avatarUrl: undefined,
      status: "ACTIVE",
      isMedicalLocked: false,
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    stallId: "stall-a01",
    stall: { id: "stall-a01", code: "A-01", zone: "Khu Chuồng A" },
    taskType: "GROOMING",
    title: "Tắm rửa, chải lông móng & kiểm tra thể trạng",
    description: "Tắm mát, chải mượt bờm lông, cạo sạch sỏi bùn trong lòng móng và lau khô chân ngựa.",
    mealType: null,
    scheduledTime: "14:00",
    isMedicalLocked: false,
    isCompleted: false,
    assignedGroomUserId: "acc-groom",
    assignedGroom: { id: "acc-groom", fullName: "Trần Văn Nam" },
    createdAt: `${TODAY_STR}T00:05:00.000Z`,
    updatedAt: `${TODAY_STR}T00:05:00.000Z`,
  },
  {
    id: "tsk-005",
    taskCode: `TSK-${TODAY_STR.replace(/-/g, "")}-005`,
    date: TODAY_STR,
    horseId: "h-01",
    horse: {
      id: "h-01",
      name: "Bạch Mã Hoàng Tử (Flash)",
      horseCode: "EQ-2024-001",
      avatarUrl: undefined,
      status: "ACTIVE",
      isMedicalLocked: false,
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    stallId: "stall-a01",
    stall: { id: "stall-a01", code: "A-01", zone: "Khu Chuồng A" },
    taskType: "FEEDING",
    title: "Cho ăn bữa Tối: Cỏ khô Timothy",
    description: "Thực đơn đã duyệt: Cỏ khô Timothy: 3.5kg",
    mealType: "EVENING",
    scheduledTime: "17:00",
    isMedicalLocked: false,
    isCompleted: false,
    assignedGroomUserId: "acc-groom",
    assignedGroom: { id: "acc-groom", fullName: "Trần Văn Nam" },
    createdAt: `${TODAY_STR}T00:05:00.000Z`,
    updatedAt: `${TODAY_STR}T00:05:00.000Z`,
  },
  // Ngựa h-02: Bị Medical Lock
  {
    id: "tsk-006",
    taskCode: `TSK-${TODAY_STR.replace(/-/g, "")}-006`,
    date: TODAY_STR,
    horseId: "h-02",
    horse: {
      id: "h-02",
      name: "Hắc Long (Thunder)",
      horseCode: "EQ-2024-002",
      avatarUrl: undefined,
      status: "INJURED",
      isMedicalLocked: true,
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    stallId: "stall-a02",
    stall: { id: "stall-a02", code: "A-02", zone: "Khu Chuồng A" },
    taskType: "ICE_BOOT_REST",
    title: "Ngâm chân nước đá phục hồi buổi sáng (Khóa y tế)",
    description: "Ngựa có Khóa Huấn Luyện Y Tế. Thực hiện ngâm chân nước đá 20 phút cho chân đau/khớp viêm, sau đó để ngựa nghỉ ngơi tại ô.",
    mealType: null,
    scheduledTime: "09:30",
    isMedicalLocked: true,
    medicalLockNotes: "Khóa y tế: Viêm gân cổ chân sau bên trái. Tuyệt đối không vận động mạnh.",
    isCompleted: true,
    completedAt: `${TODAY_STR}T09:40:00.000Z`,
    completedById: "acc-groom",
    completedBy: { id: "acc-groom", fullName: "Trần Văn Nam", role: "GROOM" },
    assignedGroomUserId: "acc-groom",
    assignedGroom: { id: "acc-groom", fullName: "Trần Văn Nam" },
    undoUntil: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    createdAt: `${TODAY_STR}T00:05:00.000Z`,
    updatedAt: `${TODAY_STR}T09:40:00.000Z`,
  },
  {
    id: "tsk-007",
    taskCode: `TSK-${TODAY_STR.replace(/-/g, "")}-007`,
    date: TODAY_STR,
    horseId: "h-02",
    horse: {
      id: "h-02",
      name: "Hắc Long (Thunder)",
      horseCode: "EQ-2024-002",
      avatarUrl: undefined,
      status: "INJURED",
      isMedicalLocked: true,
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    stallId: "stall-a02",
    stall: { id: "stall-a02", code: "A-02", zone: "Khu Chuồng A" },
    taskType: "FEEDING",
    title: "Cho ăn bữa Trưa: Cỏ khô Timothy giảm calo",
    description: "Thực đơn dinh dưỡng hồi phục: Cỏ khô Timothy: 2.5kg",
    mealType: "NOON",
    scheduledTime: "11:30",
    isMedicalLocked: true,
    medicalLockNotes: "Khóa y tế: Giảm 20% năng lượng khẩu phần tránh tăng cân khi nghỉ tập.",
    isCompleted: false,
    assignedGroomUserId: "acc-groom",
    assignedGroom: { id: "acc-groom", fullName: "Trần Văn Nam" },
    createdAt: `${TODAY_STR}T00:05:00.000Z`,
    updatedAt: `${TODAY_STR}T00:05:00.000Z`,
  },
  {
    id: "tsk-008",
    taskCode: `TSK-${TODAY_STR.replace(/-/g, "")}-008`,
    date: TODAY_STR,
    horseId: "h-02",
    horse: {
      id: "h-02",
      name: "Hắc Long (Thunder)",
      horseCode: "EQ-2024-002",
      avatarUrl: undefined,
      status: "INJURED",
      isMedicalLocked: true,
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    stallId: "stall-a02",
    stall: { id: "stall-a02", code: "A-02", zone: "Khu Chuồng A" },
    taskType: "ICE_BOOT_REST",
    title: "Chườm lạnh & Theo dõi vết thương buổi chiều",
    description: "Kiểm tra lại khớp/vết thương, chườm lạnh 15 phút. Tuyệt đối không dắt chạy nhanh hay để ngựa vận động mạnh.",
    mealType: null,
    scheduledTime: "15:30",
    isMedicalLocked: true,
    medicalLockNotes: "Khóa y tế: Theo dõi phản ứng sưng nóng sau ngâm đá.",
    isCompleted: false,
    assignedGroomUserId: "acc-groom",
    assignedGroom: { id: "acc-groom", fullName: "Trần Văn Nam" },
    createdAt: `${TODAY_STR}T00:05:00.000Z`,
    updatedAt: `${TODAY_STR}T00:05:00.000Z`,
  },
];

const DEFAULT_INCIDENTS: IncidentReport[] = [
  {
    id: "inc-001",
    incidentNumber: "INC-2610-0001",
    horseId: "h-02",
    horse: {
      id: "h-02",
      name: "Hắc Long (Thunder)",
      horseCode: "EQ-2024-002",
      avatarUrl: undefined,
      status: "INJURED",
      isMedicalLocked: true,
      stallAllocations: [{ stall: { code: "A-02", zone: "Khu Chuồng A" } }],
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    reportedById: "acc-groom",
    reportedBy: { id: "acc-groom", fullName: "Trần Văn Nam", role: "GROOM" },
    severity: "CRITICAL",
    symptomsJson: ["COLIC", "LOSS_OF_APPETITE"],
    description: "Ngựa quằn quại đau bụng dữ dội, cào chân liên tục vào máng cỏ và lăn 3 lần trên rơm. Thân nhiệt đo sơ bộ 38.9°C.",
    status: "UNDER_REVIEW",
    vetNotes: "Bác sĩ Dũng đã tiếp nhận lúc 08:30, đang chuẩn bị ống thông dạ dày và thuốc giảm đau chống co thắt Buscopan.",
    reviewedById: "acc-vet",
    reviewedBy: { id: "acc-vet", fullName: "BS. Nguyễn Văn Dũng", role: "VETERINARIAN" },
    reviewedAt: `${TODAY_STR}T08:30:00.000Z`,
    createdAt: `${TODAY_STR}T08:15:00.000Z`,
    updatedAt: `${TODAY_STR}T08:30:00.000Z`,
  },
  {
    id: "inc-002",
    incidentNumber: "INC-2610-0002",
    horseId: "h-01",
    horse: {
      id: "h-01",
      name: "Bạch Mã Hoàng Tử (Flash)",
      horseCode: "EQ-2024-001",
      avatarUrl: undefined,
      status: "ACTIVE",
      isMedicalLocked: false,
      stallAllocations: [{ stall: { code: "A-01", zone: "Khu Chuồng A" } }],
    },
    stallZoneId: "zone-a",
    stallZone: { id: "zone-a", code: "ZONE-A", name: "Khu Chuồng A (Đua)" },
    reportedById: "acc-groom",
    reportedBy: { id: "acc-groom", fullName: "Trần Văn Nam", role: "GROOM" },
    severity: "MILD",
    symptomsJson: ["HOOF_INJURY"],
    description: "Phát hiện vết xước nông ở vành móng trước bên trái, không chảy máu, ngựa đi lại bình thường không khập khiễng.",
    status: "RESOLVED",
    vetNotes: "Đã sát trùng bằng Betadine và thoa mỡ kháng khuẩn. Cho phép tiếp tục bài tập bình thường.",
    reviewedById: "acc-vet",
    reviewedBy: { id: "acc-vet", fullName: "BS. Nguyễn Văn Dũng", role: "VETERINARIAN" },
    reviewedAt: `${TODAY_STR}T10:00:00.000Z`,
    createdAt: `${TODAY_STR}T09:00:00.000Z`,
    updatedAt: `${TODAY_STR}T10:00:00.000Z`,
  },
];

export function getStoredDailyTasks(): DailyCareTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      saveStoredDailyTasks(DEFAULT_DAILY_TASKS);
      return DEFAULT_DAILY_TASKS;
    }
    return JSON.parse(raw) as DailyCareTask[];
  } catch {
    return DEFAULT_DAILY_TASKS;
  }
}

export function saveStoredDailyTasks(items: DailyCareTask[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(items));
}

export function getStoredIncidents(): IncidentReport[] {
  try {
    const raw = localStorage.getItem(INCIDENTS_KEY);
    if (!raw) {
      saveStoredIncidents(DEFAULT_INCIDENTS);
      return DEFAULT_INCIDENTS;
    }
    return JSON.parse(raw) as IncidentReport[];
  } catch {
    return DEFAULT_INCIDENTS;
  }
}

export function saveStoredIncidents(items: IncidentReport[]): void {
  localStorage.setItem(INCIDENTS_KEY, JSON.stringify(items));
}

export const DEFAULT_STOCKS: StockItemRow[] = [
  {
    id: "zone-a_sup-1",
    zoneId: "zone-a",
    zoneCode: "ZA",
    zoneName: "Zone A - Thoroughbred Racing",
    supplyId: "sup-1",
    supplyCode: "FEED-OAT-01",
    supplyName: "Yến mạch nhập khẩu (Rolled Oats)",
    category: "FEED",
    unit: "KG",
    quantity: 120,
    minThreshold: 30,
    status: "SUFFICIENT",
    lastInventoryDate: `${TODAY_STR}T08:00:00.000Z`,
    lastAdjustedBy: { id: "acc-manager", fullName: "Trần Quản Lý", role: "CLUB_MANAGER" },
    notes: "Kiểm kê định kỳ đầu tuần",
  },
  {
    id: "zone-a_sup-2",
    zoneId: "zone-a",
    zoneCode: "ZA",
    zoneName: "Zone A - Thoroughbred Racing",
    supplyId: "sup-2",
    supplyCode: "FEED-HAY-TIM",
    supplyName: "Cỏ khô Timothy cao cấp",
    category: "FEED",
    unit: "KG",
    quantity: 12,
    minThreshold: 25,
    status: "LOW_STOCK",
    lastInventoryDate: `${TODAY_STR}T08:00:00.000Z`,
    lastAdjustedBy: { id: "acc-manager", fullName: "Trần Quản Lý", role: "CLUB_MANAGER" },
    notes: "Đang tiêu hao nhanh, cần bổ sung gấp",
  },
  {
    id: "zone-a_sup-3",
    zoneId: "zone-a",
    zoneCode: "ZA",
    zoneName: "Zone A - Thoroughbred Racing",
    supplyId: "sup-3",
    supplyCode: "SUPP-ELEC-01",
    supplyName: "Bột bù điện giải Post-Workout Electrolyte",
    category: "CARE",
    unit: "PACKET",
    quantity: 0,
    minThreshold: 10,
    status: "OUT_OF_STOCK",
    lastInventoryDate: `${TODAY_STR}T08:00:00.000Z`,
    lastAdjustedBy: { id: "acc-manager", fullName: "Trần Quản Lý", role: "CLUB_MANAGER" },
    notes: "Đã hết hàng sáng nay sau buổi tập",
  },
  {
    id: "zone-b_sup-1",
    zoneId: "zone-b",
    zoneCode: "ZB",
    zoneName: "Zone B - Warmblood & Crossbred",
    supplyId: "sup-1",
    supplyCode: "FEED-OAT-01",
    supplyName: "Yến mạch nhập khẩu (Rolled Oats)",
    category: "FEED",
    unit: "KG",
    quantity: 85,
    minThreshold: 25,
    status: "SUFFICIENT",
    lastInventoryDate: `${TODAY_STR}T08:00:00.000Z`,
    lastAdjustedBy: { id: "acc-manager", fullName: "Trần Quản Lý", role: "CLUB_MANAGER" },
    notes: null,
  },
  {
    id: "zone-b_sup-4",
    zoneId: "zone-b",
    zoneCode: "ZB",
    zoneName: "Zone B - Warmblood & Crossbred",
    supplyId: "sup-4",
    supplyCode: "MED-BETAD-01",
    supplyName: "Dung dịch sát trùng Betadine 10%",
    category: "MEDICINE",
    unit: "BOTTLE",
    quantity: 8,
    minThreshold: 3,
    status: "SUFFICIENT",
    lastInventoryDate: `${TODAY_STR}T08:00:00.000Z`,
    lastAdjustedBy: { id: "acc-vet", fullName: "BS. Nguyễn Văn Dũng", role: "VETERINARIAN" },
    notes: "Tủ thuốc khu B đầy đủ",
  },
  {
    id: "zone-c_sup-2",
    zoneId: "zone-c",
    zoneCode: "ZC",
    zoneName: "Zone C - Recovery & Quarantine",
    supplyId: "sup-2",
    supplyCode: "FEED-HAY-TIM",
    supplyName: "Cỏ khô Timothy cao cấp",
    category: "FEED",
    unit: "KG",
    quantity: 5,
    minThreshold: 15,
    status: "LOW_STOCK",
    lastInventoryDate: `${TODAY_STR}T08:00:00.000Z`,
    lastAdjustedBy: { id: "acc-manager", fullName: "Trần Quản Lý", role: "CLUB_MANAGER" },
    notes: "Chuồng cách ly đang cần cỏ mềm",
  },
];

export const DEFAULT_RESTOCK_REQUESTS: RestockRequestItem[] = [
  {
    id: "req-1",
    requestNumber: "REQ-2610-0001",
    zoneId: "zone-a",
    zone: { id: "zone-a", code: "ZA", name: "Zone A - Thoroughbred Racing" },
    supplyId: "sup-2",
    supply: {
      id: "sup-2",
      code: "FEED-HAY-TIM",
      name: "Cỏ khô Timothy cao cấp",
      category: "FEED",
      unit: "KG",
    },
    requestedQuantity: 50,
    approvedQuantity: null,
    status: "PENDING",
    urgencyReason: "Kho khu chuồng A sắp hết cỏ khô ăn sáng mai. Cần cấp bù ngay.",
    rejectionReason: null,
    deliveryNotes: null,
    requestedById: "acc-groom",
    requestedBy: { id: "acc-groom", fullName: "Lê Hoàng Nam", role: "GROOM" },
    reviewedById: null,
    reviewedBy: null,
    deliveredById: null,
    deliveredBy: null,
    createdAt: `${TODAY_STR}T08:30:00.000Z`,
    updatedAt: `${TODAY_STR}T08:30:00.000Z`,
    reviewedAt: null,
    deliveredAt: null,
  },
  {
    id: "req-2",
    requestNumber: "REQ-2610-0002",
    zoneId: "zone-a",
    zone: { id: "zone-a", code: "ZA", name: "Zone A - Thoroughbred Racing" },
    supplyId: "sup-3",
    supply: {
      id: "sup-3",
      code: "SUPP-ELEC-01",
      name: "Bột bù điện giải Post-Workout Electrolyte",
      category: "CARE",
      unit: "PACKET",
    },
    requestedQuantity: 20,
    approvedQuantity: 20,
    status: "APPROVED",
    urgencyReason: "Đã hết hàng tồn. Ngựa thi đấu cần bù nước và điện giải sau bài tập chiều.",
    rejectionReason: null,
    deliveryNotes: null,
    requestedById: "acc-trainer",
    requestedBy: { id: "acc-trainer", fullName: "Nguyễn Văn Hùng", role: "HEAD_TRAINER" },
    reviewedById: "acc-manager",
    reviewedBy: { id: "acc-manager", fullName: "Trần Quản Lý", role: "CLUB_MANAGER" },
    deliveredById: null,
    deliveredBy: null,
    createdAt: `${TODAY_STR}T07:15:00.000Z`,
    updatedAt: `${TODAY_STR}T08:00:00.000Z`,
    reviewedAt: `${TODAY_STR}T08:00:00.000Z`,
    deliveredAt: null,
  },
  {
    id: "req-3",
    requestNumber: "REQ-2610-0003",
    zoneId: "zone-b",
    zone: { id: "zone-b", code: "ZB", name: "Zone B - Warmblood & Crossbred" },
    supplyId: "sup-4",
    supply: {
      id: "sup-4",
      code: "MED-BETAD-01",
      name: "Dung dịch sát trùng Betadine 10%",
      category: "MEDICINE",
      unit: "BOTTLE",
    },
    requestedQuantity: 5,
    approvedQuantity: 5,
    status: "DELIVERED",
    urgencyReason: "Bổ sung tủ thuốc sơ cứu chuồng cách ly định kỳ.",
    rejectionReason: null,
    deliveryNotes: "Đã bàn giao cho Groom phụ trách khu B",
    requestedById: "acc-vet",
    requestedBy: { id: "acc-vet", fullName: "BS. Nguyễn Văn Dũng", role: "VETERINARIAN" },
    reviewedById: "acc-manager",
    reviewedBy: { id: "acc-manager", fullName: "Trần Quản Lý", role: "CLUB_MANAGER" },
    deliveredById: "acc-manager",
    deliveredBy: { id: "acc-manager", fullName: "Trần Quản Lý", role: "CLUB_MANAGER" },
    createdAt: `${TODAY_STR}T06:00:00.000Z`,
    updatedAt: `${TODAY_STR}T07:30:00.000Z`,
    reviewedAt: `${TODAY_STR}T06:30:00.000Z`,
    deliveredAt: `${TODAY_STR}T07:30:00.000Z`,
  },
];

export function getStoredStocks(): StockItemRow[] {
  try {
    const raw = localStorage.getItem(STOCKS_KEY);
    if (!raw) {
      saveStoredStocks(DEFAULT_STOCKS);
      return DEFAULT_STOCKS;
    }
    return JSON.parse(raw) as StockItemRow[];
  } catch {
    return DEFAULT_STOCKS;
  }
}

export function saveStoredStocks(items: StockItemRow[]): void {
  localStorage.setItem(STOCKS_KEY, JSON.stringify(items));
}

export function getStoredRestockRequests(): RestockRequestItem[] {
  try {
    const raw = localStorage.getItem(RESTOCK_REQUESTS_KEY);
    if (!raw) {
      saveStoredRestockRequests(DEFAULT_RESTOCK_REQUESTS);
      return DEFAULT_RESTOCK_REQUESTS;
    }
    return JSON.parse(raw) as RestockRequestItem[];
  } catch {
    return DEFAULT_RESTOCK_REQUESTS;
  }
}

export function saveStoredRestockRequests(items: RestockRequestItem[]): void {
  localStorage.setItem(RESTOCK_REQUESTS_KEY, JSON.stringify(items));
}


