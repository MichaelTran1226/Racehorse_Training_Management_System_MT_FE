export type NutritionPlanStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type MealType = 'MORNING' | 'NOON' | 'EVENING';

export interface MealItem {
  supplyId: string;
  supplyCode?: string;
  supplyName: string;
  category: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface Meal {
  mealType: MealType;
  time?: string;
  items: MealItem[];
}

export interface NutritionPlan {
  id: string;
  planCode?: string;
  horseId: string;
  horse?: {
    id: string;
    name: string;
    horseCode?: string;
    microchipRfid?: string;
    avatarUrl?: string;
    status?: string;
    isMedicalLocked?: boolean;
    stallAllocations?: Array<{
      stall?: {
        id: string;
        code: string;
        zone?: string;
        zoneId?: string;
        zoneRef?: { id: string; name: string; code: string };
      };
    }>;
  };
  status: NutritionPlanStatus;
  dailyFeedWeightKg: number;
  targetWeightRatioPct: number;
  horseWeightSnapshot?: number;
  horseWeight?: number;
  isWithinSafeRange?: boolean;
  currentZone?: { id: string; name: string; code: string } | null;
  currentStallCode?: string | null;
  mealsJson: Meal[];
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

export interface FeedCalculationResult {
  dailyFeedWeightKg: number;
  horseWeightKg: number;
  targetWeightRatioPct: number;
  isWithinSafeRange: boolean;
  evaluation: 'OPTIMAL' | 'UNDER_MINIMUM' | 'EXCEEDS_MAXIMUM';
  warningMessage?: string;
}

export interface QueryNutritionPlansParams {
  horseId?: string;
  status?: string;
  zoneId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
