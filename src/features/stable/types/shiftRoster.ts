import type { ShiftCatalogItem } from '@/features/master-data/types/supplies';
import type { Zone } from '../types';

export interface GroomUserSummary {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  status: string;
  role: string;
}

export interface ShiftRosterItem {
  id: string;
  date: string;
  shiftId: string;
  shift: ShiftCatalogItem;
  zoneId: string;
  zone: Zone;
  groomUserId: string;
  groom: GroomUserSummary;
  notes?: string | null;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export type ApplyScope = 'ONLY_THIS_DAY' | 'REST_OF_WEEK' | 'SAME_DAY_4_WEEKS';

export interface AssignSlotInput {
  date: string; // YYYY-MM-DD
  shiftId: string;
  zoneId: string;
  groomUserIds: string[];
  applyScope?: ApplyScope;
  notes?: string;
}

export interface CopyWeekInput {
  sourceWeekStart: string; // YYYY-MM-DD
  targetWeekStart: string; // YYYY-MM-DD
  overwrite?: boolean;
}

export interface AssignedHorse {
  id: string;
  name: string;
  horseCode?: string | null;
  status: string;
  isMedicalLocked: boolean;
}

export interface MyShiftItem {
  id: string;
  date: string;
  shift: ShiftCatalogItem;
  zone: {
    id: string;
    code: string;
    name: string;
  };
  notes?: string | null;
  assignedHorsesCount: number;
  assignedHorses: AssignedHorse[];
}
