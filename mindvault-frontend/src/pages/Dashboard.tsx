import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Calendar from '../components/Calendar';
import DayPanel from '../components/DayPanel';
import EntryModal from '../components/EntryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../api/client';
import * as journalApi from '../api/journal';
import * as promptApi from '../api/prompt';
import type { JournalEntry, Mood, DailyPrompt } from '../types';
import { moodMeta } from '../utils/mood';
import { todayKey, toDayKey, formatLocalDayKey } from '../utils/date';

export default function Dashboard() {
  const { showToast } = useToast();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey());

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
    promptApi.getTodayPrompt().then(setPrompt).catch(() => {
      /* prompt card is a nice-to-have; fail silently rather than block the page */
    });
  }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await journalApi.getAllEntries();
      setEntries(data);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  const entriesByDay = useMemo(() => {
    const map: Record<string, JournalEntry[]> = {};
    for (const entry of entries) {
      const key = toDayKey(entry.createdAt);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    for (const key in map) {
      map[key].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return map;
  }, [entries]);

  const entryCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const key in entriesByDay) counts[key] = entriesByDay[key].length;
    return counts;
  }, [entriesByDay]);

  const stats = useMemo(() => {
    const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    const thisMonthCount = Object.keys(entryCountByDay)
      .filter((k) => k.startsWith(monthPrefix))
      .reduce((sum, k) => sum + entryCountByDay[k], 0);

    // Current streak: consecutive days up to today with at least one entry.
    let streak = 0;
    const cursor = new Date();
    while (entryCountByDay[formatLocalDayKey(cursor)] > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return { total: entries.length, thisMonth: thisMonthCount, streak };
  }, [entries.length, entryCountByDay, viewYear, viewMonth]);

  const selectedEntries = entriesByDay[selectedDayKey] ?? [];
  const isSelectedToday = selectedDayKey === todayKey();

  function goToMonth(delta: number) {
    let y = viewYear;
    let m = viewMonth + delta;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  function goToToday() {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelectedDayKey(todayKey());
  }

  function openCreateModal() {
    setModalMode('create');
    setEditingEntry(null);
    setModalOpen(true);
  }

  function openEditModal(entry: JournalEntry) {
    setModalMode('edit');
    setEditingEntry(entry);
    setModalOpen(true);
  }

  async function handleSave(payload: { content: string; mood: Mood }) {
    setSaving(true);
    try {
      if (modalMode === 'create') {
        const created = await journalApi.createEntry(payload);
        setEntries((prev) => [created, ...prev]);
        // Backend always stamps "now" as createdAt, so jump the view to today.
        setSelectedDayKey(toDayKey(created.createdAt));
        showToast('Entry saved.', 'success');
      } else if (editingEntry) {
        const updated = await journalApi.updateEntry(editingEntry.id, payload);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        showToast('Entry updated.', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await journalApi.deleteEntry(deleteTarget.id);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      showToast('Entry deleted.', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(entry: JournalEntry) {
    setDownloadingId(entry.id);
    try {
      await journalApi.downloadEntryPdf(entry.id, toDayKey(entry.createdAt));
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-8">
        {prompt && (
          <button
            onClick={openCreateModal}
            className="mb-6 flex w-full items-start gap-3 rounded-xl border border-moss-400/30 bg-moss-50 dark:bg-moss-900/30 px-4 py-3 text-left transition-colors hover:border-moss-400/60"
          >
            <span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-wider text-moss-600 dark:text-moss-400">
              {prompt.personalized ? "Today's prompt" : 'Prompt'}
            </span>
            <span className="text-sm text-ink-soft dark:text-mist-soft">{prompt.prompt}</span>
          </button>
        )}

        {/* Stats strip */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard label="Total entries" value={stats.total} />
          <StatCard label="This month" value={stats.thisMonth} />
          <StatCard label="Day streak" value={stats.streak} accent />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
          <Calendar
            year={viewYear}
            monthIndex={viewMonth}
            entryCountByDay={entryCountByDay}
            selectedDayKey={selectedDayKey}
            onSelectDay={setSelectedDayKey}
            onPrevMonth={() => goToMonth(-1)}
            onNextMonth={() => goToMonth(1)}
            onToday={goToToday}
          />

          {loading ? (
            <div className="rounded-2xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised p-10 text-center shadow-soft dark:shadow-soft-dark">
              <p className="text-sm text-ink-faint dark:text-mist-soft/70">Loading your entries…</p>
            </div>
          ) : (
            <DayPanel
              dayKey={selectedDayKey}
              entries={selectedEntries}
              isToday={isSelectedToday}
              downloadingId={downloadingId}
              onCreate={openCreateModal}
              onEdit={openEditModal}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
            />
          )}
        </div>
      </main>

      <EntryModal
        open={modalOpen}
        mode={modalMode}
        initialEntry={editingEntry}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this entry?"
        description={
          deleteTarget
            ? `Your ${moodMeta(deleteTarget.mood).label.toLowerCase()} entry from ${toDayKey(deleteTarget.createdAt)} will be permanently removed. This can't be undone.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised px-4 py-3 shadow-soft dark:shadow-soft-dark">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint dark:text-mist-soft/60">{label}</p>
      <p className={`mt-0.5 font-display text-2xl ${accent ? 'text-moss-600 dark:text-moss-400' : 'text-ink dark:text-mist'}`}>
        {value}
      </p>
    </div>
  );
}
