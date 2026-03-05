import { createStorageInstance } from '@/lib/storageAdapter';
import { AppState, ExerciseInput, SessionType } from '@/lib/types';

const storage = createStorageInstance('iron-session');
const SESSION_KEY = 'active_session';

/** Maximum snapshot age: 24h */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface ActiveSessionSnapshot {
  sessionType: SessionType;
  exerciseInputs: Record<string, ExerciseInput>;
  savedExercises: string[];
  savedAt: number;
}

export function saveActiveSession(snapshot: ActiveSessionSnapshot): void {
  storage.set(SESSION_KEY, JSON.stringify(snapshot));
}

export function loadActiveSession(): ActiveSessionSnapshot | null {
  const raw = storage.getString(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveSessionSnapshot;
  } catch {
    storage.remove(SESSION_KEY);
    return null;
  }
}

export function clearActiveSession(): void {
  storage.remove(SESSION_KEY);
}

/** Returns false for snapshots older than 24h — treated as abandoned sessions, not crashes. */
export function isSessionValid(snapshot: ActiveSessionSnapshot): boolean {
  return Date.now() - snapshot.savedAt < MAX_AGE_MS;
}

export function snapshotFromAppState(state: AppState): ActiveSessionSnapshot {
  return {
    sessionType: state.currentSession,
    exerciseInputs: state.currentSessionData?.exerciseInputs ?? {},
    savedExercises: state.currentSessionData?.savedExercises ?? [],
    savedAt: Date.now(),
  };
}
