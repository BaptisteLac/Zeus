import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, Exercise, ExerciseInput, SessionType } from '@/lib/types';
import { getExercisesForSession, initCustomExercises, generateExerciseId, getAllExerciseCatalog } from '@/lib/program';
import { loadState, saveState, resetState, computeBlock, exportData, importData, getDefaultState } from '@/lib/storage';
import { calculateProgression } from '@/lib/progression';
import { getCurrentUser, onAuthStateChange } from '@/lib/cloudStorage';
import SessionHeader from '@/components/SessionHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import ExerciseCard from '@/components/ExerciseCard';
import FloatingTimer from '@/components/FloatingTimer';
import SessionSummary from '@/components/SessionSummary';
import ExerciseFormSheet from '@/components/ExerciseFormSheet';
import { AuthModal } from '@/components/AuthModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fireConfetti } from '@/lib/confetti';

const nextSession: Record<SessionType, SessionType> = { A: 'B', B: 'C', C: 'A' };
const prevSession: Record<SessionType, SessionType> = { A: 'C', B: 'A', C: 'B' };

export default function Index() {
  const [state, setState] = useState<AppState>(getDefaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedExercises, setSavedExercises] = useState<Set<string>>(new Set());
  const [blockChanged, setBlockChanged] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [globalTimer, setGlobalTimer] = useState<{
    exerciseName: string;
    remaining: number;
    total: number;
  } | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // CRUD state
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);

  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
    confirmLabel?: string;
  }>({ isOpen: false, title: '', description: '', onConfirm: () => { } });

  // Load state from storage (async)
  useEffect(() => {
    loadState().then((loaded) => {
      // Initialize customExercises if not present
      if (!loaded.customExercises) {
        loaded = { ...loaded, customExercises: initCustomExercises() };
        saveState(loaded);
      }
      setState(loaded);
      setIsLoading(false);
    });
  }, []);

  // Check auth status
  useEffect(() => {
    getCurrentUser().then((user) => {
      setUserEmail(user?.email);
    });

    const { data: { subscription } } = onAuthStateChange((authenticated, email) => {
      setUserEmail(email);
      if (authenticated) {
        toast.success('Connecté au cloud');
        // Reload state from cloud
        loadState().then((loaded) => {
          if (!loaded.customExercises) {
            loaded = { ...loaded, customExercises: initCustomExercises() };
          }
          setState(loaded);
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Compute block from date
  useEffect(() => {
    if (isLoading) return;
    const { block, week } = computeBlock(state.programStartDate);
    if (block !== state.currentBlock || week !== state.weekNumber) {
      if (block !== state.currentBlock) setBlockChanged(true);
      setState((prev) => {
        const updated = { ...prev, currentBlock: block as 1 | 2 | 3, weekNumber: week };
        saveState(updated);
        return updated;
      });
    }
  }, [state.programStartDate, state.currentBlock, state.weekNumber, isLoading]);

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
          } catch {
            // ignore audio context errors
          }
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

  const exercises = useMemo(
    () => getExercisesForSession(state.currentSession, state.currentBlock, state.customExercises),
    [state.currentSession, state.currentBlock, state.customExercises]
  );

  // Auto-expand first exercise on session load
  useEffect(() => {
    if (exercises.length > 0 && expandedExerciseId === null) {
      setExpandedExerciseId(exercises[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises]);

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
          // Check progression with new history
          // Check progression with new history
          const progression = calculateProgression(exercise, history);
          if (progression) {
            if (progression.type === 'increase_charge') {
              toast.success(`📈 Progression ! Prochaine fois : ${progression.nextCharge} kg`);
            } else if (progression.type === 'stagnation') {
              toast.warning(`Stagnation sur ${exercise.name}`);
            }
          }
        }

        // Clear global timer if running
        setGlobalTimer(null);

        return updated;
      });
      setSavedExercises((prev) => new Set(prev).add(exerciseId));

      // Auto-expand next unsaved exercise
      const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
      const nextUnsaved = exercises.find((ex, i) => i > currentIndex && !savedExercises.has(ex.id) && ex.id !== exerciseId);
      if (nextUnsaved) {
        setExpandedExerciseId(nextUnsaved.id);
      }
    },
    [exercises, savedExercises]
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

  // ===== CRUD: Add Exercise =====
  const handleAddExercise = useCallback(
    (exerciseData: Omit<Exercise, 'id'>) => {
      setState((prev) => {
        const session = prev.currentSession;
        const currentCustom = prev.customExercises ?? initCustomExercises();
        const sessionExercises = currentCustom[session] || [];
        const newId = generateExerciseId(session, sessionExercises);
        const newExercise: Exercise = { id: newId, ...exerciseData };

        const updatedCustom = {
          ...currentCustom,
          [session]: [...sessionExercises, newExercise],
        };

        const updated = { ...prev, customExercises: updatedCustom };
        saveState(updated);
        toast.success(`${exerciseData.name} ajouté ✓`);
        return updated;
      });
    },
    []
  );

  // ===== CRUD: Delete Exercise =====
  const handleDeleteExercise = useCallback(
    (exerciseId: string) => {
      setState((prev) => {
        const session = prev.currentSession;
        const currentCustom = prev.customExercises ?? initCustomExercises();
        const sessionExercises = currentCustom[session] || [];
        const exerciseName = sessionExercises.find(ex => ex.id === exerciseId)?.name;

        const updatedCustom = {
          ...currentCustom,
          [session]: sessionExercises.filter((ex) => ex.id !== exerciseId),
        };

        const updated = { ...prev, customExercises: updatedCustom };
        saveState(updated);

        // Remove from saved exercises if present
        setSavedExercises((prevSaved) => {
          const next = new Set(prevSaved);
          next.delete(exerciseId);
          return next;
        });

        toast.success(`${exerciseName || 'Exercice'} supprimé`);
        return updated;
      });
    },
    []
  );

  // ===== CRUD: Edit Exercise Definition =====
  const handleEditExerciseDefinition = useCallback(
    (exerciseId: string, exerciseData: Omit<Exercise, 'id'>) => {
      setState((prev) => {
        const session = prev.currentSession;
        const currentCustom = prev.customExercises ?? initCustomExercises();
        const sessionExercises = currentCustom[session] || [];

        const updatedCustom = {
          ...currentCustom,
          [session]: sessionExercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, ...exerciseData } : ex
          ),
        };

        const updated = { ...prev, customExercises: updatedCustom };
        saveState(updated);
        toast.success(`${exerciseData.name} modifié ✓`);
        return updated;
      });
    },
    []
  );

  const handleFinishSession = () => {
    const unsaved = exercises.filter((ex) => !savedExercises.has(ex.id));
    if (unsaved.length > 0) {
      setAlertConfig({
        isOpen: true,
        title: "Séance incomplète",
        description: `${unsaved.length} exercice(s) non sauvegardé(s). Voulez-vous vraiment terminer la séance ?`,
        confirmLabel: "Terminer",
        onConfirm: () => setShowSummary(true)
      });
      return;
    }
    setShowSummary(true);
  };

  const handleConfirmFinish = () => {
    setShowSummary(false);
    setState((prev) => {
      const updated = { ...prev, currentSession: nextSession[prev.currentSession] };
      saveState(updated);
      return updated;
    });
    setSavedExercises(new Set());
    setExpandedExerciseId(null);
  };

  const handleReset = async () => {
    setAlertConfig({
      isOpen: true,
      title: "Réinitialiser le programme ?",
      description: "Toutes les données et l'historique seront définitivement perdus. Cette action est irréversible.",
      variant: 'destructive',
      confirmLabel: "Réinitialiser",
      onConfirm: async () => {
        resetState();
        const freshState = await loadState();
        setState(freshState);
        setSavedExercises(new Set());
      }
    });
  };

  const handleChangeBlock = (block: 1 | 2 | 3) => {
    setState((prev) => {
      const updated = { ...prev, currentBlock: block };
      saveState(updated);
      return updated;
    });
  };

  const handleChangeSession = useCallback((session: SessionType) => {
    const confirmChange = () => {
      setState((prev) => {
        const updated = { ...prev, currentSession: session };
        saveState(updated);
        return updated;
      });
      setSavedExercises(new Set());
      setExpandedExerciseId(null);
      toast.success(`Séance ${session} sélectionnée`);
    };

    // Only show confirmation if user has already started the session (saved at least one exercise)
    if (savedExercises.size > 0) {
      const unsaved = exercises.filter((ex) => !savedExercises.has(ex.id));
      const message = unsaved.length > 0
        ? `${unsaved.length} exercice(s) non sauvegardé(s). Changer de séance quand même ?`
        : `Changer de séance et réinitialiser la progression actuelle ?`;

      setAlertConfig({
        isOpen: true,
        title: "Changer de séance ?",
        description: message,
        onConfirm: confirmChange
      });
      return;
    }

    confirmChange();
  }, [savedExercises, exercises]);

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

  const allSaved = exercises.length > 0 && exercises.every((ex) => savedExercises.has(ex.id));
  const prevAllSaved = useRef(allSaved);

  useEffect(() => {
    if (allSaved && !prevAllSaved.current) {
      fireConfetti();
    }
    prevAllSaved.current = allSaved;
  }, [allSaved]);

  // Swipe gesture handlers for session navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Must be a horizontal swipe (dx > dy) with sufficient distance
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;

    const targetSession = dx < 0
      ? nextSession[state.currentSession]
      : prevSession[state.currentSession];
    handleChangeSession(targetSession);
  }, [state.currentSession, handleChangeSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-terracotta/20 border-t-terracotta rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="fixed top-6 right-6 z-40 flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => setShowAuthModal(true)}
          className="transition-all hover:scale-105"
          title={userEmail ? `Connecté: ${userEmail}` : 'Se connecter'}
        >
          {userEmail ? (
            // Avatar with first letter
            <div className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center font-bold text-sm shadow-lg">
              {userEmail.charAt(0).toUpperCase()}
            </div>
          ) : (
            // "Se Connecter" button
            <div className="px-4 py-2 bg-background border border-border rounded-full shadow-lg hover:shadow-xl transition-all">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-stone">Se Connecter</span>
            </div>
          )}
        </button>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        userEmail={userEmail}
        onAuthChange={() => {
          getCurrentUser().then((user) => setUserEmail(user?.email));
        }}
      />

      {globalTimer && globalTimer.remaining >= 0 && (
        <FloatingTimer
          remaining={globalTimer.remaining}
          total={globalTimer.total}
          onSkip={() => setGlobalTimer(null)}
          onAdjust={(delta) => setGlobalTimer(prev =>
            prev ? { ...prev, remaining: Math.max(0, prev.remaining + delta), total: Math.max(prev.total, prev.remaining + delta) } : null
          )}
          onClose={() => setGlobalTimer(null)}
        />
      )}
      <SessionHeader
        session={state.currentSession}
        block={state.currentBlock}
        week={state.weekNumber}
        blockChanged={blockChanged}
        completedCount={savedExercises.size}
        totalCount={exercises.length}
        onReset={handleReset}
        onChangeBlock={handleChangeBlock}
        onChangeSession={handleChangeSession}
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
            onEditDefinition={() => {
              setEditingExercise(exercise);
              setShowExerciseForm(true);
            }}
            saved={savedExercises.has(exercise.id)}
            isExpanded={expandedExerciseId === exercise.id}
            onToggle={() => setExpandedExerciseId(
              expandedExerciseId === exercise.id ? null : exercise.id
            )}
          />
        ))}

        {/* Add exercise button */}
        <button
          onClick={() => {
            setEditingExercise(undefined);
            setShowExerciseForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sand hover:border-terracotta/50 py-4 transition-all duration-300 group"
        >
          <span className="w-8 h-8 rounded-full bg-terracotta/10 group-hover:bg-terracotta/20 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
        </button>
      </div>

      {/* Exercise Form Sheet (Add / Edit) */}
      <ExerciseFormSheet
        open={showExerciseForm}
        onOpenChange={setShowExerciseForm}
        exercise={editingExercise}
        catalog={getAllExerciseCatalog(state.customExercises)}
        onSubmit={(data) => {
          if (editingExercise) {
            handleEditExerciseDefinition(editingExercise.id, data);
          } else {
            handleAddExercise(data);
          }
        }}
        onDelete={editingExercise ? () => handleDeleteExercise(editingExercise.id) : undefined}
      />

      {/* Floating finish button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="mx-auto max-w-lg">
          <button
            onClick={handleFinishSession}
            className={`w-full rounded-lg py-4 text-[13px] font-medium uppercase tracking-[0.08em] shadow-lifted transition-all duration-400 ease-smooth hover:-translate-y-0.5 ${allSaved
              ? 'bg-gradient-to-r from-sage to-terracotta text-white animate-pulse shadow-glow'
              : savedExercises.size === 0
                ? 'bg-stone/20 text-stone'
                : 'bg-primary text-primary-foreground'
              }`}
          >
            {allSaved
              ? `✓ Terminer la séance ${state.currentSession}`
              : `Terminer la séance ${state.currentSession} (${savedExercises.size}/${exercises.length})`
            }
          </button>
        </div>
      </div>

      {/* Session Summary Modal */}
      {showSummary && (
        <SessionSummary
          exercises={exercises}
          workoutData={state.workoutData}
          savedExercises={savedExercises}
          session={state.currentSession}
          onClose={handleConfirmFinish}
        />
      )}

      {/* Global Alert Dialog */}
      <AlertDialog open={alertConfig.isOpen} onOpenChange={(open) => !open && setAlertConfig(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={alertConfig.onConfirm}
              className={alertConfig.variant === 'destructive' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {alertConfig.confirmLabel || "Continuer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
