export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'STARTED' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  priority: GoalPriority;
  deadline?: string;
  dailyTargetMinutes?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalRequest {
  title: string;
  description?: string;
  priority: GoalPriority;
  deadline?: string;
  dailyTargetMinutes?: number;
}

export interface DailyTask {
  id: string;
  title: string;
  priority: GoalPriority;
  estimatedMinutes?: number;
  status: TaskStatus;
  reasonSkipped?: string;
  isOptional: boolean;
  sortOrder: number;
  startedAt?: string;
  completedAt?: string;
}

export interface TaskStatusUpdateRequest {
  status: TaskStatus;
  reasonSkipped?: string;
}

export interface DailyPlan {
  id: string;
  planDate: string;
  generatedByAi: boolean;
  completionPercent?: number;
  overallMood?: string;
  aiReflection?: string;
  planningNotes?: string;
  tasks: DailyTask[];
}

export interface ReflectionRequest {
  reflectionText: string;
}

export interface ReflectionResponse {
  aiResponse: string;
  skippedReasonsExtracted: string[];
  keyLearning: string;
}

export interface AiInsight {
  id: string;
  type: string;
  description: string;
  confidence?: number;
  generatedAt: string;
}
