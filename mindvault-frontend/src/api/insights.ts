import { apiClient } from './client';
import type { AiInsight } from '../types/planning';

export async function getPlanningInsights(): Promise<AiInsight[]> {
  const res = await apiClient.get<AiInsight[]>('/api/insights/planning');
  return res.data;
}
