export type StallStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

export interface StallAllocation {
  id: string;
  stallId: string;
  horseId: string;
  assignedGroomUserId?: string | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  horse: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
  assignedGroom?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface Stall {
  id: string;
  code: string;
  zone: string;
  status: StallStatus;
  notes?: string | null;
  allocations: StallAllocation[];
}

export interface CreateStallDto {
  code: string;
  zone: string;
  notes?: string;
}

export interface UpdateStallDto {
  code?: string;
  zone?: string;
  status?: StallStatus;
  notes?: string;
}

export interface AssignHorseDto {
  horseId: string;
  assignedGroomUserId?: string;
  notes?: string;
}

export interface TransferHorseDto {
  newStallId: string;
  assignedGroomUserId?: string;
  notes?: string;
}

export interface ReturnStallDto {
  notes?: string;
}
