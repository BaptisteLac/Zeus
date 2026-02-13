import { AppState } from './types';

const STORAGE_KEY = 'workout-tracker-state';

export function getDefaultState(): AppState {
  return {
    currentSession: 'A',
    currentBlock: 1,
    weekNumber: 1,
    programStartDate: new Date().toISOString().split('T')[0],
    workoutData: {},
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return JSON.parse(raw) as AppState;
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function computeBlock(programStartDate: string): { block: 1 | 2 | 3; week: number } {
  const start = new Date(programStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const week = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  const block: 1 | 2 | 3 = week >= 17 ? 3 : week >= 9 ? 2 : 1;
  return { block, week };
}

export function exportData(): string {
  const state = loadState();
  return JSON.stringify(state, null, 2);
}

export function importData(json: string): AppState {
  const state = JSON.parse(json) as AppState;
  saveState(state);
  return state;
}
