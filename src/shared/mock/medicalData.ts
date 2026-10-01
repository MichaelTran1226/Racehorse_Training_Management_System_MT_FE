import type {
  HorseMedicalProfile,
  MedicalRecord,
  ObservationNote,
  PrescriptionItem,
  TreatmentPhase,
  FollowUpItem,
} from "@/features/health/types";
import { getHorseById, getInjuriesForHorse, getStoredHorses } from "./horsesData";

export interface MockMedicalStore {
  records: MedicalRecord[];
  observations: ObservationNote[];
}

const MOCK_STORAGE_KEY = "equiflow.mock.medical.v4";

if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("equiflow.mock.medical.v1");
    localStorage.removeItem("equiflow.mock.medical.v2");
    localStorage.removeItem("equiflow.mock.medical.v3");
  } catch {
    // ignore
  }
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
    examinationType: "Injury Examination",
    examinationReason: "Horse exhibits signs of left forelimb lameness following a high-speed gallop trial",
    symptoms: "Mild swelling at left fore fetlock/knee, localized heat, pain upon flexion and extension",
    discoverySource: "Post-workout abnormal signs",
    vitals: {
      temperature: 38.4,
      restingHeartRate: 42,
      respiratoryRate: 15,
      weightKg: 495,
      clinicalNotes: "Clinical exam: guarded gait, unweighting the left forelimb.",
    },
    labTests: [
      {
        id: "lab-1",
        testType: "Ultrasound",
        testDate: "2026-09-28",
        result: "Identified grade 1 lesion on superficial digital flexor tendon (SDFT), partial fiber disruption without complete tear.",
      },
      {
        id: "lab-2",
        testType: "Blood Panel",
        testDate: "2026-09-28",
        result: "Mildly elevated CRP (14 mg/L); renal and hepatic panels within normal limits.",
      },
    ],
    diagnosis: "Superficial digital flexor tendon desmitis - Left forelimb (Grade 1 SDFT)",
    severity: "MODERATE",
    proposedStatus: "INJURED",
    proposeMedicalLock: true,
    treatmentPhases: [
      {
        id: "phase-1",
        phaseName: "Phase 1: Anti-inflammatory & Stall Rest",
        startDate: "2026-09-28",
        endDate: "2026-10-05",
        target: "Reduce localized heat, alleviate edema, and manage acute pain",
        allowedActivity: "Strict Stall Rest",
        careInstructions: [
          { activity: "Cold water/ice hosing 20 minutes", frequency: "Twice daily" },
          { activity: "Support compression bandage on lower leg", frequency: "Continuous in stall" },
          { activity: "Deep straw bedding, restricted movement", frequency: "Daily" },
        ],
      },
    ],
    prescriptions: [
      {
        id: "rx-1",
        medicationName: "Phenylbutazone Paste 20%",
        dosage: 2.2,
        unit: "g",
        route: "Oral",
        frequencyPerDay: 2,
        startDate: "2026-09-28",
        daysCount: 5,
        withdrawalDays: 7,
        withdrawalUntil: "2026-10-10",
        notes: "Mix into feed ration following morning and evening meals",
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
        progressNotes: "Swelling reduced by ~40%, localized temperature cooler, horse bearing weight more comfortably.",
        adjustments: "Continue cold therapy for 3 more days, initiate 5-minute hand-walking from Oct 02.",
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
    examinationType: "Routine Checkup",
    examinationReason: "Quarterly general health check and fitness evaluation prior to autumn race meet",
    vitals: {
      temperature: 37.8,
      restingHeartRate: 34,
      respiratoryRate: 11,
      weightKg: 480,
      clinicalNotes: "Excellent body condition score, clear bronchovesicular sounds, firm musculature, sound hooves.",
    },
    diagnosis: "Normal physical status, no abnormalities detected",
    severity: "MILD",
    conclusion: "Horse meets competitive racing criteria, physiological parameters within optimal ranges.",
    treatmentResult: "Full Recovery",
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
    shift: "Morning Shift (06:00 - 14:00)",
    observedAt: "2026-09-30T07:15:00Z",
    groomId: "groom",
    groomName: "John Smith",
    urgency: "ATTENTION",
    content: "Horse consumed 90% of grain ration; favored left fore slightly while stall was cleaned, calm temperament.",
  },
  {
    id: "obs-2",
    horseId: "horse-2",
    shift: "Afternoon Shift (14:00 - 22:00)",
    observedAt: "2026-09-29T16:30:00Z",
    groomId: "groom",
    groomName: "John Smith",
    urgency: "URGENT",
    content: "Left forelimb slightly warm after pacing stall; applied extra cold therapy per veterinarian instructions.",
  },
  {
    id: "obs-3",
    horseId: "horse-1",
    shift: "Morning Shift (06:00 - 14:00)",
    observedAt: "2026-09-30T06:30:00Z",
    groomId: "groom",
    groomName: "John Smith",
    urgency: "NORMAL",
    content: "Appetite strong, normal manure consistency, alert and bright, ready for morning training session.",
  },
];

export function getMockMedicalStore(): MockMedicalStore {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockMedicalStore;
  } catch {
    // fallback
  }
  const horses = getStoredHorses();
  const fresh: MockMedicalStore = {
    records: horses.length === 0 ? [] : INITIAL_RECORDS.filter((r) => horses.some((h) => h.id === r.horseId)),
    observations: horses.length === 0 ? [] : INITIAL_OBSERVATIONS.filter((o) => horses.some((h) => h.id === o.horseId)),
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

  const found = getHorseById(horseId);
  const horseName = found ? found.name : `Horse ${horseId}`;
  const rfid = found ? found.code : `RFID-${horseId}`;
  const stall = found ? found.stall : "Stall A-01";
  const status: import("@/shared/types/enums").HealthStatus =
    found?.healthGroup === "WATCH"
      ? "UNDER_OBSERVATION"
      : (found?.healthGroup as any) || "FIT";
  const isLocked = Boolean(found?.isLocked);
  const lockReason = found?.lockReason || "Under protective clinical hold";

  // Filter out medications for Owner / Groom per FR-3.18
  const hideMeds = role === "HORSE_OWNER" || role === "GROOM";

  // Get isolated injuries specifically created on this horse's 2D map
  const horseInjuries = getInjuriesForHorse(horseId);

  return {
    horse: {
      id: horseId,
      name: horseName,
      microchipRfid: rfid,
      breed: found?.breed || "Thoroughbred",
      dob: found?.dob || "2021-04-12",
      gender: found?.gender || "Stallion",
      color: found?.color || "Bay",
      stallCode: stall,
      healthStatus: status,
      isMedicalLocked: isLocked,
      activeLock: isLocked
        ? {
            id: `lock-${horseId}`,
            lockCode: `LK-${rfid.slice(-6)}`,
            horseId,
            appliedMedicalStatus: status,
            lockedAt: new Date().toISOString(),
            lockedBy: "Lead Veterinarian",
            lockReason,
            reviewDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            status: "ACTIVE",
          }
        : null,
    },
    overview: {
      allowedActivity: isLocked ? "Strict Stall Rest" : status === "UNDER_OBSERVATION" ? "Light Walking Only" : "Full Training",
      careInstructions: isLocked
        ? [
            { activity: "Cold hydrotherapy / ice application 20 minutes", frequency: "Twice daily" },
            { activity: "Protective support compression wrap", frequency: "Continuous in stall" },
          ]
        : [],
      activeMedications: hideMeds
        ? []
        : isLocked
        ? [
            {
              id: `rx-${horseId}-1`,
              medicationName: "Phenylbutazone Paste 20%",
              dosage: 2.2,
              unit: "g",
              route: "Oral",
              frequencyPerDay: 2,
              startDate: new Date().toISOString().split("T")[0],
              daysCount: 5,
              withdrawalDays: 7,
              withdrawalUntil: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0],
              notes: "Mix with feed",
              status: "ACTIVE",
            },
          ]
        : [],
      latestVitals: {
        temperature: found?.temp ?? 37.8,
        restingHeartRate: found?.restingHeartRate ?? 36,
        respiratoryRate: 12,
        weightKg: 490,
        clinicalNotes: found?.statusText || "Normal condition",
        recordedAt: new Date().toISOString(),
      },
      vitalsHistory: [
        { recordedAt: new Date().toISOString(), temperature: found?.temp ?? 37.8, restingHeartRate: found?.restingHeartRate ?? 36, respiratoryRate: 12, weightKg: 490 },
      ],
      upcomingPreventive: [],
    },
    records: horseRecords,
    injuries: horseInjuries,
    locks: isLocked
      ? [
          {
            id: `lock-${horseId}`,
            lockCode: `LK-${rfid.slice(-6)}`,
            horseId,
            appliedMedicalStatus: status,
            lockedAt: new Date().toISOString(),
            lockedBy: "Lead Veterinarian",
            lockReason,
            reviewDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            status: "ACTIVE",
          },
        ]
      : [],
    preventive: [],
    observations: horseObs,
  };
}
