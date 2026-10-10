import type { HorseStatus } from "@/shared/types/enums";

export interface Horse {
  id: string;
  horseCode?: string;
  name: string;
  microchip?: string;
  rfid?: string;
  microchipRfid: string;
  breed: string;
  dob: string;
  gender: string;
  color: string;
  avatarUrl?: string;
  status: HorseStatus;
  isMedicalLocked: boolean;
  ownerId?: string;
  owner?: { id: string; fullName: string; email: string };
  ownerName?: string;
  stallCode?: string | null;
  zone?: string | null;
  primaryGroom?: string | null;
  groomName?: string;
  medicalLocks?: Array<{
    id: string;
    isLocked: boolean;
    lockReason: string;
    lockedAt: string;
    veterinarian?: { fullName: string };
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface HorseListFilter {
  search?: string;
  status?: HorseStatus | "ALL";
  isMedicalLocked?: string;
  breed?: string;
  gender?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface HorseListResponse {
  items: Horse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateHorsePayload {
  name: string;
  breed: string;
  dob: string;
  gender: string;
  color: string;
  microchip: string;
  rfid?: string;
  status?: HorseStatus;
  ownerId?: string;
  avatarUrl?: string;
  stallId?: string;
}

export interface UpdateHorsePayload {
  name?: string;
  breed?: string;
  dob?: string;
  gender?: string;
  color?: string;
  microchip?: string;
  rfid?: string;
  status?: HorseStatus;
  ownerId?: string;
  avatarUrl?: string;
}

export interface HorseHistoryResponse {
  horse: Horse;
  statusHistory: Array<{
    id: string;
    timestamp: string;
    changedBy: string;
    action: string;
    notes?: string;
    oldStatus?: string | null;
    newStatus?: string | null;
  }>;
  ownershipHistory: Array<{
    id: string;
    timestamp: string;
    previousOwner: string;
    newOwner: string;
    reason?: string;
    transferredBy?: string;
  }>;
  stallHistory: Array<{
    id: string;
    stallCode: string;
    zone: string;
    groomName: string;
    startDate: string;
    endDate?: string | null;
    isActive: boolean;
  }>;
  medicalHistory: {
    records: Array<{
      id: string;
      examinationDate: string;
      veterinarianName: string;
      symptoms: string;
      clinicalDiagnosis: string;
      treatmentProtocol: string;
    }>;
    injuries: Array<{
      id: string;
      discoveryDate: string;
      anatomicalZone: string;
      layer: string;
      viewSide: string;
      injuryType: string;
      severity: string;
      stage: string;
      status: string;
    }>;
    locks: Array<{
      id: string;
      lockCode?: string;
      lockedAt: string;
      lockReason: string;
      veterinarianName?: string;
      isLocked: boolean;
      unlockedAt?: string | null;
      unlockReason?: string | null;
    }>;
  };
  trainingHistory: Array<{
    id: string;
    phaseName: string;
    targetSpeed?: number | null;
    targetDistance?: number | null;
    trackSurface: string;
    startDate: string;
    endDate: string;
    status: string;
    trainerName?: string;
    totalWorkouts: number;
    completedWorkouts: number;
  }>;
  timeline: Array<{
    id: string;
    category: 'IDENTITY' | 'STATUS' | 'STALL' | 'MEDICAL' | 'TRAINING' | 'TOURNAMENT' | 'OWNERSHIP';
    title: string;
    description: string;
    timestamp: string;
    badgeTone?: 'ok' | 'warn' | 'danger' | 'info' | 'neutral';
  }>;
}

