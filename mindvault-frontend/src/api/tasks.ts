import { apiClient } from './client';
import type { TaskStatusUpdateRequest } from '../types/planning';

export async function updateTaskStatus(id: string, payload: TaskStatusUpdateRequest): Promise<void> {
  await apiClient.put(`/api/tasks/${id}/status`, payload);
}
