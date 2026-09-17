import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../api/client';
import * as moodApi from '../api/mood';
import type { MoodStats, Mood } from '../types';
import { ALL_MOODS } from '../types';
import { moodMeta } from '../utils/mood';
import { getPlanningInsights } from '../api/insights';
import type { AiInsight } from '../types/planning';

export default function Insights() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [planningInsights, setPlanningInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moodApi
      .getMoodStats()
      .then(setStats)
      .catch((err) => showToast(extractErrorMessage(err), 'error'))
      .finally(() => setLoading(false));

    getPlanningInsights()
      .then(setPlanningInsights)
      .catch((err) => showToast(extractErrorMessage(err), 'error'));
  }, []);

  const maxCount = stats ? Math.max(1, ...Object.values(stats.moodCounts).map((v) => v ?? 0)) : 1;

  return (
    <div className="min-h-screen bg-paper dark:bg-night">
      <Navbar />

      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="font-display text-2xl text-ink dark:text-mist">Insights</h1>
        <p className="mt-1 text-sm text-ink-faint dark:text-mist-soft/70">
          Patterns across your journal, computed locally from your own entries.
        </p>

        {loading && (
          <div className="mt-8 rounded-2xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised p-10 text-center shadow-soft dark:shadow-soft-dark">
            <p className="text-sm text-ink-faint dark:text-mist-soft/70">Loading your insights…</p>
          </div>
        )}

        {!loading && (
          <section className="mt-8">
            <h2 className="font-display text-lg text-ink dark:text-mist">Planning Intelligence</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {planningInsights.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-ink/20 p-8 text-center dark:border-mist/20">
                  <p className="text-sm text-ink-soft dark:text-mist-soft">No AI planning insights generated yet. The AI needs a few days of planning data to find patterns.</p>
                </div>
              ) : (
                planningInsights.map((insight) => (
                  <div key={insight.id} className="rounded-xl border border-ink/10 bg-paper p-4 shadow-soft dark:border-mist/10 dark:bg-night-raised dark:shadow-soft-dark">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-moss-600 dark:text-moss-400">
                        {insight.type.replace(/_/g, ' ')}
                      </span>
                      {insight.confidence && (
                        <span className="text-xs text-ink-faint dark:text-mist-soft/60">
                          {insight.confidence}% confidence
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink dark:text-mist">{insight.description}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {!loading && stats && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard label="Current streak" value={`${stats.currentStreakDays}d`} accent />
              <StatCard label="Longest streak" value={`${stats.longestStreakDays}d`} />
              <StatCard
                label="Most frequent mood"
                value={stats.mostFrequentMood ? moodMeta(stats.mostFrequentMood).emoji : '—'}
              />
            </div>

            <section className="mt-8">
              <h2 className="font-display text-lg text-ink dark:text-mist">Mood breakdown</h2>
              <div className="mt-3 rounded-2xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised p-5 shadow-soft dark:shadow-soft-dark">
                <div className="space-y-2.5">
                  {ALL_MOODS.map((mood: Mood) => {
                    const count = stats.moodCounts[mood] ?? 0;
                    const meta = moodMeta(mood);
                    return (
                      <div key={mood} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-ink-soft dark:text-mist-soft">
                          {meta.emoji} {meta.label}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/5 dark:bg-mist/10">
                          <div
                            className="h-full rounded-full bg-moss-500 dark:bg-moss-400 transition-all"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right font-mono text-xs text-ink-faint dark:text-mist-soft/60">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="font-display text-lg text-ink dark:text-mist">Last 30 days</h2>
              <div className="mt-3 rounded-2xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised p-5 shadow-soft dark:shadow-soft-dark">
                {stats.last30Days.length === 0 ? (
                  <p className="text-sm text-ink-faint dark:text-mist-soft/70">No entries in the last 30 days yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {stats.last30Days.map((point, i) => {
                      const meta = moodMeta(point.mood);
                      return (
                        <div
                          key={`${point.date}-${i}`}
                          title={`${point.date} · ${meta.label}`}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${meta.bgClass}`}
                        >
                          {meta.emoji}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {!loading && !stats && (
          <div className="mt-8 rounded-2xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised p-10 text-center shadow-soft dark:shadow-soft-dark">
            <p className="text-sm text-ink-faint dark:text-mist-soft/70">
              Write a few entries and your mood insights will show up here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-ink/10 dark:border-mist/10 bg-paper dark:bg-night-raised px-4 py-3 shadow-soft dark:shadow-soft-dark">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint dark:text-mist-soft/60">{label}</p>
      <p className={`mt-0.5 font-display text-2xl ${accent ? 'text-moss-600 dark:text-moss-400' : 'text-ink dark:text-mist'}`}>
        {value}
      </p>
    </div>
  );
}
