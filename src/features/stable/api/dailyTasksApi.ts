import { api } from '@/shared/lib/api';
import type {
  DailyCareTask,
  DailyTasksResponse,
  QueryDailyTasksFilter,
} from '../types/dailyTasks';

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      p.set(k, String(v));
    }
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const dailyTasksApi = {
  /** SC-4.04 Lấy danh sách checklist công việc theo ngày & bộ lọc */
  async list(filter?: QueryDailyTasksFilter): Promise<DailyTasksResponse> {
    return api<DailyTasksResponse>(
      'GET',
      `/daily-tasks${qs({
        date: filter?.date,
        zoneId: filter?.zoneId,
        horseId: filter?.horseId,
        taskType: filter?.taskType,
        isCompleted: filter?.isCompleted,
        onlyMine: filter?.onlyMine ?? filter?.onlyMyTasks,
        onlyMyTasks: filter?.onlyMyTasks ?? filter?.onlyMine,
        page: filter?.page,
        limit: filter?.limit,
      })}`,
    );
  },

  /** Kích hoạt sinh công việc thủ công cho một ngày cụ thể */
  async generate(
    param?: string | { date?: string; zoneId?: string },
    zoneId?: string,
  ): Promise<{ message?: string; date: string; totalGenerated: number; horsesProcessed: number }> {
    const payload =
      typeof param === 'object'
        ? param
        : { date: param, zoneId };
    return api('POST', '/daily-tasks/generate', payload);
  },

  /** Đánh dấu hoàn thành 1 công việc */
  async complete(id: string, notes?: string): Promise<DailyCareTask> {
    return api<DailyCareTask>('POST', `/daily-tasks/${id}/complete`, { notes });
  },

  /** Hoàn tác công việc trong vòng 15 phút */
  async uncomplete(id: string): Promise<DailyCareTask> {
    return api<DailyCareTask>('POST', `/daily-tasks/${id}/uncomplete`, {});
  },
};
