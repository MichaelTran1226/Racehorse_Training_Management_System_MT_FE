import type { HorseStatus } from "@/shared/types/enums";

export interface Horse {
  id: string;
  name: string;
  microchipRfid: string;
  breed: string;
  dob: string;
  gender: string;
  color: string;
  avatarUrl?: string;
  status: HorseStatus;
  isMedicalLocked: boolean;
  ownerId?: string;
  ownerName?: string;
  stallCode?: string;
  groomName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HorseListFilter {
  search?: string;
  status?: HorseStatus | "ALL";
  ownerId?: string;
}
