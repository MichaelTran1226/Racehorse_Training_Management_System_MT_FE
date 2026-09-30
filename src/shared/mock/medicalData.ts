import type {
  HorseMedicalProfile,
  MedicalRecord,
  ObservationNote,
  PrescriptionItem,
  TreatmentPhase,
  FollowUpItem,
} from "@/features/health/types";

export interface MockMedicalStore {
  records: MedicalRecord[];
  observations: ObservationNote[];
}

const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: "rec-1",
    recordNumber: "BA-260901",
    horseId: "horse-2",
    horseName: "Northern Dancer Legacy",
    horseCode: "RFID-985141002342",
    stallCode: "STALL-A02",
    status: "OPEN",
    examinationDate: "2026-09-28T08:30:00Z",
    examinationType: "Khám chấn thương",
    examinationReason: "Ngựa có dấu hiệu khập khiễng chân trước bên trái sau buổi chạy thử tốc độ",
    symptoms: "Khớp gối chân trước trái sưng nề nhẹ, ấn nhiệt độ cao hơn bình thường, co duỗi đau",
    discoverySource: "Dấu hiệu bất thường sau buổi tập",
    vitals: {
      temperature: 38.4,
      restingHeartRate: 42,
      respiratoryRate: 15,
      weightKg: 495,
      clinicalNotes: "Khám lâm sàng: dáng đi gượng, tránh dồn trọng lượng lên chân trước trái.",
    },
    labTests: [
      {
        id: "lab-1",
        testType: "Siêu âm",
        testDate: "2026-09-28",
        result: "Phát hiện vùng tổn thương sợi gân gấp nông (SDFT) độ 1, chưa rách hoàn toàn.",
      },
      {
        id: "lab-2",
        testType: "Xét nghiệm máu",
        testDate: "2026-09-28",
        result: "Chỉ số viêm CRP tăng nhẹ (14 mg/L), các chỉ số sinh hóa gan thận bình thường.",
      },
    ],
    diagnosis: "Viêm gân gấp nông chi trước bên trái (SDFT Desmitis - Độ 1)",
    severity: "MODERATE",
    proposedStatus: "INJURED",
    proposeMedicalLock: true,
    treatmentPhases: [
      {
        id: "phase-1",
        phaseName: "Giai đoạn 1: Giảm viêm & Bất động",
        startDate: "2026-09-28",
        endDate: "2026-10-05",
        target: "Hạ nhiệt độ tại ổ viêm, giảm sưng và kiểm soát cơn đau cấp tính",
        allowedActivity: "Nghỉ hoàn toàn",
        careInstructions: [
          { activity: "Ngâm chân nước đá 20 phút", frequency: "2 lần/ngày" },
          { activity: "Băng ép hỗ trợ cổ chân", frequency: "Liên tục trong chuồng" },
          { activity: "Đệm rơm dày, hạn chế di chuyển", frequency: "Hàng ngày" },
        ],
      },
    ],
    prescriptions: [
      {
        id: "rx-1",
        medicationName: "Phenylbutazone Paste 20%",
        dosage: 2.2,
        unit: "g",
        route: "Uống",
        frequencyPerDay: 2,
        startDate: "2026-09-28",
        daysCount: 5,
        withdrawalDays: 7,
        withdrawalUntil: "2026-10-10",
        notes: "Trộn cùng khẩu phần cám sau bữa ăn sáng và tối",
        status: "ACTIVE",
      },
    ],
    followUps: [
      {
        id: "fu-1",
        followUpDate: "2026-09-30T09:00:00Z",
        temperature: 38.0,
        restingHeartRate: 38,
        respiratoryRate: 12,
        progressNotes: "Vùng sưng đã giảm khoảng 40%, nhiệt độ tại khớp mát hơn, ngựa đứng tỳ chân thoải mái hơn.",
        adjustments: "Tiếp tục ngâm đá thêm 3 ngày, bắt đầu dắt đi bộ nhẹ 5 phút từ ngày 02/10.",
        vetName: "Dr. Sarah Connor",
      },
    ],
    vetId: "vet",
    vetName: "Dr. Sarah Connor",
    createdAt: "2026-09-28T08:30:00Z",
  },
  {
    id: "rec-2",
    recordNumber: "BA-260815",
    horseId: "horse-1",
    horseName: "Thunderbolt Swift",
    horseCode: "RFID-985141002341",
    stallCode: "STALL-A01",
    status: "CLOSED",
    examinationDate: "2026-08-15T09:00:00Z",
    examinationType: "Khám định kỳ",
    examinationReason: "Kiểm tra tổng quát định kỳ quý 3 và đánh giá thể lực trước giải đua mùa thu",
    vitals: {
      temperature: 37.8,
      restingHeartRate: 34,
      respiratoryRate: 11,
      weightKg: 480,
      clinicalNotes: "Thể trạng tuyệt vời, tim phổi thanh, cơ bắp săn chắc, móng khỏe.",
    },
    diagnosis: "Sức khỏe bình thường, không ghi nhận bất thường",
    severity: "MILD",
    conclusion: "Ngựa đạt chuẩn thể lực thi đấu, các chỉ số sinh lý trong ngưỡng tối ưu.",
    treatmentResult: "Khỏi hoàn toàn",
    closedAt: "2026-08-15T10:30:00Z",
    vetId: "vet",
    vetName: "Dr. Sarah Connor",
    createdAt: "2026-08-15T09:00:00Z",
  },
];

const INITIAL_OBSERVATIONS: ObservationNote[] = [
  {
    id: "obs-1",
    horseId: "horse-2",
    shift: "Ca sáng (06:00 - 14:00)",
    observedAt: "2026-09-30T07:15:00Z",
    groomId: "groom",
    groomName: "John Smith",
    urgency: "ATTENTION",
    content: "Ngựa ăn hết 90% khẩu phần cám, khi dọn chuồng thấy đứng tỳ chân nhẹ, không có phản xạ cắn gắt.",
  },
  {
    id: "obs-2",
    horseId: "horse-2",
    shift: "Ca chiều (14:00 - 22:00)",
    observedAt: "2026-09-29T16:30:00Z",
    groomId: "groom",
    groomName: "John Smith",
    urgency: "URGENT",
    content: "Chân trước trái hơi ấm lên sau khi đi lại trong chuồng, đã chườm đá bổ sung theo đúng hướng dẫn của BS.",
  },
  {
    id: "obs-3",
    horseId: "horse-1",
    shift: "Ca sáng (06:00 - 14:00)",
    observedAt: "2026-09-30T06:30:00Z",
    groomId: "groom",
    groomName: "John Smith",
    urgency: "NORMAL",
    content: "Ngựa ăn uống tốt, phân khuôn bình thường, tinh thần tỉnh táo, sẵn sàng cho bài tập sáng.",
  },
];

const MOCK_STORAGE_KEY = "equiflow.mock.medical.v1";

export function getMockMedicalStore(): MockMedicalStore {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockMedicalStore;
  } catch {
    // fallback
  }
  const fresh: MockMedicalStore = {
    records: INITIAL_RECORDS,
    observations: INITIAL_OBSERVATIONS,
  };
  saveMockMedicalStore(fresh);
  return fresh;
}

export function saveMockMedicalStore(store: MockMedicalStore) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable
  }
}

export function buildMockProfile(horseId: string, role?: string): HorseMedicalProfile {
  const store = getMockMedicalStore();
  const horseRecords = store.records.filter((r) => r.horseId === horseId);
  const horseObs = store.observations.filter((o) => o.horseId === horseId);

  const isHorse2 = horseId === "horse-2";
  const horseName = isHorse2 ? "Northern Dancer Legacy" : "Thunderbolt Swift";
  const rfid = isHorse2 ? "RFID-985141002342" : "RFID-985141002341";
  const stall = isHorse2 ? "STALL-A02" : "STALL-A01";
  const status = isHorse2 ? "INJURED" : "FIT";

  // Filter out medications for Owner / Groom per FR-3.18
  const hideMeds = role === "HORSE_OWNER" || role === "GROOM";

  return {
    horse: {
      id: horseId,
      name: horseName,
      microchipRfid: rfid,
      breed: "Thoroughbred",
      dob: "2021-04-12",
      gender: "Colt",
      color: "Bay Dark",
      stallCode: stall,
      healthStatus: status,
      isMedicalLocked: isHorse2,
      activeLock: isHorse2
        ? {
            id: "lock-1",
            lockCode: "KH-000012",
            horseId,
            appliedMedicalStatus: "INJURED",
            lockedAt: "2026-09-28T09:00:00Z",
            lockedBy: "Dr. Sarah Connor",
            lockReason: "Viêm gân gấp chi trước trái cần nghỉ hoàn toàn",
            reviewDate: "2026-10-05T09:00:00Z",
            status: "ACTIVE",
          }
        : null,
    },
    overview: {
      allowedActivity: isHorse2 ? "Nghỉ hoàn toàn" : "Tập bình thường",
      careInstructions: isHorse2
        ? [
            { activity: "Ngâm chân nước đá 20 phút", frequency: "2 lần/ngày" },
            { activity: "Băng ép hỗ trợ", frequency: "Liên tục trong chuồng" },
          ]
        : [],
      activeMedications: hideMeds
        ? []
        : isHorse2
        ? [
            {
              id: "rx-1",
              medicationName: "Phenylbutazone Paste 20%",
              dosage: 2.2,
              unit: "g",
              route: "Uống",
              frequencyPerDay: 2,
              startDate: "2026-09-28",
              daysCount: 5,
              withdrawalDays: 7,
              withdrawalUntil: "2026-10-10",
              notes: "Trộn cùng cám",
              status: "ACTIVE",
            },
          ]
        : [],
      latestVitals: {
        temperature: isHorse2 ? 38.4 : 37.8,
        restingHeartRate: isHorse2 ? 42 : 34,
        respiratoryRate: isHorse2 ? 15 : 11,
        weightKg: isHorse2 ? 495 : 480,
        clinicalNotes: isHorse2 ? "Khớp gối còn ấm nhẹ" : "Thể trạng tốt",
        recordedAt: "2026-09-30T09:00:00Z",
      },
      vitalsHistory: [
        { recordedAt: "2026-09-30T09:00:00Z", temperature: 38.0, restingHeartRate: 38, respiratoryRate: 12, weightKg: 495 },
        { recordedAt: "2026-09-29T09:00:00Z", temperature: 38.2, restingHeartRate: 40, respiratoryRate: 14, weightKg: 494 },
        { recordedAt: "2026-09-28T09:00:00Z", temperature: 38.4, restingHeartRate: 42, respiratoryRate: 15, weightKg: 495 },
      ],
      upcomingPreventive: [
        {
          id: "prev-1",
          horseId,
          type: "Tiêm phòng Cúm ngựa (Equine Influenza)",
          category: "VACCINATION",
          lastAdministeredDate: "2026-04-10",
          dueDate: "2026-10-10",
          status: "DUE_SOON",
        },
      ],
    },
    records: horseRecords,
    injuries: isHorse2
      ? [
          {
            id: "inj-1",
            horseId,
            region: "Khớp cổ chân trước trái (Fetlock)",
            view: "LEFT",
            layer: "MUSCLE",
            injuryType: "Viêm gân gấp",
            severity: "MODERATE",
            stage: "ACUTE",
            detectedDate: "2026-09-28",
            notes: "Gân sưng nề 2cm",
          },
        ]
      : [],
    locks: isHorse2
      ? [
          {
            id: "lock-1",
            lockCode: "KH-000012",
            horseId,
            appliedMedicalStatus: "INJURED",
            lockedAt: "2026-09-28T09:00:00Z",
            lockedBy: "Dr. Sarah Connor",
            lockReason: "Viêm gân gấp chi trước trái",
            reviewDate: "2026-10-05T09:00:00Z",
            status: "ACTIVE",
          },
        ]
      : [],
    preventive: [
      {
        id: "prev-1",
        horseId,
        type: "Tiêm phòng Cúm ngựa",
        category: "VACCINATION",
        lastAdministeredDate: "2026-04-10",
        administeredBy: "Dr. Sarah Connor",
        dueDate: "2026-10-10",
        status: "DUE_SOON",
      },
      {
        id: "prev-2",
        horseId,
        type: "Tẩy giun định kỳ",
        category: "DEWORMING",
        lastAdministeredDate: "2026-07-01",
        administeredBy: "John Smith",
        dueDate: "2026-10-01",
        status: "DUE_SOON",
      },
    ],
    observations: horseObs,
  };
}
