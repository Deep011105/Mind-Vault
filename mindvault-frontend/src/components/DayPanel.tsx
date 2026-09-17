import type { JournalEntry } from '../types';
import { formatFullDate, formatTime } from '../utils/date';
import { moodMeta } from '../utils/mood';

interface DayPanelProps {
  dayKey: string;
  entries: JournalEntry[];
  isToday: boolean;
  downloadingId: string | null;
  onCreate: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  onDownload: (entry: JournalEntry) => void;
}

export default function DayPanel({ dayKey, entries, isToday, downloadingId, onCreate, onEdit, onDelete, onDownload }: DayPanelProps) {
  return (
    <div className="rounded-2xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised shadow-soft dark:shadow-soft-dark">
      <div className="flex items-center justify-between border-b border-ink/10 dark:border-mist/10 px-6 py-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-moss-600 dark:text-moss-400">
            {isToday ? 'Today' : 'Entries'}
          </p>
          <h2 className="font-display text-xl text-ink dark:text-mist">{formatFullDate(dayKey)}</h2>
        </div>
        {isToday && (
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 rounded-lg bg-moss-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-moss-500 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New entry
          </button>
        )}
      </div>

      <div className="divide-y divide-ink/10 dark:divide-mist/10">
        {entries.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-ink-faint dark:text-mist-soft/70">
              {isToday ? "Nothing written yet — today's page is blank." : 'No entries were written on this day.'}
            </p>
            {isToday && (
              <button onClick={onCreate} className="mt-3 text-sm font-medium text-moss-600 dark:text-moss-400 hover:underline">
                Write the first one →
              </button>
            )}
          </div>
        )}

        {entries.map((entry) => {
          const meta = moodMeta(entry.mood);
          return (
            <article key={entry.id} className="group px-6 py-5 animate-ink-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-faint dark:text-mist-soft/60">
                      {formatTime(entry.createdAt)}
                    </span>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.bgClass} ${meta.textClass}`}>
                      <span>{meta.emoji}</span>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-ink-faint dark:text-mist-soft/50">
                      {entry.wordCount} {entry.wordCount === 1 ? 'word' : 'words'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    onClick={() => onDownload(entry)}
                    disabled={downloadingId === entry.id}
                    aria-label="Download as PDF"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/10 hover:text-moss-600 dark:hover:text-moss-400 transition-colors disabled:opacity-50"
                  >
                    {downloadingId === entry.id ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-9-9" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => onEdit(entry)}
                    aria-label="Edit entry"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/10 hover:text-moss-600 dark:hover:text-moss-400 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(entry)}
                    aria-label="Delete entry"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft dark:text-mist-soft hover:bg-rust-400/10 hover:text-rust-500 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
              {entry.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft dark:text-mist-soft">
                  {entry.content}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
