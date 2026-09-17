// Mirrors backend com.lifevault.entity.Mood
export type Mood =
  | 'HAPPY'
  | 'SAD'
  | 'ANGRY'
  | 'CALM'
  | 'EXCITED'
  | 'ANXIOUS'
  | 'STRESSED'
  | 'TIRED'
  | 'GRATEFUL'
  | 'NEUTRAL';

export const ALL_MOODS: Mood[] = [
  'HAPPY', 'GRATEFUL', 'CALM', 'EXCITED',
  'NEUTRAL', 'TIRED', 'STRESSED', 'ANXIOUS', 'SAD', 'ANGRY',
];

// Mirrors backend JournalResponse
export interface JournalEntry {
  id: string; // UUID
  content: string;
  mood: Mood;
  stress?: number;
  energy?: number;
  wordCount: number;
  createdAt: string; // ISO Instant, e.g. "2026-07-30T10:15:30.123456Z"
  updatedAt: string;
}

export interface CreateJournalRequest {
  content: string;
  mood: Mood;
  stress?: number;
  energy?: number;
}

export interface UpdateJournalRequest {
  content: string;
  mood: Mood;
  stress?: number;
  energy?: number;
}

// Mirrors backend ChatMessageResponse
export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  safetyIntercepted: boolean;
  createdAt: string;
}

// Mirrors backend MoodStatsResponse
export interface MoodStats {
  moodCounts: Partial<Record<Mood, number>>;
  mostFrequentMood: Mood | null;
  currentStreakDays: number;
  longestStreakDays: number;
  last30Days: { date: string; mood: Mood }[];
}

// Mirrors backend DailyPromptResponse
export interface DailyPrompt {
  prompt: string;
  personalized: boolean;
}
