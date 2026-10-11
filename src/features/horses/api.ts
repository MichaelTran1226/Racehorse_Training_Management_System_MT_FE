import { api } from "@/shared/lib/api";
import type {
  Horse,
  HorseListFilter,
  HorseListResponse,
  CreateHorsePayload,
  UpdateHorsePayload,
  HorseHistoryResponse,
  ChangeHorseStatusPayload,
  DeletedHorseFilter,
  DeletedHorseListResponse,
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

// Xóa mềm (DL-1.10): hồ sơ chuyển sang mục Hồ sơ đã xóa, khôi phục được.
export async function deleteHorse(
  id: string,
  payload: { reason: string; confirmName: string },
): Promise<{ success: boolean; message: string }> {
  return await api<{ success: boolean; message: string }>("DELETE", `/horses/${id}`, payload);
}

// SC-1.05 (chỉ CM).
export async function getDeletedHorses(filter?: DeletedHorseFilter): Promise<DeletedHorseListResponse> {
  const params = new URLSearchParams();
  if (filter?.search) params.set("search", filter.search);
  if (filter?.from) params.set("from", filter.from);
  if (filter?.to) params.set("to", filter.to);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));
  const query = params.toString() ? `?${params.toString()}` : "";
  return await api<DeletedHorseListResponse>("GET", `/horses/deleted${query}`);
}

// DL-1.11 Khôi phục (cần lý do) hoặc nút Hoàn tác ngay sau khi xóa (undo = true, không cần lý do).
export async function restoreHorse(
  id: string,
  payload: { reason?: string; undo?: boolean },
): Promise<{ success: boolean; message: string }> {
  return await api<{ success: boolean; message: string }>("POST", `/horses/${id}/restore`, payload);
}

export async function changeHorseStatus(
  id: string,
  payload: ChangeHorseStatusPayload,
): Promise<{ success: boolean; data: any; message: string; effects?: string[] }> {
  return await api<{ success: boolean; data: any; message: string; effects?: string[] }>(
    "PATCH",
    "/horses/" + id + "/status",
    payload,
  );
}

export async function transferHorseOwner(
  id: string,
  payload: { newOwnerId: string; reason?: string },
): Promise<Horse> {
  return await api<Horse>("PATCH", `/horses/${id}/transfer-owner`, payload);
}

export async function getHorseHistory(id: string): Promise<HorseHistoryResponse> {
  return await api<HorseHistoryResponse>("GET", `/horses/${id}/history`);
}

