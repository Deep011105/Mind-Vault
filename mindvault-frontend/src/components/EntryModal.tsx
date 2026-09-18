import { useEffect, useState, type FormEvent } from 'react';
import type { JournalEntry, Mood } from '../types';
import { ALL_MOODS } from '../types';
import { moodMeta } from '../utils/mood';
import MicButton from './MicButton';

interface EntryModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialEntry?: JournalEntry | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: { content: string; mood: Mood; stress?: number; energy?: number }) => void;
}

export default function EntryModal({ open, mode, initialEntry, saving, onClose, onSave }: EntryModalProps) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('NEUTRAL');
  const [stress, setStress] = useState<number | undefined>(undefined);
  const [energy, setEnergy] = useState<number | undefined>(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setContent(initialEntry?.content ?? '');
      setMood(initialEntry?.mood ?? 'NEUTRAL');
      setStress(initialEntry?.stress ?? 3);
      setEnergy(initialEntry?.energy ?? 3);
      setError('');
    }
  }, [open, initialEntry]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Write something before saving — even a line is enough.');
      return;
    }
    onSave({ content: content.trim(), mood, stress, energy });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-paper dark:bg-night-raised border border-ink/10 dark:border-mist/10 shadow-soft dark:shadow-soft-dark animate-rise overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-ink/10 dark:border-mist/10 px-6 py-4">
          <h3 className="font-display text-lg text-ink dark:text-mist">
            {mode === 'create' ? 'New entry' : 'Edit entry'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint dark:text-mist-soft/60">
              How are you feeling?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_MOODS.map((m) => {
                const meta = moodMeta(m);
                const selected = mood === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${selected
                        ? 'border-moss-500 bg-moss-600 text-white'
                        : `border-ink/10 dark:border-mist/15 ${meta.textClass} hover:border-moss-400/50`
                      }`}
                  >
                    <span>{meta.emoji}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint dark:text-mist-soft/60">
                Stress (1-5)
              </p>
              <input
                type="range"
                min="1"
                max="5"
                value={stress || 3}
                onChange={(e) => setStress(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint dark:text-mist-soft/60">
                Energy (1-5)
              </p>
              <input
                type="range"
                min="1"
                max="5"
                value={energy || 3}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-1 h-px w-full bg-ink/10 dark:bg-mist/10" />

          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What happened today? What's on your mind?"
              rows={10}
              className="ruled-line w-full resize-none bg-transparent leading-[28px] text-ink dark:text-mist placeholder:text-ink-faint/50 dark:placeholder:text-mist-soft/40 focus:outline-none"
            />
            <MicButton value={content} onChange={setContent} className="mt-1" />
          </div>
          {error && <p className="text-sm text-rust-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-ink/10 dark:border-mist/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-moss-600 px-5 py-2 text-sm font-medium text-white hover:bg-moss-500 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Save entry' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}