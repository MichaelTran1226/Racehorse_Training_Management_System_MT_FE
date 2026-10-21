import type { Tournament } from "@/features/racing/types";

const RACING_STORAGE_KEY = "equiflow_mock_tournaments";

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: "tourney-01",
    name: "Grand Autumn Cup 2026",
    raceDate: "2026-11-15T08:00:00Z",
    location: "Phu Tho Racetrack, Ho Chi Minh City",
    distanceMeters: 1600,
    trackType: "TURF",
    prizePool: 120000000,
    registrationDeadline: "2026-11-10T23:59:59Z",
    status: "OPEN_REGISTRATION",
    createdAt: "2026-10-01T09:00:00Z",
    updatedAt: "2026-10-15T10:00:00Z",
    registeredCount: 2,
    registrations: [
      {
        id: "reg-01",
        tournamentId: "tourney-01",
        horseId: "h-01",
        horse: {
          id: "h-01",
          name: "Thunder Bolt",
          horseCode: "HRS-001",
          breed: "Thoroughbred",
          status: "ACTIVE",
          isMedicalLocked: false,
          owner: { id: "u-owner-01", fullName: "Ha Ly", email: "ha.ly@gmail.com" },
        },
        registeredByTrainerId: "u-trainer-01",
        registeredByTrainer: { id: "u-trainer-01", fullName: "Nam Tran", email: "nam.tran@gmail.com" },
        status: "REGISTERED",
        registrationDate: "2026-10-12T14:30:00Z",
        notes: "Target top 3 finish. Maintain steady pace first 1000m.",
      },
      {
        id: "reg-02",
        tournamentId: "tourney-01",
        horseId: "h-02",
        horse: {
          id: "h-02",
          name: "Golden Pegasus",
          horseCode: "HRS-002",
          breed: "Arabian",
          status: "ACTIVE",
          isMedicalLocked: false,
          owner: { id: "u-owner-02", fullName: "Minh Vu", email: "minh.vu@gmail.com" },
        },
        registeredByTrainerId: "u-trainer-01",
        registeredByTrainer: { id: "u-trainer-01", fullName: "Nam Tran", email: "nam.tran@gmail.com" },
        status: "REGISTERED",
        registrationDate: "2026-10-14T09:15:00Z",
        notes: "Aggressive sprint from start.",
      },
    ],
  },
  {
    id: "tourney-02",
    name: "Saigon Spring Sprint 2026",
    raceDate: "2026-09-20T08:00:00Z",
    location: "Phu Tho Racetrack, Ho Chi Minh City",
    distanceMeters: 1200,
    trackType: "TURF",
    prizePool: 80000000,
    registrationDeadline: "2026-09-15T23:59:59Z",
    status: "COMPLETED",
    createdAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-09-20T12:00:00Z",
    registeredCount: 2,
    registrations: [
      {
        id: "reg-03",
        tournamentId: "tourney-02",
        horseId: "h-01",
        horse: {
          id: "h-01",
          name: "Thunder Bolt",
          horseCode: "HRS-001",
          breed: "Thoroughbred",
          status: "RESTING",
          isMedicalLocked: false,
          owner: { id: "u-owner-01", fullName: "Ha Ly", email: "ha.ly@gmail.com" },
        },
        registeredByTrainerId: "u-trainer-01",
        status: "CONFIRMED",
        registrationDate: "2026-09-10T10:00:00Z",
        result: {
          id: "res-01",
          registrationId: "reg-03",
          finalRank: 1,
          finishTimeSeconds: 71.85,
          avgSpeedKmh: 60.13,
          prizeMoneyWon: 50000000,
          officialNotes: "Outstanding performance, record breaking final 200m sprint.",
          createdAt: "2026-09-20T11:00:00Z",
          updatedAt: "2026-09-20T11:30:00Z",
        },
      },
      {
        id: "reg-04",
        tournamentId: "tourney-02",
        horseId: "h-02",
        horse: {
          id: "h-02",
          name: "Golden Pegasus",
          horseCode: "HRS-002",
          breed: "Arabian",
          status: "RESTING",
          isMedicalLocked: false,
          owner: { id: "u-owner-02", fullName: "Minh Vu", email: "minh.vu@gmail.com" },
        },
        registeredByTrainerId: "u-trainer-01",
        status: "CONFIRMED",
        registrationDate: "2026-09-11T11:00:00Z",
        result: {
          id: "res-02",
          registrationId: "reg-04",
          finalRank: 2,
          finishTimeSeconds: 73.1,
          avgSpeedKmh: 59.1,
          prizeMoneyWon: 20000000,
          officialNotes: "Strong pace, closely contended.",
          createdAt: "2026-09-20T11:00:00Z",
          updatedAt: "2026-09-20T11:30:00Z",
        },
      },
    ],
  },
  {
    id: "tourney-03",
    name: "National Endurance Derby 2026",
    raceDate: "2026-12-10T07:30:00Z",
    location: "Binh Duong Equestrian Park",
    distanceMeters: 2400,
    trackType: "DIRT",
    prizePool: 200000000,
    registrationDeadline: "2026-12-01T23:59:59Z",
    status: "UPCOMING",
    createdAt: "2026-10-10T09:00:00Z",
    updatedAt: "2026-10-10T09:00:00Z",
    registeredCount: 0,
    registrations: [],
  },
  {
    id: "tourney-04",
    name: "Phu Tho Summer Classic 2026",
    raceDate: "2026-08-15T08:00:00Z",
    location: "Phu Tho Racecourse - Track B",
    distanceMeters: 1600,
    trackType: "TURF",
    prizePool: 150000000,
    registrationDeadline: "2026-08-01T23:59:59Z",
    status: "CANCELLED",
    createdAt: "2026-07-01T09:00:00Z",
    updatedAt: "2026-08-02T10:00:00Z",
    registeredCount: 0,
    registrations: [],
  },
];

export function getStoredTournaments(): Tournament[] {
  if (typeof window === "undefined") return INITIAL_TOURNAMENTS;
  try {
    const raw = localStorage.getItem(RACING_STORAGE_KEY);
    if (!raw) {
      saveStoredTournaments(INITIAL_TOURNAMENTS);
      return INITIAL_TOURNAMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TOURNAMENTS;
  }
}

export function saveStoredTournaments(list: Tournament[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RACING_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save tournaments", e);
  }
}
