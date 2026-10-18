import { api } from '@/shared/lib/api';
import type {
  CreateIncidentPayload,
  IncidentReport,
  IncidentsListResponse,
  QueryIncidentsFilter,
  ReviewIncidentPayload,
} from '../types/incidents';

function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      p.set(k, String(v));
    }
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const incidentsApi = {
  /** Lấy danh sách sự cố chuồng trại theo bộ lọc */
  async list(filter?: QueryIncidentsFilter): Promise<IncidentsListResponse> {
    return api<IncidentsListResponse>(
      'GET',
      `/incidents${qs({
        horseId: filter?.horseId,
        zoneId: filter?.zoneId,
        severity: filter?.severity,
        status: filter?.status,
        startDate: filter?.startDate,
        endDate: filter?.endDate,
        page: filter?.page,
        limit: filter?.limit,
      })}`,
    );
  },

  /** Xem chi tiết một sự cố */
  async getById(id: string): Promise<IncidentReport> {
    return api<IncidentReport>('GET', `/incidents/${id}`);
  },

  /** DL-4.05 Báo cáo sự cố hoặc ghi nhận quan sát sức khỏe mới */
  async create(payload: CreateIncidentPayload): Promise<IncidentReport> {
    return api<IncidentReport>('POST', '/incidents', payload);
  },

  /** Thú y hoặc Quản lý cập nhật trạng thái và ghi chú xử lý sự cố */
  async review(id: string, payload: ReviewIncidentPayload): Promise<IncidentReport> {
    return api<IncidentReport>('POST', `/incidents/${id}/review`, payload);
  },
};
