import { api } from "@/shared/lib/api";
import {
  getStoredHorses,
  getStoredLocks,
  placeHorseTrainingLock,
  extendHorseTrainingLock,
  liftHorseTrainingLock,
} from "@/shared/mock/horsesData";
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

// P2-02: Danh sách bệnh án (FR-3.03)
export const listRecords = async (params?: ListRecordsParams): Promise<ListRecordsResponse> => {
  const query = new URLSearchParams();
  if (params?.horseId) query.set("horseId", params.horseId);
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qStr = query.toString();
  const res = await api<any>("GET", `/medical/records${qStr ? `?${qStr}` : ""}`);

  if (res && Array.isArray(res.data)) {
    return {
      records: res.data,
      total: typeof res.total === "number" ? res.total : res.data.length,
      page: typeof res.page === "number" ? res.page : 1,
      limit: typeof res.limit === "number" ? res.limit : 15,
      totalPages: typeof res.totalPages === "number" ? res.totalPages : 1,
    };
  }
  if (res && Array.isArray(res.records)) {
    return res as ListRecordsResponse;
  }
  if (Array.isArray(res)) {
    return {
      records: res,
      total: res.length,
      page: 1,
      limit: res.length,
      totalPages: 1,
    };
  }
  return { records: [], total: 0, page: 1, limit: 15, totalPages: 1 };
};

// P2-02: Chi tiết bệnh án
export const getRecordDetail = async (recordId: string): Promise<{ record: MedicalRecord }> => {
  const res = await api<any>("GET", `/medical/records/${recordId}`);
  if (res && res.record) {
    return res as { record: MedicalRecord };
  }
  if (res && (res.id || res.recordNumber || res.horseId)) {
    return { record: res as MedicalRecord };
  }
  return { record: res };
};

// P2-02: Tạo mới bệnh án (FR-3.04)
export const createRecord = async (input: CreateMedicalRecordInput): Promise<{ record: MedicalRecord }> => {
  const bePayload: Record<string, unknown> = {
    horseId: input.horseId,
    examinationDate: input.examinationDate || new Date().toISOString(),
    examinationType: input.examinationType || "ROUTINE_CHECKUP",
    reason: input.examinationReason || "General Examination",
    symptoms: input.symptoms,
    discoverySource: input.discoverySource,
    diagnosis: input.diagnosis,
    severity: input.severity,
    recommendedHorseStatus: input.proposedStatus,
    isDraft: Boolean(input.saveAsDraft),
  };
  if (input.vitals) {
    bePayload.vitals = {
      temperature: Number(input.vitals.temperature ?? 38.0),
      restingHeartRate: Number(input.vitals.restingHeartRate ?? 36),
      respiratoryRate: Number(input.vitals.respiratoryRate ?? 12),
      weightKg: input.vitals.weightKg ? Number(input.vitals.weightKg) : undefined,
      clinicalExamination: input.vitals.clinicalNotes || input.symptoms || "Bình thường",
    };
  }
  if (input.labTests && input.labTests.length > 0) {
    bePayload.labTests = input.labTests.map((t) => ({
      testType: t.testType || "Standard",
      datePerformed: t.testDate || new Date().toISOString().split("T")[0],
      result: t.result || "Normal",
    }));
  }

  const res = await api<any>("POST", "/medical/records", bePayload);
  if (res && res.record) return res as { record: MedicalRecord };
  if (res && (res.id || res.horseId)) return { record: res as MedicalRecord };
  return { record: res };
};

// P2-02: Sửa bệnh án Nháp (FR-3.04)
export const updateRecord = async (recordId: string, input: UpdateMedicalRecordInput): Promise<{ record: MedicalRecord }> => {
  const bePayload: Record<string, unknown> = {
    examinationDate: input.examinationDate,
    examinationType: input.examinationType,
    reason: input.examinationReason,
    symptoms: input.symptoms,
    discoverySource: input.discoverySource,
    diagnosis: input.diagnosis,
    severity: input.severity,
    recommendedHorseStatus: input.proposedStatus,
  };
  if (input.vitals) {
    bePayload.vitals = {
      temperature: Number(input.vitals.temperature ?? 38.0),
      restingHeartRate: Number(input.vitals.restingHeartRate ?? 36),
      respiratoryRate: Number(input.vitals.respiratoryRate ?? 12),
      weightKg: input.vitals.weightKg ? Number(input.vitals.weightKg) : undefined,
      clinicalExamination: input.vitals.clinicalNotes || input.symptoms || "Bình thường",
    };
  }

  const res = await api<any>("PUT", `/medical/records/${recordId}`, bePayload);
  if (res && res.record) return res as { record: MedicalRecord };
  if (res && (res.id || res.horseId)) return { record: res as MedicalRecord };
  return { record: res };
};

// P2-02: Xóa bản nháp bệnh án
export const deleteDraftRecord = (recordId: string) =>
  api<{ ok: true }>("DELETE", `/medical/records/${recordId}`);

// P2-02: Chốt bệnh án (FR-3.05)
export const finalizeRecord = async (recordId: string, input: FinalizeRecordInput): Promise<{ record: MedicalRecord }> => {
  try {
    const res = await api<any>("POST", `/medical/records/${recordId}/finalize`, input);
    if (res && res.record) return res as { record: MedicalRecord };
    if (res && res.id) return { record: res as MedicalRecord };
    return { record: res };
  } catch {
    const res = await api<any>("PUT", `/medical/records/${recordId}`, { status: "OFFICIAL", isDraft: false });
    if (res && res.record) return res as { record: MedicalRecord };
    if (res && res.id) return { record: res as MedicalRecord };
    return { record: res };
  }
};

// P2-02: Thêm giai đoạn điều trị (FR-3.06)
export const addTreatmentPhase = async (recordId: string, input: TreatmentPhaseInput): Promise<{ phase: TreatmentPhase; record?: MedicalRecord }> => {
  const res = await api<any>("POST", `/medical/records/${recordId}/treatment-phases`, input);
  const phase: TreatmentPhase = res?.phase || {
    id: `phase-${Date.now()}`,
    phaseName: input.phaseName,
    startDate: input.startDate,
    endDate: input.endDate,
    target: input.target,
    allowedActivity: input.allowedActivity,
    careInstructions: input.careInstructions || [],
  };
  return { phase, record: res?.record };
};

// P2-02: Kê đơn thuốc (FR-3.07)
export const addPrescription = async (recordId: string, input: PrescriptionInput): Promise<{ prescription: PrescriptionItem; record?: MedicalRecord }> => {
  const res = await api<any>("POST", `/medical/records/${recordId}/prescriptions`, input);
  const prescription: PrescriptionItem = res?.prescription || {
    id: `rx-${Date.now()}`,
    medicationName: input.medicationName,
    dosage: input.dosage,
    unit: input.unit,
    route: input.route,
    frequencyPerDay: input.frequencyPerDay,
    startDate: input.startDate,
    daysCount: input.daysCount,
    withdrawalDays: input.withdrawalDays || 0,
    status: "ACTIVE",
    notes: input.notes,
  };
  return { prescription, record: res?.record };
};

// P2-02: Dừng thuốc (FR-3.07)
export const stopPrescription = async (
  recordId: string,
  prescriptionId: string,
  input: StopPrescriptionInput,
): Promise<{ prescription: PrescriptionItem }> => {
  const res = await api<any>(
    "POST",
    `/medical/records/${recordId}/prescriptions/${prescriptionId}/stop`,
    input,
  );
  return { prescription: res?.prescription || res };
};

// P2-02: Thêm tái khám (FR-3.05)
export const addFollowUp = async (recordId: string, input: FollowUpInput): Promise<{ followUp: FollowUpItem; record?: MedicalRecord }> => {
  const res = await api<any>("POST", `/medical/records/${recordId}/follow-ups`, input);
  const followUp: FollowUpItem = res?.followUp || {
    id: `fu-${Date.now()}`,
    followUpDate: input.followUpDate || new Date().toISOString().split("T")[0],
    temperature: input.temperature,
    restingHeartRate: input.restingHeartRate,
    respiratoryRate: input.respiratoryRate,
    progressNotes: input.progressNotes,
    adjustments: input.adjustments,
    vetName: "Veterinarian",
  };
  return { followUp, record: res?.record };
};


// P2-02: Kết thúc điều trị (FR-3.05)
export const closeRecord = async (recordId: string, input: CloseRecordInput): Promise<{ record: MedicalRecord }> => {
  const res = await api<any>("POST", `/medical/records/${recordId}/close`, input);
  if (res && res.record) return res as { record: MedicalRecord };
  if (res && res.id) return { record: res as MedicalRecord };
  return { record: res };
};

// P2-02: Mở lại bệnh án (FR-3.05)
export const reopenRecord = async (recordId: string, input: ReopenRecordInput): Promise<{ record: MedicalRecord }> => {
  const res = await api<any>("POST", `/medical/records/${recordId}/reopen`, input);
  if (res && res.record) return res as { record: MedicalRecord };
  if (res && res.id) return { record: res as MedicalRecord };
  return { record: res };
};


// P2-04: Khóa huấn luyện (SC-3.06, FR-3.10, FR-3.11, FR-3.12, FR-3.19)
export const getLocks = async (): Promise<import("./types").TrainingLockHistoryItem[]> => {
  const storedLocks = getStoredLocks();
  return storedLocks.map((l) => ({
    id: l.id,
    lockCode: l.lockCode,
    horseId: l.horseId,
    horseName: l.horseName,
    horseCode: l.horseCode,
    appliedMedicalStatus: l.appliedMedicalStatus,
    lockedAt: l.lockedAt,
    lockedBy: l.lockedBy,
    lockReason: l.lockReason,
    reviewDate: l.reviewDate,
    releasedAt: l.releasedAt,
    releasedBy: l.releasedBy,
    releaseReason: l.releaseReason,
    durationDays: l.durationDays,
    status: l.status,
  }));
};

export const applyTrainingLock = async (
  horseId: string,
  input: { appliedMedicalStatus: string; lockReason: string; reviewDate: string; unlockConditions?: string },
) => {
  placeHorseTrainingLock(horseId, {
    appliedStatus: input.appliedMedicalStatus,
    reviewDate: input.reviewDate,
    reason: input.lockReason,
    unlockConditions: input.unlockConditions,
  });
  return { ok: true as const };
};

export const releaseTrainingLock = async (
  horseId: string,
  input: { releaseReason: string; targetStatus: string },
) => {
  liftHorseTrainingLock(horseId, {
    restoreStatus: input.targetStatus,
    reason: input.releaseReason,
  });
  return { ok: true as const };
};

export const extendTrainingLock = async (
  horseId: string,
  input: { newReviewDate: string; reason: string },
) => {
  extendHorseTrainingLock(horseId, {
    newReviewDate: input.newReviewDate,
    reason: input.reason,
  });
  return { ok: true as const };
};

// P2-05: Preventive care & catalogue (SC-3.07, SC-3.08, FR-3.13 -> FR-3.16)
export const getCareSchedules = async (): Promise<import("./types").PreventiveCareItem[]> => {
  const horses = getStoredHorses();
  const schedules: import("./types").PreventiveCareItem[] = [];
  horses.forEach((h) => {
    schedules.push({
      id: `care-${h.id}-vax`,
      horseId: `${h.name} (${h.code})`,
      type: "Equine Influenza Vaccination",
      category: "VACCINATION",
      lastAdministeredDate: "2026-04-05",
      administeredBy: "EquiFlow Veterinary Station",
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
      status: "DUE_SOON",
      notes: "Bi-annual booster vaccination requirement",
    });
  });
  return schedules;
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
