import { apiClient } from './client';
import type { JournalEntry, CreateJournalRequest, UpdateJournalRequest } from '../types';

// GET /api/journals — all non-deleted entries, newest first.
// Note: unlike the old contract, the backend returns [] rather than 404 when
// there are zero entries, so no special-casing is needed here.
export async function getAllEntries(): Promise<JournalEntry[]> {
  const res = await apiClient.get<JournalEntry[]>('/api/journals');
  return res.data;
}

export async function getEntry(id: string): Promise<JournalEntry> {
  const res = await apiClient.get<JournalEntry>(`/api/journals/${id}`);
  return res.data;
}

// POST /api/journals — create a new entry (backend stamps createdAt as server time)
export async function createEntry(payload: CreateJournalRequest): Promise<JournalEntry> {
  const res = await apiClient.post<JournalEntry>('/api/journals', payload);
  return res.data;
}

// PUT /api/journals/{id} — update an existing entry
export async function updateEntry(id: string, payload: UpdateJournalRequest): Promise<JournalEntry> {
  const res = await apiClient.put<JournalEntry>(`/api/journals/${id}`, payload);
  return res.data;
}

// DELETE /api/journals/{id} — soft-delete
export async function deleteEntry(id: string): Promise<void> {
  await apiClient.delete(`/api/journals/${id}`);
}

// GET /api/export/{id} — PDF export. Export-only; not part of the RAG pipeline.
export async function downloadEntryPdf(id: string, dateLabel: string): Promise<void> {
  try {
    const res = await apiClient.get(`/api/export/${id}`, { responseType: 'blob' });
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });

    const url = window.URL.createObjectURL(blob);
    const safeName = dateLabel.trim().replace(/[^a-z0-9\-_]+/gi, '_').slice(0, 60) || 'journal_entry';
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    const data = err?.response?.data;
    if (data instanceof Blob && data.type.includes('json')) {
      const text = await data.text();
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || parsed.message || 'Could not generate PDF');
      } catch {
        throw new Error('Could not generate PDF');
      }
    }
    throw err;
  }
}
