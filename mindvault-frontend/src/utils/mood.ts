import type { Mood } from '../types';

interface MoodMeta {
  label: string;
  emoji: string;
  // Tailwind color tokens from the existing design system (paper/ink/moss/amber/rust)
  textClass: string;
  bgClass: string;
}

export const MOOD_META: Record<Mood, MoodMeta> = {
  HAPPY: { label: 'Happy', emoji: '🙂', textClass: 'text-moss-600 dark:text-moss-400', bgClass: 'bg-moss-50 dark:bg-moss-900/40' },
  GRATEFUL: { label: 'Grateful', emoji: '🙏', textClass: 'text-moss-600 dark:text-moss-400', bgClass: 'bg-moss-50 dark:bg-moss-900/40' },
  CALM: { label: 'Calm', emoji: '😌', textClass: 'text-moss-500 dark:text-moss-400', bgClass: 'bg-moss-50 dark:bg-moss-900/40' },
  EXCITED: { label: 'Excited', emoji: '✨', textClass: 'text-amber-500 dark:text-amber-400', bgClass: 'bg-amber-400/10' },
  NEUTRAL: { label: 'Neutral', emoji: '😐', textClass: 'text-ink-soft dark:text-mist-soft', bgClass: 'bg-ink/5 dark:bg-mist/10' },
  TIRED: { label: 'Tired', emoji: '😴', textClass: 'text-ink-faint dark:text-mist-soft/70', bgClass: 'bg-ink/5 dark:bg-mist/10' },
  STRESSED: { label: 'Stressed', emoji: '😖', textClass: 'text-amber-500 dark:text-amber-400', bgClass: 'bg-amber-400/10' },
  ANXIOUS: { label: 'Anxious', emoji: '😟', textClass: 'text-amber-500 dark:text-amber-400', bgClass: 'bg-amber-400/10' },
  SAD: { label: 'Sad', emoji: '😔', textClass: 'text-rust-500 dark:text-rust-400', bgClass: 'bg-rust-400/10' },
  ANGRY: { label: 'Angry', emoji: '😠', textClass: 'text-rust-500 dark:text-rust-400', bgClass: 'bg-rust-400/10' },
};

export function moodMeta(mood: Mood): MoodMeta {
  return MOOD_META[mood] ?? MOOD_META.NEUTRAL;
}
