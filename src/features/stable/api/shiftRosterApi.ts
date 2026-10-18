import { api } from '@/shared/lib/api';
import type {
  AssignSlotInput,
  CopyWeekInput,
  GroomUserSummary,
  MyShiftItem,
  ShiftRosterItem,
} from '../types/shiftRoster';

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** SC-4.01 Lấy danh sách phân ca theo khoảng ngày và khu */
export async function getShiftRosters(filters?: {
  startDate?: string;
  endDate?: string;
  zoneId?: string;
  groomUserId?: string;
}): Promise<ShiftRosterItem[]> {
  return api<ShiftRosterItem[]>(
    'GET',
    `/shift-rosters${qs({
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      zoneId: filters?.zoneId,
      groomUserId: filters?.groomUserId,
    })}`,
  );
}

/** SC-4.01 / SC-4.05 Ca trực của tôi (Groom) */
export async function getMyShifts(filters?: {
  startDate?: string;
  endDate?: string;
  zoneId?: string;
}): Promise<MyShiftItem[]> {
  return api<MyShiftItem[]>(
    'GET',
    `/shift-rosters/my${qs({
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      zoneId: filters?.zoneId,
    })}`,
  );
}

/** BTN-4.04 / DL-4.01 Phân ca một ô */
export async function assignShiftSlot(
  input: AssignSlotInput,
): Promise<{ success: boolean; affectedDatesCount: number; groomCount: number }> {
  return api('POST', '/shift-rosters', input);
}

/** Xóa một phân công */
export async function deleteShiftRoster(id: string): Promise<{ success: boolean }> {
  return api('DELETE', `/shift-rosters/${id}`);
}

/** BTN-4.05 / DL-4.02 Sao chép phân ca tuần */
export async function copyWeekRosters(
  input: CopyWeekInput,
): Promise<{ copiedCount: number; skippedInactiveGrooms: number }> {
  return api('POST', '/shift-rosters/copy-week', input);
}

/** Lấy danh sách Groom đang hoạt động để phân ca */
export async function getActiveGrooms(): Promise<GroomUserSummary[]> {
  try {
    const res = await api<{ accounts: Array<{ id: string; fullName: string; email: string; phoneNumber?: string | null; role: string; status: string }> }>(
      'GET',
      '/accounts',
    );
    return res.accounts
      .filter((a) => a.role === 'GROOM' && a.status === 'ACTIVE')
      .map((a) => ({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phoneNumber: a.phoneNumber,
        status: a.status,
        role: a.role,
      }));
  } catch {
    return [];
  }
}
