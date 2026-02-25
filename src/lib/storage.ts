import AsyncStorage from '@react-native-async-storage/async-storage';
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

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const localState = raw ? JSON.parse(raw) as AppState : getDefaultState();

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return localState;
    }

    const { state: cloudState, timestamp: cloudTimestamp } = await syncFromCloud();

    if (!cloudState) {
      return localState;
    }

    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const localTimestamp = lastSync || new Date(0).toISOString();

    if (cloudTimestamp && cloudTimestamp > localTimestamp) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
      await AsyncStorage.setItem(LAST_SYNC_KEY, cloudTimestamp);
      return cloudState;
    }

    return localState;
  } catch (error) {
    console.error('Error loading state:', error);
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AppState : getDefaultState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const authenticated = await isAuthenticated();
  if (authenticated) {
    const result = await syncToCloud(state);
    if (result.success) {
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    }
  }
}

export async function resetState(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, LAST_SYNC_KEY]);
}

export function computeBlock(programStartDate: string): { block: 1 | 2 | 3; week: number } {
  const start = new Date(programStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const week = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  const block: 1 | 2 | 3 = week >= 17 ? 3 : week >= 9 ? 2 : 1;
  return { block, week };
}

export async function exportData(): Promise<string> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const state = raw ? JSON.parse(raw) : getDefaultState();
  return JSON.stringify(state, null, 2);
}

export async function importData(json: string): Promise<AppState> {
  const state = JSON.parse(json) as AppState;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}
