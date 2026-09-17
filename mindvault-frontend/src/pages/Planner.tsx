import { useState, useEffect } from 'react';
import { getTodaysPlan, generateNextPlan } from '../api/plans';
import { updateTaskStatus } from '../api/tasks';
import { submitEveningReflection } from '../api/reflection';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../api/client';
import type { DailyPlan, TaskStatus, ReflectionResponse } from '../types/planning';

export default function Planner() {
  const { showToast } = useToast();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionResponse, setReflectionResponse] = useState<ReflectionResponse | null>(null);
  const [reflecting, setReflecting] = useState(false);

  const loadPlan = async () => {
    try {
      const data = await getTodaysPlan();
      setPlan(data);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateNextPlan();
      // Backend targets "today" if nothing exists yet, otherwise "tomorrow" —
      // reload so a first-time plan shows up immediately instead of requiring
      // a manual refresh (this was previously missing entirely).
      await loadPlan();
      showToast('Plan generated.', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, reason?: string) => {
    try {
      await updateTaskStatus(taskId, { status: newStatus, reasonSkipped: reason });
      await loadPlan();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    setReflecting(true);
    try {
      const res = await submitEveningReflection({ reflectionText });
      setReflectionResponse(res);
      setReflectionText('');
      await loadPlan();
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setReflecting(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-ink-soft dark:text-mist-soft">Loading your plan...</div>;
  }

  const completionPercent = plan?.completionPercent || 0;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ink dark:text-mist">Daily Planner</h1>
          <p className="mt-2 text-ink-soft dark:text-mist-soft">
            Your AI-optimized tasks for today based on your goals.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-full bg-moss-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-moss-700 disabled:opacity-50"
        >
          {generating ? 'Generating...' : plan ? "Generate Next Plan" : 'Generate Plan'}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Tasks */}
        <div className="lg:col-span-2">
          {!plan ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-ink/5 dark:bg-night-raised dark:ring-mist/5">
              <p className="mb-4 text-ink-soft dark:text-mist-soft">No plan generated for today.</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="rounded-full bg-moss-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-moss-700 disabled:opacity-50"
              >
                Generate Plan Now
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5 dark:bg-night-raised dark:ring-mist/5">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-medium text-ink dark:text-mist">Today's Tasks</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-soft dark:text-mist-soft">Progress:</span>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-ink/10 dark:bg-mist/10">
                    <div
                      className="h-full bg-moss-500 transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-ink dark:text-mist">{completionPercent}%</span>
                </div>
              </div>

              {plan.planningNotes && (
                <div className="mb-6 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/10">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>AI Notes:</strong> {plan.planningNotes}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {plan.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between rounded-xl p-4 transition-colors ${
                      task.status === 'COMPLETED'
                        ? 'bg-moss-50/50 opacity-60 dark:bg-moss-900/10'
                        : task.status === 'SKIPPED'
                        ? 'bg-rust-50/50 opacity-60 dark:bg-rust-900/10'
                        : task.status === 'PARTIAL'
                        ? 'bg-amber-50/50 dark:bg-amber-900/10'
                        : 'bg-ink/5 hover:bg-ink/10 dark:bg-mist/5 dark:hover:bg-mist/10'
                    }`}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-ink-soft dark:text-mist-soft' : 'text-ink dark:text-mist'}`}>
                          {task.title}
                        </h3>
                        {task.isOptional && (
                          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-soft dark:bg-mist/10 dark:text-mist-soft">
                            Optional
                          </span>
                        )}
                        {task.status === 'PARTIAL' && (
                          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
                            Partial
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-ink-soft dark:text-mist-soft">
                        <span>⏱ {task.estimatedMinutes} min</span>
                        <span>Priority: {task.priority}</span>
                      </div>
                      {task.reasonSkipped && (
                        <p className="mt-2 text-xs italic text-rust-600 dark:text-rust-400">
                          Skipped: {task.reasonSkipped}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {task.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                          className="rounded-lg bg-moss-100 px-3 py-1.5 text-xs font-medium text-moss-700 transition-colors hover:bg-moss-200 dark:bg-moss-900/40 dark:text-moss-300 dark:hover:bg-moss-900/60"
                        >
                          Done
                        </button>
                      )}
                      {(task.status === 'PENDING' || task.status === 'STARTED') && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'PARTIAL')}
                          className="rounded-lg bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-400/20 dark:text-amber-300"
                        >
                          Partial
                        </button>
                      )}
                      {(task.status === 'PENDING' || task.status === 'STARTED') && (
                        <button
                          onClick={() => {
                            const reason = window.prompt('Reason for skipping?');
                            if (reason !== null) handleStatusChange(task.id, 'SKIPPED', reason);
                          }}
                          className="rounded-lg bg-ink/10 px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-ink/20 dark:bg-mist/10 dark:text-mist-soft dark:hover:bg-mist/20"
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Evening Reflection */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5 dark:bg-night-raised dark:ring-mist/5">
            <h2 className="mb-2 text-lg font-medium text-ink dark:text-mist">Evening Reflection</h2>
            <p className="mb-6 text-sm text-ink-soft dark:text-mist-soft">
              How did today go? The AI learns from your reflection to plan better tomorrow.
            </p>

            {reflectionResponse ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-moss-50 p-4 dark:bg-moss-900/10">
                  <p className="text-sm text-moss-800 dark:text-moss-200">{reflectionResponse.aiResponse}</p>
                </div>
                {reflectionResponse.keyLearning && (
                  <div className="rounded-xl bg-ink/5 p-4 dark:bg-mist/5">
                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-mist-soft">Key Learning</h4>
                    <p className="text-sm text-ink dark:text-mist">{reflectionResponse.keyLearning}</p>
                  </div>
                )}
                <button
                  onClick={() => setReflectionResponse(null)}
                  className="w-full rounded-lg bg-ink/5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/10 dark:bg-mist/5 dark:text-mist dark:hover:bg-mist/10"
                >
                  Write another reflection
                </button>
              </div>
            ) : (
              <form onSubmit={handleReflectionSubmit}>
                <textarea
                  required
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="I felt productive today but couldn't finish the optional task because..."
                  className="mb-4 min-h-[120px] w-full resize-none rounded-xl bg-ink/5 p-3 text-sm text-ink outline-none transition-colors focus:bg-ink/10 dark:bg-mist/5 dark:text-mist dark:focus:bg-mist/10"
                />
                <button
                  type="submit"
                  disabled={reflecting}
                  className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/90 disabled:opacity-50 dark:bg-mist dark:text-night dark:hover:bg-mist/90"
                >
                  {reflecting ? 'Reflecting...' : 'Submit Reflection'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
