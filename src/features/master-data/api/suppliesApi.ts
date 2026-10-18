import { api } from '@/shared/lib/api';
import type {
  CreateShiftInput,
  CreateSupplyInput,
  ShiftCatalogItem,
  SupplyCatalogItem,
  SupplyCategory,
  UpdateShiftInput,
  UpdateSupplyInput,
} from '../types/supplies';

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** SC-4.10 Danh mục vật tư */
export async function getSupplies(filters?: {
  category?: SupplyCategory;
  status?: string;
  search?: string;
}): Promise<SupplyCatalogItem[]> {
  return api<SupplyCatalogItem[]>(
    'GET',
    `/supplies${qs({
      category: filters?.category,
      status: filters?.status,
      search: filters?.search,
    })}`,
  );
}

export async function getSupply(id: string): Promise<SupplyCatalogItem> {
  return api<SupplyCatalogItem>('GET', `/supplies/${id}`);
}

export async function createSupply(input: CreateSupplyInput): Promise<SupplyCatalogItem> {
  return api<SupplyCatalogItem>('POST', '/supplies', input);
}

export async function updateSupply(id: string, input: UpdateSupplyInput): Promise<SupplyCatalogItem> {
  return api<SupplyCatalogItem>('PUT', `/supplies/${id}`, input);
}

export async function setSupplyActive(id: string, isActive: boolean): Promise<SupplyCatalogItem> {
  return api<SupplyCatalogItem>('PATCH', `/supplies/${id}/status`, { isActive });
}

/** SC-4.11 Danh mục ca trực */
export async function getShifts(filters?: {
  includeInactive?: boolean;
  status?: string;
  search?: string;
}): Promise<ShiftCatalogItem[]> {
  return api<ShiftCatalogItem[]>(
    'GET',
    `/shifts${qs({
      includeInactive: filters?.includeInactive ? 'true' : undefined,
      status: filters?.status,
      search: filters?.search,
    })}`,
  );
}

export async function getShift(id: string): Promise<ShiftCatalogItem> {
  return api<ShiftCatalogItem>('GET', `/shifts/${id}`);
}

export async function createShift(input: CreateShiftInput): Promise<ShiftCatalogItem> {
  return api<ShiftCatalogItem>('POST', '/shifts', input);
}

export async function updateShift(id: string, input: UpdateShiftInput): Promise<ShiftCatalogItem> {
  return api<ShiftCatalogItem>('PUT', `/shifts/${id}`, input);
}

export async function setShiftActive(id: string, isActive: boolean): Promise<ShiftCatalogItem> {
  return api<ShiftCatalogItem>('PATCH', `/shifts/${id}/status`, { isActive });
}
