/**
 * TimerContext — État global du timer de repos
 * Phase 6: DynamicIslandPill
 *
 * Survit à la navigation entre écrans (placé au root layout).
 * startedAt persisté en MMKV synchrone → résiste aux crashes.
 *
 * Usage :
 *   const { isActive, startTimer, stopTimer } = useTimer();
 *   startTimer({ duration: 90, exerciseName: 'Bench Press', nextSet: '100kg × 8' });
 */

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createStorageInstance } from '@/lib/storageAdapter';
import { useHaptics } from '@/hooks/useHaptics';

// ─── MMKV — instance dédiée au timer ─────────────────────────────────────────

const storage = createStorageInstance('iron-timer');
const TIMER_KEY = 'active_timer';

interface PersistedTimer {
  duration: number;
  startedAt: number;
  exerciseName: string;
  nextSet: string;
}

function mmkvSave(data: PersistedTimer) {
  storage.set(TIMER_KEY, JSON.stringify(data));
}
function mmkvClear() {
  storage.remove(TIMER_KEY);
}
function mmkvLoad(): TimerState | null {
  try {
    const raw = storage.getString(TIMER_KEY);
    if (!raw) return null;
    const d: PersistedTimer = JSON.parse(raw);
    return {
      isActive: true,
      duration: d.duration,
      startedAt: d.startedAt,
      exerciseName: d.exerciseName,
      nextSet: d.nextSet,
    };
  } catch {
    return null;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimerState {
  isActive: boolean;
  /** Durée totale de repos en secondes */
  duration: number;
  /** Timestamp Unix (ms) du démarrage — base du recalcul anti-crash */
  startedAt: number | null;
  exerciseName: string;
  /** Ex: "100kg × 8" */
  nextSet: string;
}

interface TimerContextValue extends TimerState {
  startTimer: (params: {
    duration: number;
    exerciseName?: string;
    nextSet?: string;
  }) => void;
  stopTimer: () => void;
}

// ─── État vide ────────────────────────────────────────────────────────────────

const INACTIVE: TimerState = {
  isActive: false,
  duration: 0,
  startedAt: null,
  exerciseName: '',
  nextSet: '',
};

// ─── Context ──────────────────────────────────────────────────────────────────

const TimerContext = createContext<TimerContextValue>({
  ...INACTIVE,
  startTimer: () => { },
  stopTimer: () => { },
});

export function useTimer(): TimerContextValue {
  return useContext(TimerContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TimerProvider({ children }: { children: ReactNode }) {
  // Restaure depuis MMKV au démarrage — crash recovery
  const [state, setState] = useState<TimerState>(() => mmkvLoad() ?? INACTIVE);
  const haptics = useHaptics();

  // Ref pour que l'AppState listener lise toujours la valeur actuelle
  // sans se re-abonner à chaque changement d'état
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const notifIdRef = useRef<string | null>(null);

  // ─── Handler de notification (foreground) ──────────────────────────────────
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  // ─── Notifications helpers ─────────────────────────────────────────────────

  const cancelScheduledNotification = async () => {
    if (!notifIdRef.current) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
    } catch { }
    notifIdRef.current = null;
  };

  const scheduleRestEndNotification = async (
    remainingSeconds: number,
    nextSet: string,
  ) => {
    if (remainingSeconds <= 5) return; // Trop court pour notifier
    await cancelScheduledNotification();
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted =
        status === 'granted' ||
        (await Notifications.requestPermissionsAsync()).status === 'granted';
      if (!granted) return;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Repos terminé 💪',
          body: nextSet ? `Prochaine série : ${nextSet}` : 'Go !',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.ceil(remainingSeconds),
          repeats: false,
        },
      });
      notifIdRef.current = id;
    } catch {
      // Notifications non critiques — silencieux
    }
  };

  // ─── AppState — background/foreground ─────────────────────────────────────
  // Inscrit une seule fois. Lit stateRef pour avoir la valeur fraîche.

  useEffect(() => {
    const handler = (next: AppStateStatus) => {
      const s = stateRef.current;
      if (!s.isActive || !s.startedAt) return;

      if (next === 'background' || next === 'inactive') {
        const elapsed = Math.floor((Date.now() - s.startedAt) / 1000);
        const remaining = s.duration - elapsed;
        scheduleRestEndNotification(remaining, s.nextSet);
      } else if (next === 'active') {
        cancelScheduledNotification();
      }
    };

    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []); // Intentionnellement vide — stateRef est toujours à jour

  // ─── startTimer ────────────────────────────────────────────────────────────

  const startTimer = ({
    duration,
    exerciseName = '',
    nextSet = '',
  }: {
    duration: number;
    exerciseName?: string;
    nextSet?: string;
  }) => {
    // Timer déjà actif → remplacement avec haptique Medium
    if (stateRef.current.isActive) {
      haptics.medium();
    }

    const startedAt = Date.now();

    // Persistance synchrone MMKV — survit à un crash immédiat
    mmkvSave({ duration, startedAt, exerciseName, nextSet });

    setState({ isActive: true, duration, startedAt, exerciseName, nextSet });
  };

  // ─── stopTimer ─────────────────────────────────────────────────────────────

  const stopTimer = () => {
    mmkvClear();
    cancelScheduledNotification();
    setState(INACTIVE);
  };

  return (
    <TimerContext.Provider value={{ ...state, startTimer, stopTimer }}>
      {children}
    </TimerContext.Provider>
  );
}
