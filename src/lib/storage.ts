import { AppState } from './types';
import { syncFromCloud, syncToCloud, isAuthenticated } from './cloudStorage';

const STORAGE_KEY = 'workout-tracker-state';
const LAST_SYNC_KEY = 'workout-tracker-last-sync';

export function getDefaultState(): AppState {
  return {
    currentSession: 'A',
    currentBlock: 1,
    weekNumber: 1,
    programStartDate: new Date().toISOString().split('T')[0],
    workoutData: {},
  };
}

/**
 * Charge l'état depuis localStorage ET Supabase (si connecté)
 * Prend la version la plus récente
 */
export async function loadState(): Promise<AppState> {
  try {
    // 1. Charger depuis localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    const localState = raw ? JSON.parse(raw) as AppState : getDefaultState();

    // 2. Vérifier si connecté et sync depuis cloud
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return localState;
    }

    const { state: cloudState, timestamp: cloudTimestamp } = await syncFromCloud();

    // 3. Si pas de données cloud, retourner local
    if (!cloudState) {
      return localState;
    }

    // 4. Comparer timestamps pour prendre le plus récent
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    const localTimestamp = lastSync || new Date(0).toISOString();

    if (cloudTimestamp && cloudTimestamp > localTimestamp) {
      // Cloud plus récent → utiliser cloud et mettre à jour local
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
      localStorage.setItem(LAST_SYNC_KEY, cloudTimestamp);
      return cloudState;
    }

    return localState;
  } catch (error) {
    console.error('Error loading state:', error);
    // En cas d'erreur, fallback sur localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AppState : getDefaultState();
  }
}

/**
 * Sauvegarde l'état dans localStorage ET Supabase (si connecté)
 */
export async function saveState(state: AppState): Promise<void> {
  // 1. Toujours sauvegarder en local (rapide)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  // 2. Sync vers cloud si connecté (async, non-bloquant)
  const authenticated = await isAuthenticated();
  if (authenticated) {
    const result = await syncToCloud(state);
    if (result.success) {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    }
  }
}

export function resetState(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
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
  const raw = localStorage.getItem(STORAGE_KEY);
  const state = raw ? JSON.parse(raw) : getDefaultState();
  return JSON.stringify(state, null, 2);
}

export function importData(json: string): AppState {
  const state = JSON.parse(json) as AppState;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Sync vers cloud sera fait au prochain saveState()
  return state;
}
