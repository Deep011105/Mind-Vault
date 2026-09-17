import { apiClient } from './client';
import type { MoodStats } from '../types';

// GET /api/moods/stats — counts, streaks, and a 30-day mood timeline.
export async function getMoodStats(): Promise<MoodStats> {
  const res = await apiClient.get<MoodStats>('/api/moods/stats');
  return res.data;
}
