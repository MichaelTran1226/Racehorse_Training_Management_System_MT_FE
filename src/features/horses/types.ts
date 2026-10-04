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
