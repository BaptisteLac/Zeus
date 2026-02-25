import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import {
  loadState,
  saveState,
  computeBlock,
  getDefaultState,
} from "@/lib/storage";
import {
  getExercisesForSession,
  initCustomExercises,
  generateExerciseId,
  getAllExerciseCatalog,
} from "@/lib/program";
import { getCurrentUser, onAuthStateChange } from "@/lib/cloudStorage";
import { AppState, Exercise, ExerciseInput, SessionType } from "@/lib/types";

import SessionHeader from "@/components/SessionHeader";
import ExerciseCard from "@/components/ExerciseCard";
import RestTimer from "@/components/RestTimer";
import ExerciseFormSheet from "@/components/ExerciseFormSheet";
import SessionSummary from "@/components/SessionSummary";
import AuthModal from "@/components/AuthModal";

const nextSession: Record<SessionType, SessionType> = { A: "B", B: "C", C: "A" };

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<AppState>(getDefaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [savedExercises, setSavedExercises] = useState<Set<string>>(new Set());
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Timer overlay
  const [timer, setTimer] = useState<{ seconds: number; key: number } | null>(null);

  // Exercise form sheet
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();

  // Session summary
  const [showSummary, setShowSummary] = useState(false);

  // Auth modal
  const [showAuth, setShowAuth] = useState(false);

  // ── Load state ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadState().then((loaded) => {
      if (!loaded.customExercises) {
        loaded = { ...loaded, customExercises: initCustomExercises() };
        saveState(loaded);
      }
      const { block, week } = computeBlock(loaded.programStartDate);
      setState({ ...loaded, currentBlock: block as 1 | 2 | 3, weekNumber: week });
      setIsLoading(false);
    });
  }, []);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    getCurrentUser().then((user) => setUserEmail(user?.email));

    const {
      data: { subscription },
    } = onAuthStateChange((authenticated, email) => {
      setUserEmail(email);
      if (authenticated) {
        loadState().then((loaded) => {
          if (!loaded.customExercises)
            loaded = { ...loaded, customExercises: initCustomExercises() };
          setState(loaded);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Exercises for current session/block ──────────────────────────────────────
  const exercises = useMemo(
    () =>
      getExercisesForSession(
        state.currentSession,
        state.currentBlock,
        state.customExercises
      ),
    [state.currentSession, state.currentBlock, state.customExercises]
  );

  // Auto-expand first exercise when list changes
  useEffect(() => {
    if (exercises.length > 0 && expandedExerciseId === null) {
      setExpandedExerciseId(exercises[0].id);
    }
  }, [exercises]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSaveExercise = useCallback(
    (exerciseId: string, input: ExerciseInput) => {
      setState((prev) => {
        const entry = {
          date: new Date().toISOString(),
          charge: input.charge,
          sets: input.sets,
          totalReps: input.sets.reduce((a, b) => a + b, 0),
          rir: input.rir,
        };
        const history = [...(prev.workoutData[exerciseId] || []), entry];
        const updated = {
          ...prev,
          workoutData: { ...prev.workoutData, [exerciseId]: history },
        };
        saveState(updated);
        return updated;
      });

      setSavedExercises((prev) => new Set(prev).add(exerciseId));

      // Auto-expand next unsaved exercise
      const currentIndex = exercises.findIndex((ex) => ex.id === exerciseId);
      const nextUnsaved = exercises.find(
        (ex, i) => i > currentIndex && !savedExercises.has(ex.id) && ex.id !== exerciseId
      );
      if (nextUnsaved) setExpandedExerciseId(nextUnsaved.id);
    },
    [exercises, savedExercises]
  );

  const handleUpdateExercise = useCallback(
    (exerciseId: string, input: ExerciseInput) => {
      setState((prev) => {
        const entry = {
          date: new Date().toISOString(),
          charge: input.charge,
          sets: input.sets,
          totalReps: input.sets.reduce((a, b) => a + b, 0),
          rir: input.rir,
        };
        const oldHistory = prev.workoutData[exerciseId] || [];
        const history =
          oldHistory.length > 0 ? [...oldHistory.slice(0, -1), entry] : [entry];
        const updated = {
          ...prev,
          workoutData: { ...prev.workoutData, [exerciseId]: history },
        };
        saveState(updated);
        return updated;
      });
    },
    []
  );

  const handleDeleteExercise = useCallback((exerciseId: string) => {
    setState((prev) => {
      const session = prev.currentSession;
      const currentCustom = prev.customExercises ?? initCustomExercises();
      const updatedCustom = {
        ...currentCustom,
        [session]: (currentCustom[session] || []).filter((ex) => ex.id !== exerciseId),
      };
      const updated = { ...prev, customExercises: updatedCustom };
      saveState(updated);
      return updated;
    });
    setSavedExercises((prev) => {
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
  }, []);

  const handleAddExercise = useCallback(
    (exerciseData: Omit<Exercise, "id">) => {
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
        return updated;
      });
    },
    []
  );

  const handleEditExerciseDefinition = useCallback(
    (exerciseId: string, exerciseData: Omit<Exercise, "id">) => {
      setState((prev) => {
        const session = prev.currentSession;
        const currentCustom = prev.customExercises ?? initCustomExercises();
        const updatedCustom = {
          ...currentCustom,
          [session]: (currentCustom[session] || []).map((ex) =>
            ex.id === exerciseId ? { ...ex, ...exerciseData } : ex
          ),
        };
        const updated = { ...prev, customExercises: updatedCustom };
        saveState(updated);
        return updated;
      });
    },
    []
  );

  const handleChangeSession = useCallback(
    (session: SessionType) => {
      const doChange = () => {
        setState((prev) => {
          const updated = { ...prev, currentSession: session };
          saveState(updated);
          return updated;
        });
        setSavedExercises(new Set());
        setExpandedExerciseId(null);
      };

      if (savedExercises.size > 0) {
        Alert.alert(
          "Changer de séance ?",
          "Les exercices en cours seront réinitialisés.",
          [
            { text: "Annuler", style: "cancel" },
            { text: "Changer", onPress: doChange },
          ]
        );
        return;
      }
      doChange();
    },
    [savedExercises]
  );

  const handleFinishSession = () => {
    const unsaved = exercises.filter((ex) => !savedExercises.has(ex.id));

    if (unsaved.length > 0) {
      Alert.alert(
        "Séance incomplète",
        `${unsaved.length} exercice(s) non sauvegardé(s). Terminer quand même ?`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Terminer", onPress: () => setShowSummary(true) },
        ]
      );
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
    setTimer(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const allSaved =
    exercises.length > 0 && exercises.every((ex) => savedExercises.has(ex.id));

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#C0694A" size="large" />
        <Text className="text-foreground-muted text-sm mt-3">Chargement…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={["top"] as const}>
        {/* Sticky header */}
        <SessionHeader
          session={state.currentSession}
          block={state.currentBlock}
          week={state.weekNumber}
          completedCount={savedExercises.size}
          totalCount={exercises.length}
          onChangeSession={handleChangeSession}
          userEmail={userEmail}
          onAuthClick={() => setShowAuth(true)}
        />

        {/* Exercise list */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              history={state.workoutData[exercise.id] || []}
              onSave={(input: ExerciseInput) => handleSaveExercise(exercise.id, input)}
              onUpdate={(input: ExerciseInput) => handleUpdateExercise(exercise.id, input)}
              onStartTimer={(seconds) =>
                setTimer({ seconds, key: Date.now() })
              }
              onEditDefinition={() => {
                setEditingExercise(exercise);
                setShowForm(true);
              }}
              onDelete={() => handleDeleteExercise(exercise.id)}
              saved={savedExercises.has(exercise.id)}
              isExpanded={expandedExerciseId === exercise.id}
              onToggle={() =>
                setExpandedExerciseId(
                  expandedExerciseId === exercise.id ? null : exercise.id
                )
              }
            />
          ))}

          {/* Add exercise */}
          <Pressable
            className="border-2 border-dashed border-primary/20 rounded-xl py-4 items-center mt-2 active:border-primary/50"
            onPress={() => {
              setEditingExercise(undefined);
              setShowForm(true);
            }}
          >
            <Text className="text-primary/50 text-2xl font-light">+</Text>
          </Pressable>
        </ScrollView>

        {/* Finish session button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5"
          style={{ paddingBottom: insets.bottom + 12, paddingTop: 16 }}
        >
          <Pressable
            onPress={handleFinishSession}
            disabled={savedExercises.size === 0}
            className={`rounded-xl py-4 items-center ${
              allSaved
                ? "bg-success"
                : savedExercises.size > 0
                ? "bg-primary"
                : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`font-semibold text-[13px] uppercase tracking-wider ${
                savedExercises.size === 0 ? "text-foreground-muted" : "text-white"
              }`}
            >
              {allSaved
                ? `✓ Terminer la séance ${state.currentSession}`
                : `Terminer la séance ${state.currentSession} (${savedExercises.size}/${exercises.length})`}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Rest timer overlay — renders above everything */}
      {timer && (
        <RestTimer
          key={timer.key}
          initialSeconds={timer.seconds}
          onDismiss={() => setTimer(null)}
          onComplete={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }}
        />
      )}

      {/* Session summary */}
      <SessionSummary
        visible={showSummary}
        exercises={exercises}
        workoutData={state.workoutData}
        savedExercises={savedExercises}
        session={state.currentSession}
        onClose={handleConfirmFinish}
      />

      {/* Auth modal */}
      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        userEmail={userEmail}
        onAuthChange={() => {
          getCurrentUser().then((user) => setUserEmail(user?.email));
        }}
      />

      {/* Exercise form sheet */}
      <ExerciseFormSheet
        open={showForm}
        onOpenChange={setShowForm}
        exercise={editingExercise}
        catalog={getAllExerciseCatalog(state.customExercises)}
        onSubmit={(data) => {
          if (editingExercise) {
            handleEditExerciseDefinition(editingExercise.id, data);
          } else {
            handleAddExercise(data);
          }
        }}
        onDelete={
          editingExercise ? () => handleDeleteExercise(editingExercise.id) : undefined
        }
      />
    </View>
  );
}
