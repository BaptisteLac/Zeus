import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, Exercise, ExerciseInput, SessionType } from '@/lib/types';
import { getExercisesForSession, initCustomExercises, generateExerciseId, getAllExerciseCatalog } from '@/lib/program';
import { loadState, saveState, resetState, computeBlock, exportData, importData, getDefaultState } from '@/lib/storage';
import { getCurrentUser, onAuthStateChange } from '@/lib/cloudStorage';
import SessionHeader from '@/components/SessionHeader';

import ExerciseCard from '@/components/ExerciseCard';
import DynamicIslandTimer from '@/components/ui/DynamicIslandTimer';
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
  const [globalTimer, setGlobalTimer] = useState<{
    exerciseName: string;
    remaining: number;
    total: number;
  } | null>(null);
  // Timer interval removed in favor of DynamicIslandTimer internal logic


  // CRUD state
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollYRef = useRef(0);

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

  // Global timer management - Handled by DynamicIslandTimer now
  // We keep the state to know IF a timer is active, but the counting is inside the component


  // Dismiss block changed banner
  useEffect(() => {
    if (blockChanged) {
      const t = setTimeout(() => setBlockChanged(false), 5000);
      return () => clearTimeout(t);
    }
  }, [blockChanged]);

  // Hide header on scroll down, reveal on scroll up
  useEffect(() => {
    const SCROLL_THRESHOLD = 60;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < SCROLL_THRESHOLD) {
        setHeaderHidden(false);
      } else {
        setHeaderHidden(currentY > lastScrollYRef.current);
      }
      lastScrollYRef.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-mb-primary/20 border-t-mb-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-mb-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        userEmail={userEmail}
        onAuthChange={() => {
          getCurrentUser().then((user) => setUserEmail(user?.email));
        }}
      />

      {globalTimer && (
        <DynamicIslandTimer
          initialSeconds={globalTimer.total}
          isRunning={true}
          onDismiss={() => setGlobalTimer(null)}
          onComplete={() => {
            // Optional: Add sound effect here if needed, vibration is in the component
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              osc.frequency.value = 880;
              osc.connect(ctx.destination);
              osc.start();
              setTimeout(() => { osc.stop(); ctx.close(); }, 300);
            } catch { }
          }}
        />
      )}
      <SessionHeader
        session={state.currentSession}
        completedCount={savedExercises.size}
        totalCount={exercises.length}
        onChangeSession={handleChangeSession}
        hidden={headerHidden}
        userEmail={userEmail}
        onAuthClick={() => setShowAuthModal(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mx-auto max-w-lg px-6 pt-36 pb-6 space-y-6">
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
            onDelete={() => handleDeleteExercise(exercise.id)}
          />
        ))}

        {/* Add exercise button */}
        <button
          onClick={() => {
            setEditingExercise(undefined);
            setShowExerciseForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-mb-primary/20 hover:border-mb-primary/50 py-4 transition-all duration-300 group"
        >
          <span className="w-8 h-8 rounded-full bg-mb-primary/10 group-hover:bg-mb-primary/20 flex items-center justify-center transition-colors">
            <svg className="w-4 h-4 text-mb-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
              ? 'bg-gradient-to-r from-mb-secondary to-mb-primary text-white animate-pulse shadow-glow'
              : savedExercises.size === 0
                ? 'bg-mb-muted/20 text-mb-muted'
                : 'bg-mb-primary text-primary-foreground'
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
