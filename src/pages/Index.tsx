import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, ExerciseInput, SessionType } from '@/lib/types';
import { getExercisesForSession } from '@/lib/program';
import { loadState, saveState, resetState, computeBlock, exportData, importData } from '@/lib/storage';
import { calculateProgression } from '@/lib/progression';
import SessionHeader from '@/components/SessionHeader';
import ExerciseCard from '@/components/ExerciseCard';
import FloatingTimer from '@/components/FloatingTimer';
import { toast } from 'sonner';

const nextSession: Record<SessionType, SessionType> = { A: 'B', B: 'C', C: 'A' };

export default function Index() {
  const [state, setState] = useState<AppState>(loadState);
  const [savedExercises, setSavedExercises] = useState<Set<string>>(new Set());
  const [blockChanged, setBlockChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [globalTimer, setGlobalTimer] = useState<{
    exerciseName: string;
    remaining: number;
    total: number;
  } | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute block from date
  useEffect(() => {
    const { block, week } = computeBlock(state.programStartDate);
    if (block !== state.currentBlock || week !== state.weekNumber) {
      if (block !== state.currentBlock) setBlockChanged(true);
      setState((prev) => {
        const updated = { ...prev, currentBlock: block as 1 | 2 | 3, weekNumber: week };
        saveState(updated);
        return updated;
      });
    }
  }, [state.programStartDate, state.currentBlock, state.weekNumber]);

  // Global timer management
  useEffect(() => {
    if (!globalTimer || globalTimer.remaining <= 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setGlobalTimer((prev) => {
        if (!prev || prev.remaining <= 1) {
          // Timer finished - vibration + sound
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            osc.frequency.value = 880;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 300);
          } catch { }
          return prev ? { ...prev, remaining: 0 } : null;
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [globalTimer?.remaining]);

  // Dismiss block changed banner
  useEffect(() => {
    if (blockChanged) {
      const t = setTimeout(() => setBlockChanged(false), 5000);
      return () => clearTimeout(t);
    }
  }, [blockChanged]);

  const exercises = getExercisesForSession(state.currentSession, state.currentBlock);

  const handleStartTimer = useCallback((exerciseName: string, seconds: number) => {
    setGlobalTimer({
      exerciseName,
      remaining: seconds,
      total: seconds,
    });
  }, []);

  const handleSaveExercise = useCallback(
    (exerciseId: string, input: ExerciseInput) => {
      setState((prev) => {
        const key = exerciseId;
        const entry = {
          date: new Date().toISOString(),
          charge: input.charge,
          sets: input.sets,
          totalReps: input.sets.reduce((a, b) => a + b, 0),
          rir: input.rir,
        };
        const history = [...(prev.workoutData[key] || []), entry];
        const updated = {
          ...prev,
          workoutData: { ...prev.workoutData, [key]: history },
        };
        saveState(updated);

        // Show toast and check for progression
        const exercise = exercises.find(ex => ex.id === exerciseId);
        if (exercise) {
          toast.success(`${exercise.name} enregistré ✓`);

          // Check progression with new history
          const progression = calculateProgression(exercise, history);
          if (progression) {
            if (progression.type === 'increase_charge') {
              toast.success(`📈 Progression ! Prochaine fois : ${progression.nextCharge} kg`);
            } else if (progression.type === 'stagnation') {
              toast.warning(`⚠️ Stagnation sur ${exercise.name}`);
            }
          }
        }

        return updated;
      });
      setSavedExercises((prev) => new Set(prev).add(exerciseId));
    },
    [exercises]
  );

  const handleUpdateExercise = useCallback(
    (exerciseId: string, input: ExerciseInput) => {
      setState((prev) => {
        const key = exerciseId;
        const entry = {
          date: new Date().toISOString(),
          charge: input.charge,
          sets: input.sets,
          totalReps: input.sets.reduce((a, b) => a + b, 0),
          rir: input.rir,
        };
        const oldHistory = prev.workoutData[key] || [];
        // Replace the last entry instead of adding a new one
        const history = oldHistory.length > 0
          ? [...oldHistory.slice(0, -1), entry]
          : [entry];
        const updated = {
          ...prev,
          workoutData: { ...prev.workoutData, [key]: history },
        };
        saveState(updated);
        return updated;
      });
    },
    []
  );

  const handleFinishSession = () => {
    const unsaved = exercises.filter((ex) => !savedExercises.has(ex.id));
    if (unsaved.length > 0) {
      const ok = window.confirm(
        `${unsaved.length} exercice(s) non sauvegardé(s). Terminer quand même ?`
      );
      if (!ok) return;
    }

    setState((prev) => {
      const updated = { ...prev, currentSession: nextSession[prev.currentSession] };
      saveState(updated);
      return updated;
    });
    setSavedExercises(new Set());
  };

  const handleReset = () => {
    if (window.confirm('Réinitialiser le programme ? Toutes les données seront perdues.')) {
      resetState();
      setState(loadState());
      setSavedExercises(new Set());
    }
  };

  const handleChangeBlock = (block: 1 | 2 | 3) => {
    setState((prev) => {
      const updated = { ...prev, currentBlock: block };
      saveState(updated);
      return updated;
    });
  };

  const handleChangeSession = (session: SessionType) => {
    // Only show confirmation if user has already started the session (saved at least one exercise)
    if (savedExercises.size > 0) {
      const unsaved = exercises.filter((ex) => !savedExercises.has(ex.id));
      const ok = window.confirm(
        unsaved.length > 0
          ? `${unsaved.length} exercice(s) non sauvegardé(s). Changer de séance quand même ?`
          : `Changer de séance et réinitialiser la progression actuelle ?`
      );
      if (!ok) return;
    }

    setState((prev) => {
      const updated = { ...prev, currentSession: session };
      saveState(updated);
      return updated;
    });
    setSavedExercises(new Set());
    toast.success(`Séance ${session} sélectionnée`);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = importData(event.target?.result as string);
        setState(imported);
        setSavedExercises(new Set());
        alert('Données importées avec succès.');
      } catch {
        alert('Fichier invalide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const allSaved = exercises.every((ex) => savedExercises.has(ex.id));

  return (
    <div className="min-h-screen bg-background pb-32">
      {globalTimer && globalTimer.remaining > 0 && (
        <FloatingTimer
          remaining={globalTimer.remaining}
          onSkip={() => setGlobalTimer(null)}
        />
      )}
      <SessionHeader
        session={state.currentSession}
        block={state.currentBlock}
        week={state.weekNumber}
        blockChanged={blockChanged}
        onReset={handleReset}
        onChangeBlock={handleChangeBlock}
        onChangeSession={handleChangeSession}
        onExport={handleExport}
        onImport={handleImport}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mx-auto max-w-lg px-6 py-6 space-y-6">
        {exercises.map((exercise, i) => (
          <ExerciseCard
            key={exercise.id}
            index={i}
            exercise={exercise}
            history={state.workoutData[exercise.id] || []}
            onSave={(input) => handleSaveExercise(exercise.id, input)}
            onUpdate={(input) => handleUpdateExercise(exercise.id, input)}
            onStartTimer={(seconds) => handleStartTimer(exercise.name, seconds)}
            saved={savedExercises.has(exercise.id)}
          />
        ))}
      </div>

      {/* Floating finish button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleFinishSession}
            className={`w-full rounded-lg py-4 text-[13px] font-medium uppercase tracking-[0.08em] shadow-lifted transition-all duration-400 ease-smooth hover:-translate-y-0.5 ${allSaved
              ? 'bg-accent text-accent-foreground'
              : 'bg-primary text-primary-foreground'
              }`}
          >
            Terminer la séance {state.currentSession}
          </button>
        </div>
      </div>
    </div>
  );
}
