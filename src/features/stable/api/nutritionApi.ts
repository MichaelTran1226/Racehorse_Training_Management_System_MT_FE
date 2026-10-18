import { api } from '@/shared/lib/api';
import type {
  FeedCalculationResult,
  Meal,
  NutritionPlan,
  QueryNutritionPlansParams,
} from '../types/nutrition';

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

export interface NutritionPlanListResponse {
  items: NutritionPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateNutritionPlanPayload {
  horseId: string;
  meals: Meal[];
  specialInstructions?: string;
  validFrom?: string;
  validTo?: string;
  submitImmediately?: boolean;
}

export interface UpdateNutritionPlanPayload {
  meals?: Meal[];
  specialInstructions?: string;
  validFrom?: string;
  validTo?: string;
}

export interface ReviewNutritionPlanPayload {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
  vetNotes?: string;
}

export const nutritionApi = {
  /** SC-4.03 Lấy danh sách kế hoạch khẩu phần */
  async list(params?: QueryNutritionPlansParams): Promise<NutritionPlanListResponse> {
    return api<NutritionPlanListResponse>(
      'GET',
      `/nutrition-plans${qs({
        horseId: params?.horseId,
        status: params?.status,
        zoneId: params?.zoneId,
        search: params?.search,
        page: params?.page,
        limit: params?.limit,
      })}`,
    );
  },

  /** Chi tiết 1 khẩu phần */
  async getById(id: string): Promise<NutritionPlan> {
    return api<NutritionPlan>('GET', `/nutrition-plans/${id}`);
  },

  /** Khẩu phần đang có hiệu lực (APPROVED) của ngựa */
  async getActiveForHorse(horseId: string): Promise<NutritionPlan | null> {
    return api<NutritionPlan | null>('GET', `/nutrition-plans/horses/${horseId}/active`);
  },

  /** Tính toán định mức khoa học & kiểm tra ngưỡng an toàn 1.5% - 3.0% */
  async calculateMetrics(horseId: string, meals: Meal[]): Promise<FeedCalculationResult> {
    return api<FeedCalculationResult>('POST', '/nutrition-plans/calculate-metrics', {
      horseId,
      meals,
    });
  },

  /** Tạo mới Draft hoặc Gửi duyệt */
  async create(payload: CreateNutritionPlanPayload): Promise<NutritionPlan> {
    return api<NutritionPlan>('POST', '/nutrition-plans', payload);
  },

  /** Chỉnh sửa Draft / Rejected */
  async update(id: string, payload: UpdateNutritionPlanPayload): Promise<NutritionPlan> {
    return api<NutritionPlan>('PUT', `/nutrition-plans/${id}`, payload);
  },

  /** Gửi duyệt (DRAFT / REJECTED -> PENDING_APPROVAL) */
  async submitForApproval(id: string): Promise<NutritionPlan> {
    return api<NutritionPlan>('POST', `/nutrition-plans/${id}/submit`, {});
  },

  /** Thẩm định: Phê duyệt hoặc Từ chối kèm lý do */
  async review(id: string, payload: ReviewNutritionPlanPayload): Promise<NutritionPlan> {
    return api<NutritionPlan>('POST', `/nutrition-plans/${id}/review`, payload);
  },

  /** Xóa bản nháp */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    return api<{ success: boolean; message: string }>('DELETE', `/nutrition-plans/${id}`);
  },
};
