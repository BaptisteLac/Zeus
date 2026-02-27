export interface Exercise {
  id: string;
  name: string;
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  charge: number; // kg — charge initiale suggérée
  rest: number; // seconds
  rir: string; // "1" or "1-2"
}

export interface WorkoutEntry {
  date: string;
  charge: number;
  sets: number[]; // reps per set
  totalReps: number;
  rir: number;
}

export type SessionType = 'A' | 'B' | 'C';

export interface AppState {
  currentSession: SessionType;
  currentBlock: 1 | 2 | 3;
  weekNumber: number;
  programStartDate: string;
  workoutData: Record<string, WorkoutEntry[]>;
  customExercises?: Record<SessionType, Exercise[]>;
  currentSessionData?: {
    exerciseInputs: Record<string, ExerciseInput>;
    savedExercises: string[];
  };
}

export interface ProgressionResult {
  type: 'increase_charge' | 'increase_reps' | 'stagnation';
  nextCharge: number;
  targetTotalReps: number;
  message: string;
}

export interface ExerciseInput {
  charge: number;
  sets: number[];
  rir: number;
}
