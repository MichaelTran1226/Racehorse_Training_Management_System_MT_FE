import { api } from "@/shared/lib/api";
import type {
  Horse,
  HorseListFilter,
  HorseListResponse,
  CreateHorsePayload,
  UpdateHorsePayload,
} from "./types";

export async function getHorses(filter?: HorseListFilter): Promise<HorseListResponse> {
  const params = new URLSearchParams();
  if (filter?.search) params.set("search", filter.search);
  if (filter?.status && filter.status !== "ALL") params.set("status", filter.status);
  if (filter?.isMedicalLocked !== undefined && filter.isMedicalLocked !== "") {
    params.set("isMedicalLocked", filter.isMedicalLocked);
  }
  if (filter?.breed && filter.breed !== "ALL") params.set("breed", filter.breed);
  if (filter?.gender && filter.gender !== "ALL") params.set("gender", filter.gender);
  if (filter?.sortBy) params.set("sortBy", filter.sortBy);
  if (filter?.sortOrder) params.set("sortOrder", filter.sortOrder);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await api<HorseListResponse | Horse[]>("GET", `/horses${query}`);

  if (Array.isArray(res)) {
    return {
      items: res,
      total: res.length,
      page: filter?.page || 1,
      limit: filter?.limit || res.length || 20,
      totalPages: 1,
    };
  }
  return res;
}

export async function getHorseById(id: string): Promise<Horse> {
  return await api<Horse>("GET", `/horses/${id}`);
}

export async function createHorse(data: CreateHorsePayload): Promise<Horse> {
  return await api<Horse>("POST", "/horses", data);
}

export async function updateHorse(id: string, data: UpdateHorsePayload): Promise<Horse> {
  return await api<Horse>("PUT", `/horses/${id}`, data);
}

export async function deleteHorse(id: string): Promise<{ success: boolean; message: string }> {
  return await api<{ success: boolean; message: string }>("DELETE", `/horses/${id}`);
}
