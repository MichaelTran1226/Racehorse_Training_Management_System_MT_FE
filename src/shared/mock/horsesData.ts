export interface HerdHorse {
  id: string;
  name: string;
  code: string;
  stall: string;
  healthGroup: "FIT" | "WATCH" | "INJURED" | "QUARANTINED";
  statusText: string;
  isLocked: boolean;
  lockReason?: string;
  primaryDiagnosis?: string;
  restingHeartRate: number;
  temp: number;
  breed?: string;
  dob?: string;
  gender?: string;
  color?: string;
}

const HORSES_STORAGE_KEY = "equiflow.herd.horses.v4";
const INJURIES_STORAGE_PREFIX = "equiflow.injuries.v4.";

// Purge old versions to ensure zero default horses
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("equiflow.herd.horses.v1");
    localStorage.removeItem("equiflow.herd.horses.v2");
    localStorage.removeItem("equiflow.herd.horses.v3");
    // Also clean up legacy injuries
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("equiflow.injuries.v1.") || k.startsWith("equiflow.injuries.v2.") || k.startsWith("equiflow.injuries.v3."))) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

export function getStoredHorses(): HerdHorse[] {
  try {
    const raw = localStorage.getItem(HORSES_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as HerdHorse[];
  } catch {
    // fallback
  }
  return [];
}

export function saveStoredHorses(horses: HerdHorse[]): void {
  try {
    localStorage.setItem(HORSES_STORAGE_KEY, JSON.stringify(horses));
  } catch {
    // localStorage unavailable
  }
}

export function addStoredHorse(horse: HerdHorse): void {
  const current = getStoredHorses();
  const updated = [horse, ...current.filter((h) => h.id !== horse.id)];
  saveStoredHorses(updated);
}

export function deleteStoredHorse(horseId: string): void {
  const current = getStoredHorses();
  saveStoredHorses(current.filter((h) => h.id !== horseId));
  try {
    localStorage.removeItem(`${INJURIES_STORAGE_PREFIX}${horseId}`);
  } catch {
    // fallback
  }
}

export function clearAllStoredHorses(): void {
  saveStoredHorses([]);
  if (typeof window !== "undefined") {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(INJURIES_STORAGE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    } catch {
      // ignore
    }
  }
}

export function getHorseById(id: string): HerdHorse | undefined {
  const horses = getStoredHorses();
  return horses.find((h) => h.id === id);
}

export function getInjuriesForHorse(horseId: string): any[] {
  try {
    const raw = localStorage.getItem(`${INJURIES_STORAGE_PREFIX}${horseId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export function saveInjuriesForHorse(horseId: string, injuries: any[]): void {
  try {
    localStorage.setItem(`${INJURIES_STORAGE_PREFIX}${horseId}`, JSON.stringify(injuries));
  } catch {
    // localStorage unavailable
  }
}

