import { apiClient } from './client';
import type { ReflectionRequest, ReflectionResponse } from '../types/planning';

export async function submitEveningReflection(payload: ReflectionRequest): Promise<ReflectionResponse> {
  const res = await apiClient.post<ReflectionResponse>('/api/reflection/today', payload);
  return res.data;
}
