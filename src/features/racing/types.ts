export type TournamentStatus =
  | 'UPCOMING'
  | 'OPEN_REGISTRATION'
  | 'CLOSED_REGISTRATION'
  | 'COMPLETED'
  | 'CANCELLED';

export type RegistrationStatus =
  | 'REGISTERED'
  | 'SCRATCHED_MEDICAL'
  | 'CONFIRMED'
  | 'DISQUALIFIED';

export type TrackSurface = 'TURF' | 'DIRT';

export interface TournamentResult {
  id: string;
  registrationId: string;
  finalRank: number;
  finishTimeSeconds: number;
  avgSpeedKmh: number;
  prizeMoneyWon: number;
  officialNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  horseId: string;
  horse: {
    id: string;
    name: string;
    horseCode?: string | null;
    breed: string;
    avatarUrl?: string | null;
    status: string;
    isMedicalLocked: boolean;
    ownerId?: string | null;
    owner?: { id: string; fullName: string; email: string } | null;
  };
  registeredByTrainerId: string;
  registeredByTrainer?: { id: string; fullName: string; email: string };
  status: RegistrationStatus;
  registrationDate: string;
  notes?: string | null;
  result?: TournamentResult | null;
}

export interface Tournament {
  id: string;
  name: string;
  raceDate: string;
  location: string;
  distanceMeters: number;
  trackType: TrackSurface;
  prizePool: number;
  registrationDeadline: string;
  status: TournamentStatus;
  createdAt: string;
  updatedAt: string;
  registeredCount?: number;
  registrations?: TournamentRegistration[];
}

export interface EligibilityHorse {
  id: string;
  name: string;
  horseCode?: string | null;
  breed: string;
  avatarUrl?: string | null;
  status: string;
  isMedicalLocked: boolean;
  completedWorkouts: number;
  owner?: { id: string; fullName: string } | null;
  isRegistered: boolean;
  registrationId?: string;
  ineligibleReasons?: string[];
}

export interface EligibilityResponse {
  tournament: {
    id: string;
    name: string;
    raceDate: string;
    distanceMeters: number;
    trackType: TrackSurface;
    status: TournamentStatus;
    registrationDeadline: string;
  };
  eligible: EligibilityHorse[];
  ineligible: EligibilityHorse[];
  totalEligible: number;
  totalIneligible: number;
}
