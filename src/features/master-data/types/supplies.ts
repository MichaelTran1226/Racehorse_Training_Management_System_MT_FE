export type SupplyCategory =
  | 'FEED_HAY'
  | 'FEED_GRAIN'
  | 'SUPPLEMENT_VITAMIN'
  | 'SUPPLEMENT_MINERAL'
  | 'SUPPLEMENT_ELECTROLYTE'
  | 'SUPPLEMENT_GENERAL'
  | 'MEDICINE'
  | 'VACCINE'
  | 'DEWORMER'
  | 'TOOL_EQUIPMENT'
  | 'CLEANING_SUPPLY';

export type SupplyUnit =
  | 'KG'
  | 'G'
  | 'LITER'
  | 'ML'
  | 'PILL'
  | 'PACKET'
  | 'BOTTLE'
  | 'VIAL'
  | 'PIECE'
  | 'SET';

export const SUPPLY_CATEGORY_LABELS: Record<SupplyCategory, string> = {
  FEED_HAY: 'Hay',
  FEED_GRAIN: 'Grain',
  SUPPLEMENT_VITAMIN: 'Vitamins',
  SUPPLEMENT_MINERAL: 'Minerals',
  SUPPLEMENT_ELECTROLYTE: 'Electrolytes',
  SUPPLEMENT_GENERAL: 'Supplements',
  MEDICINE: 'Medicine',
  VACCINE: 'Vaccine',
  DEWORMER: 'Dewormer',
  TOOL_EQUIPMENT: 'Tools & Equipment',
  CLEANING_SUPPLY: 'Cleaning Supplies',
};

import { tr } from '@/shared/i18n/tr';

export const SUPPLY_UNIT_LABELS: Record<SupplyUnit, string> = {
  KG: 'kg',
  G: 'g',
  LITER: 'liter',
  ML: 'ml',
  PILL: 'pill',
  PACKET: 'packet',
  BOTTLE: 'bottle',
  VIAL: 'vial',
  PIECE: 'piece',
  SET: 'set',
};

export function formatSupplyUnit(unit?: string): string {
  if (!unit) return '';
  const key = unit.toUpperCase() as SupplyUnit;
  const label = SUPPLY_UNIT_LABELS[key] || unit;
  return tr(label);
}

export type SupplyMajorGroup = 'FEED' | 'MEDICINE_SUPPLEMENT' | 'EQUIPMENT';

export function getSupplyMajorGroup(category?: string): SupplyMajorGroup {
  if (!category) return 'FEED';
  const c = category.toUpperCase();
  if (c.startsWith('FEED') || c === 'FEED') return 'FEED';
  if (
    c.startsWith('MED') ||
    c.startsWith('SUPPLEMENT') ||
    c === 'VACCINE' ||
    c === 'DEWORMER' ||
    c === 'MEDICINE' ||
    c === 'CARE'
  ) {
    return 'MEDICINE_SUPPLEMENT';
  }
  return 'EQUIPMENT';
}

export function formatSupplyName(name?: string): string {
  return name || '';
}

export function getFriendlyCategoryName(category?: string): string {
  if (!category) return '';
  const c = category.toUpperCase();
  if (c === 'FEED_HAY') return tr('Hay');
  if (c === 'FEED_GRAIN') return tr('Grain');
  if (c.startsWith('FEED') || c === 'FEED') return tr('Feed & Forage');
  if (c === 'MEDICINE' || c.startsWith('MED')) return tr('Medicine');
  if (c === 'VACCINE') return tr('Vaccine');
  if (c === 'DEWORMER') return tr('Dewormer');
  if (c.startsWith('SUPPLEMENT_VITAMIN')) return tr('Vitamins');
  if (c.startsWith('SUPPLEMENT_MINERAL')) return tr('Minerals');
  if (c.startsWith('SUPPLEMENT_ELECTROLYTE')) return tr('Electrolytes');
  if (c.startsWith('SUPPLEMENT') || c === 'CARE') return tr('Supplements');
  if (c.startsWith('TOOL') || c === 'EQUIPMENT') return tr('Tools & Equipment');
  if (c.startsWith('CLEANING')) return tr('Cleaning Supplies');
  const label = SUPPLY_CATEGORY_LABELS[category as SupplyCategory];
  return label ? tr(label) : category;
}

export interface SupplyCatalogItem {
  id: string;
  code: string;
  name: string;
  category: SupplyCategory;
  unit: SupplyUnit;
  unitPrice: number | null;
  withdrawalDays?: number | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplyInput {
  code: string;
  name: string;
  category: SupplyCategory;
  unit: SupplyUnit;
  unitPrice?: number;
  withdrawalDays?: number;
  description?: string;
}

export interface UpdateSupplyInput {
  name?: string;
  category?: SupplyCategory;
  unit?: SupplyUnit;
  unitPrice?: number;
  withdrawalDays?: number;
  description?: string;
}

export interface ShiftCatalogItem {
  id: string;
  code: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isOvernight: boolean;
  sortOrder: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftInput {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  sortOrder?: number;
  description?: string;
}

export interface UpdateShiftInput {
  name?: string;
  startTime?: string;
  endTime?: string;
  sortOrder?: number;
  description?: string;
}
