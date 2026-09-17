import { apiClient } from './client';
import type { DailyPrompt } from '../types';

// GET /api/prompts/today — a reflective writing prompt, personalized once a
// long-term profile exists, a static rotating fallback otherwise.
export async function getTodayPrompt(): Promise<DailyPrompt> {
  const res = await apiClient.get<DailyPrompt>('/api/prompts/today');
  return res.data;
}
