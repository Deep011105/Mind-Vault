import { apiClient } from './client';
import type { ChatMessage } from '../types';

// GET /api/chat/history — full conversation so far, chronological.
export async function getChatHistory(): Promise<ChatMessage[]> {
  const res = await apiClient.get<ChatMessage[]>('/api/chat/history');
  return res.data;
}

// POST /api/chat — send a message, get the assistant's reply back.
// Note: this returns only the assistant's reply (the user turn is persisted
// server-side but not echoed back) — the caller should append the user's own
// message optimistically before calling this.
export async function sendChatMessage(message: string): Promise<ChatMessage> {
  const res = await apiClient.post<ChatMessage>('/api/chat', { message });
  return res.data;
}
