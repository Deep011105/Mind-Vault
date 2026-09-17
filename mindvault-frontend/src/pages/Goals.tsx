import { useState, useEffect } from 'react';
import { listActiveGoals, createGoal, deactivateGoal } from '../api/goals';
import type { Goal, GoalRequest, GoalPriority } from '../types/planning';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage } from '../api/client';

export default function Goals() {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newGoal, setNewGoal] = useState<GoalRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dailyTargetMinutes: 30,
  });

  const loadGoals = async () => {
    try {
      const data = await listActiveGoals();
      setGoals(data);
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;
    try {
      await createGoal(newGoal);
      setNewGoal({ title: '', description: '', priority: 'MEDIUM', dailyTargetMinutes: 30 });
      setIsCreating(false);
      loadGoals();
      showToast('Goal created.', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this goal?')) return;
    try {
      await deactivateGoal(id);
      loadGoals();
      showToast('Goal deactivated.', 'success');
    } catch (err) {
      showToast(extractErrorMessage(err), 'error');
    }
  };

  const priorityColors: Record<GoalPriority, string> = {
    HIGH: 'bg-moss-100 text-moss-800 dark:bg-moss-900/40 dark:text-moss-400',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
    LOW: 'bg-ink/10 text-ink-soft dark:bg-mist/10 dark:text-mist-soft',
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ink dark:text-mist">Your Goals</h1>
          <p className="mt-2 text-ink-soft dark:text-mist-soft">
            Set long-term goals. MindVault's AI will use these to optimize your daily plans.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="rounded-full bg-moss-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-moss-700"
        >
          + New Goal
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5 dark:bg-night-raised dark:ring-mist/5">
          <h2 className="mb-4 text-lg font-medium text-ink dark:text-mist">Create New Goal</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-soft dark:text-mist-soft">Title</label>
              <input
                autoFocus
                required
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full rounded-lg bg-ink/5 px-3 py-2 text-ink outline-none transition-colors focus:bg-ink/10 dark:bg-mist/5 dark:text-mist dark:focus:bg-mist/10"
                placeholder="E.g. Become a Backend Engineer"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-soft dark:text-mist-soft">Priority</label>
              <select
                value={newGoal.priority}
                onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as GoalPriority })}
                className="w-full rounded-lg bg-ink/5 px-3 py-2 text-ink outline-none transition-colors focus:bg-ink/10 dark:bg-mist/5 dark:text-mist dark:focus:bg-mist/10"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink-soft dark:text-mist-soft">Description (optional)</label>
              <input
                type="text"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full rounded-lg bg-ink/5 px-3 py-2 text-ink outline-none transition-colors focus:bg-ink/10 dark:bg-mist/5 dark:text-mist dark:focus:bg-mist/10"
                placeholder="What exactly are you trying to achieve?"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-soft dark:text-mist-soft">Daily Target (minutes)</label>
              <input
                type="number"
                min="0"
                value={newGoal.dailyTargetMinutes || ''}
                onChange={(e) => setNewGoal({ ...newGoal, dailyTargetMinutes: parseInt(e.target.value) || 0 })}
                className="w-full rounded-lg bg-ink/5 px-3 py-2 text-ink outline-none transition-colors focus:bg-ink/10 dark:bg-mist/5 dark:text-mist dark:focus:bg-mist/10"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/5 dark:text-mist-soft dark:hover:bg-mist/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-moss-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-moss-700"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center text-ink-soft dark:text-mist-soft">Loading goals...</div>
      ) : goals.length === 0 && !isCreating ? (
        <div className="rounded-2xl border border-dashed border-ink/20 p-12 text-center dark:border-mist/20">
          <p className="text-ink-soft dark:text-mist-soft">No active goals yet. Create one to help the AI plan your days.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <div key={goal.id} className="relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5 dark:bg-night-raised dark:ring-mist/5">
              <div>
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-display text-lg text-ink dark:text-mist">{goal.title}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[goal.priority]}`}>
                    {goal.priority}
                  </span>
                </div>
                {goal.description && <p className="mb-4 text-sm text-ink-soft dark:text-mist-soft">{goal.description}</p>}
                {goal.dailyTargetMinutes && (
                  <p className="text-sm font-medium text-moss-600 dark:text-moss-400">
                    🎯 Target: {goal.dailyTargetMinutes} mins / day
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeactivate(goal.id)}
                className="mt-6 self-start text-sm text-rust-500 transition-colors hover:text-rust-600 dark:text-rust-400 dark:hover:text-rust-300"
              >
                Mark as achieved / Deactivate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
