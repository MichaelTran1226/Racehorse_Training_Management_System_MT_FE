import { api } from "@/shared/lib/api";
import type {
  CloseRecordInput,
  CreateMedicalRecordInput,
  FinalizeRecordInput,
  FollowUpInput,
  FollowUpItem,
  HorseMedicalProfile,
  MedicalRecord,
  ObservationNote,
  PrescriptionInput,
  PrescriptionItem,
  ReopenRecordInput,
  StopPrescriptionInput,
  TreatmentPhase,
  TreatmentPhaseInput,
  UpdateMedicalRecordInput,
} from "./types";

export interface ListRecordsParams {
  horseId?: string;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface ListRecordsResponse {
  records: MedicalRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// P2-01: Hồ sơ y tế ngựa 6 tab (SC-3.02, API-004)
export const getHorseMedicalProfile = (horseId: string) =>
  api<HorseMedicalProfile>("GET", `/medical/horses/${horseId}`);

// P2-01: Ghi chú quan sát sức khỏe của Groom (FR-3.17)
export const getHorseObservations = (
  horseId: string,
  params?: { fromDate?: string; toDate?: string; urgency?: string },
) => {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.urgency) query.set("urgency", params.urgency);
  const qStr = query.toString();
  return api<{ observations: ObservationNote[] }>(
    "GET",
    `/medical/horses/${horseId}/observations${qStr ? `?${qStr}` : ""}`,
  );
};

// P2-02: Danh sách bệnh án (SC-3.09, FR-3.03)
export const listRecords = (params?: ListRecordsParams) => {
  const query = new URLSearchParams();
  if (params?.horseId) query.set("horseId", params.horseId);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qStr = query.toString();
  return api<ListRecordsResponse>("GET", `/medical/records${qStr ? `?${qStr}` : ""}`);
};

// P2-02: Chi tiết bệnh án (SC-3.04)
export const getRecordDetail = (recordId: string) =>
  api<{ record: MedicalRecord }>("GET", `/medical/records/${recordId}`);

// P2-02: Tạo mới bệnh án (SC-3.03, FR-3.04)
export const createRecord = (input: CreateMedicalRecordInput) =>
  api<{ record: MedicalRecord }>("POST", "/medical/records", input);

// P2-02: Sửa bệnh án Nháp (SC-3.03, FR-3.04)
export const updateRecord = (recordId: string, input: UpdateMedicalRecordInput) =>
  api<{ record: MedicalRecord }>("PUT", `/medical/records/${recordId}`, input);

// P2-02: Xóa bản nháp bệnh án (BTN-3.23)
export const deleteDraftRecord = (recordId: string) =>
  api<{ ok: true }>("DELETE", `/medical/records/${recordId}`);

// P2-02: Chốt bệnh án (DL-3.08, FR-3.05)
export const finalizeRecord = (recordId: string, input: FinalizeRecordInput) =>
  api<{ record: MedicalRecord }>("POST", `/medical/records/${recordId}/finalize`, input);

// P2-02: Thêm giai đoạn điều trị (DL-3.04, FR-3.06)
export const addTreatmentPhase = (recordId: string, input: TreatmentPhaseInput) =>
  api<{ phase: TreatmentPhase }>("POST", `/medical/records/${recordId}/treatment-phases`, input);

// P2-02: Kê đơn thuốc (DL-3.05, FR-3.07)
export const addPrescription = (recordId: string, input: PrescriptionInput) =>
  api<{ prescription: PrescriptionItem }>("POST", `/medical/records/${recordId}/prescriptions`, input);

// P2-02: Dừng thuốc (DL-3.06, FR-3.07)
export const stopPrescription = (recordId: string, prescriptionId: string, input: StopPrescriptionInput) =>
  api<{ prescription: PrescriptionItem }>(
    "POST",
    `/medical/records/${recordId}/prescriptions/${prescriptionId}/stop`,
    input,
  );

// P2-02: Thêm tái khám (DL-3.07, FR-3.05)
export const addFollowUp = (recordId: string, input: FollowUpInput) =>
  api<{ followUp: FollowUpItem }>("POST", `/medical/records/${recordId}/follow-ups`, input);

// P2-02: Kết thúc điều trị (DL-3.09, FR-3.05)
export const closeRecord = (recordId: string, input: CloseRecordInput) =>
  api<{ record: MedicalRecord }>("POST", `/medical/records/${recordId}/close`, input);

// P2-02: Mở lại bệnh án (DL-3.09, FR-3.05)
export const reopenRecord = (recordId: string, input: ReopenRecordInput) =>
  api<{ record: MedicalRecord }>("POST", `/medical/records/${recordId}/reopen`, input);

// P2-04: Khóa huấn luyện (SC-3.06, FR-3.10, FR-3.11, FR-3.12, FR-3.19)
export const getLocks = async (): Promise<import("./types").TrainingLockHistoryItem[]> => {
  return [
    {
      id: "lock-001",
      lockCode: "LOCK-2026-001",
      horseId: "horse-2",
      appliedMedicalStatus: "Chấn thương",
      lockedAt: "2026-09-28",
      lockedBy: "Bác sĩ Thú y Trưởng",
      lockReason: "Viêm gân gấp chi trước bên trái mức độ 2, cần nghỉ ngơi và điều trị kháng viêm tích cực",
      reviewDate: "2026-10-12",
      status: "ACTIVE",
    },
    {
      id: "lock-002",
      lockCode: "LOCK-2026-002",
      horseId: "horse-4",
      appliedMedicalStatus: "Cách ly",
      lockedAt: "2026-09-15",
      lockedBy: "Bác sĩ Thú y Trưởng",
      lockReason: "Sốt siêu vi thể nhẹ, nghi ngờ lây nhiễm đường hô hấp",
      reviewDate: "2026-09-22",
      releasedAt: "2026-09-23",
      releasedBy: "Bác sĩ Thú y Trưởng",
      releaseReason: "Đã cắt sốt hoàn toàn 72h, xét nghiệm PCR âm tính, thể lực hồi phục tốt",
      durationDays: 8,
      status: "RELEASED",
    },
  ];
};

export const applyTrainingLock = (horseId: string, input: { appliedMedicalStatus: string; lockReason: string; reviewDate: string }) =>
  api<{ ok: true }>("POST", `/medical/horses/${horseId}/lock`, input);

export const releaseTrainingLock = (horseId: string, input: { releaseReason: string; targetStatus: string }) =>
  api<{ ok: true }>("POST", `/medical/horses/${horseId}/unlock`, input);

export const extendTrainingLock = (horseId: string, input: { newReviewDate: string; reason: string }) =>
  api<{ ok: true }>("POST", `/medical/horses/${horseId}/lock/extend`, input);

// P2-05: Chăm sóc định kỳ & danh mục loại (SC-3.07, SC-3.08, FR-3.13 -> FR-3.16)
export const getCareSchedules = async (): Promise<import("./types").PreventiveCareItem[]> => {
  return [
    {
      id: "care-1",
      horseId: "horse-1",
      type: "Tiêm phòng Cúm Equine Influenza",
      category: "VACCINATION",
      lastAdministeredDate: "2026-04-05",
      administeredBy: "Trạm thú y EquiFlow",
      dueDate: "2026-10-05",
      status: "DUE_SOON",
      notes: "Mũi nhắc lại định kỳ 6 tháng theo chuẩn hiệp hội đua ngựa",
    },
    {
      id: "care-2",
      horseId: "horse-2",
      type: "Tẩy giun đường ruột Ivermectin",
      category: "DEWORMING",
      lastAdministeredDate: "2026-07-01",
      administeredBy: "BS Thú y Trưởng",
      dueDate: "2026-10-01",
      status: "DUE_SOON",
      notes: "Phối hợp điều chỉnh dinh dưỡng",
    },
    {
      id: "care-3",
      horseId: "horse-3",
      type: "Gọt & Đóng móng đua hợp kim",
      category: "FARRIER",
      lastAdministeredDate: "2026-08-20",
      administeredBy: "Thợ móng Nguyễn Văn Móng",
      dueDate: "2026-09-25",
      status: "OVERDUE",
      notes: "Đã quá hạn 5 ngày! Cần bố trí thợ móng kiểm tra góc móng chân trước",
    },
    {
      id: "care-4",
      horseId: "horse-1",
      type: "Mài răng & Kiểm tra nha khoa",
      category: "DENTAL",
      lastAdministeredDate: "2026-03-10",
      administeredBy: "Phòng khám thú y",
      dueDate: "2026-09-10",
      status: "UP_TO_DATE",
      notes: "Răng đều, không có mảng bám bất thường",
    },
  ];
};

export const recordCareCompletion = async (
  careId: string,
  input: { administeredDate: string; administeredBy: string; nextDueDate: string; notes?: string },
) => {
  return { ok: true, careId, input };
};

export const healthApi = {
  getHorseMedicalProfile,
  getHorseObservations,
  listRecords,
  getRecordDetail,
  createRecord,
  updateRecord,
  deleteDraftRecord,
  finalizeRecord,
  addTreatmentPhase,
  addPrescription,
  stopPrescription,
  addFollowUp,
  closeRecord,
  reopenRecord,
  getLocks,
  applyTrainingLock,
  releaseTrainingLock,
  extendTrainingLock,
  getCareSchedules,
  recordCareCompletion,
};
