import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState as RNAppState, AppStateStatus } from 'react-native';
import { AppState } from '@/lib/types';
import { saveState } from '@/lib/storage';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  isSessionValid,
  snapshotFromAppState,
  ActiveSessionSnapshot,
} from '@/services/sessionStorage';

const DEBOUNCE_MS = 400;

export interface UseAutoSaveReturn {
  saveImmediate: (state: AppState) => void;
  saveDebounced: (state: AppState) => void;
  flush: () => void;
  pendingSession: ActiveSessionSnapshot | null;
  dismissPending: () => void;
}

export function useAutoSave(): UseAutoSaveReturn {
  const [pendingSession, setPendingSession] =
    useState<ActiveSessionSnapshot | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingState = useRef<AppState | null>(null);

  const saveImmediate = useCallback((state: AppState) => {
    saveActiveSession(snapshotFromAppState(state));
    void saveState(state).catch(() => { });
  }, []);

  const flush = useCallback(() => {
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (pendingState.current !== null) {
      saveImmediate(pendingState.current);
      pendingState.current = null;
    }
  }, [saveImmediate]);

  const saveDebounced = useCallback(
    (state: AppState) => {
      pendingState.current = state;
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        if (pendingState.current !== null) {
          saveImmediate(pendingState.current);
          pendingState.current = null;
        }
      }, DEBOUNCE_MS);
    },
    [saveImmediate],
  );

  const dismissPending = useCallback(() => {
    clearActiveSession();
    setPendingSession(null);
  }, []);

  // flushRef ensures the AppState listener always calls the latest flush
  // without needing to re-subscribe on every render.
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    const snapshot = loadActiveSession();
    if (snapshot && isSessionValid(snapshot)) {
      setPendingSession(snapshot);
    }

    const subscription = RNAppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background' || nextState === 'inactive') {
          flushRef.current();
        }
      },
    );

    return () => {
      flushRef.current();
      subscription.remove();
    };
  }, []);

  return { saveImmediate, saveDebounced, flush, pendingSession, dismissPending };
}
