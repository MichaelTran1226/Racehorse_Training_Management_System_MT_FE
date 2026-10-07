import { api } from "@/shared/lib/api";
import type { Stall, CreateStallDto, UpdateStallDto, AssignHorseDto, TransferHorseDto, ReturnStallDto } from "./types";

export async function getStalls(filters?: { zone?: string; status?: string; search?: string }): Promise<Stall[]> {
  const params = new URLSearchParams();
  if (filters?.zone) params.set("zone", filters.zone);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  return await api<Stall[]>("GET", `/stalls${query}`);
}

export async function getZones(): Promise<string[]> {
  return await api<string[]>("GET", "/stalls/zones");
}

export async function createStall(dto: CreateStallDto): Promise<Stall> {
  return await api<Stall>("POST", "/stalls", dto);
}

export async function updateStall(id: string, dto: UpdateStallDto): Promise<Stall> {
  return await api<Stall>("PUT", `/stalls/${id}`, dto);
}

export async function deleteStall(id: string): Promise<{ success: boolean }> {
  return await api<{ success: boolean }>("DELETE", `/stalls/${id}`);
}

export async function assignHorse(stallId: string, dto: AssignHorseDto): Promise<any> {
  return await api<any>("POST", `/stalls/${stallId}/allocations`, dto);
}

export async function transferHorse(allocId: string, dto: TransferHorseDto): Promise<any> {
  return await api<any>("PUT", `/stalls/allocations/${allocId}/transfer`, dto);
}

export async function returnStall(allocId: string, dto: ReturnStallDto): Promise<any> {
  return await api<any>("PUT", `/stalls/allocations/${allocId}/return`, dto);
}
