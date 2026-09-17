import { apiClient } from './client';
import type { Goal, GoalRequest } from '../types/planning';

export async function listActiveGoals(): Promise<Goal[]> {
  const res = await apiClient.get<Goal[]>('/api/goals');
  return res.data;
}

export async function createGoal(payload: GoalRequest): Promise<Goal> {
  const res = await apiClient.post<Goal>('/api/goals', payload);
  return res.data;
}

export async function updateGoal(id: string, payload: GoalRequest): Promise<Goal> {
  const res = await apiClient.put<Goal>(`/api/goals/${id}`, payload);
  return res.data;
}

export async function deactivateGoal(id: string): Promise<void> {
  await apiClient.delete(`/api/goals/${id}`);
}
