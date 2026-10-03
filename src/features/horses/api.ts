import { api } from "@/shared/lib/api";
import { getStoredHorses, addStoredHorse, deleteStoredHorse } from "@/shared/mock/horsesData";
import type { Horse, HorseListFilter } from "./types";

export async function getHorses(filter?: HorseListFilter): Promise<Horse[]> {
  try {
    return await api<Horse[]>("GET", "/horses");
  } catch {
    // Fallback to stored horses in mock mode
    const stored = getStoredHorses();
    let result: Horse[] = stored.map((h) => ({
      id: h.id,
      name: h.name,
      microchipRfid: h.code,
      breed: h.breed || "Thoroughbred",
      dob: h.dob || "2021-04-12",
      gender: h.gender || "Colt",
      color: h.color || "Bay Dark",
      status: (h.healthGroup === "FIT" ? "ACTIVE" : h.healthGroup === "QUARANTINED" ? "ISOLATED" : h.healthGroup) as any,
      isMedicalLocked: h.isLocked,
      stallCode: h.stall,
    }));

    if (filter?.status && filter.status !== "ALL") {
      result = result.filter((h) => h.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(q) || h.microchipRfid.toLowerCase().includes(q));
    }
    return result;
  }
}

export async function getHorseById(id: string): Promise<Horse | null> {
  try {
    return await api<Horse>("GET", `/horses/${id}`);
  } catch {
    const list = await getHorses();
    return list.find((h) => h.id === id) || null;
  }
}

export async function createHorse(data: Partial<Horse>): Promise<Horse> {
  try {
    return await api<Horse>("POST", "/horses", data);
  } catch {
    const newHorse: Horse = {
      id: `horse-${Date.now()}`,
      name: data.name || "Unnamed Horse",
      microchipRfid: data.microchipRfid || `RFID-${Date.now()}`,
      breed: data.breed || "Thoroughbred",
      dob: data.dob || new Date().toISOString().split("T")[0],
      gender: data.gender || "Colt",
      color: data.color || "Bay",
      status: data.status || "ACTIVE",
      isMedicalLocked: false,
      stallCode: data.stallCode,
    };
    addStoredHorse({
      id: newHorse.id,
      name: newHorse.name,
      code: newHorse.microchipRfid,
      stall: newHorse.stallCode || "Stall A-01",
      healthGroup: newHorse.status === "ACTIVE" ? "FIT" : "INJURED",
      statusText: newHorse.status,
      isLocked: false,
      restingHeartRate: 38,
      temp: 38.0,
      breed: newHorse.breed,
      dob: newHorse.dob,
      gender: newHorse.gender,
      color: newHorse.color,
    });
    return newHorse;
  }
}

export async function deleteHorse(id: string): Promise<void> {
  try {
    await api("DELETE", `/horses/${id}`);
  } catch {
    deleteStoredHorse(id);
  }
}
