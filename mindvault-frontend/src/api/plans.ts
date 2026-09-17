import { apiClient } from './client';
import type { DailyPlan } from '../types/planning';

export async function getTodaysPlan(): Promise<DailyPlan | null> {
  const res = await apiClient.get<DailyPlan>('/api/plans/today');
  // 204 No Content will result in an empty string or null data, we can handle it safely
  return res.data ? res.data : null;
}

export async function getPlanHistory(): Promise<DailyPlan[]> {
  const res = await apiClient.get<DailyPlan[]>('/api/plans/history');
  return res.data;
}

export async function generateNextPlan(): Promise<DailyPlan> {
  const res = await apiClient.post<DailyPlan>('/api/plans/generate');
  return res.data;
}
