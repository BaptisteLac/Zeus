import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  resetState,
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

const nextSession: Record<SessionType, SessionType> = { A: "B", B: "C", C: "A" };

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<AppState>(getDefaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [savedExercises, setSavedExercises] = useState<Set<string>>(new Set());
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Load state
  useEffect(() => {
    loadState().then((loaded) => {
      if (!loaded.customExercises) {
        loaded = { ...loaded, customExercises: initCustomExercises() };
        saveState(loaded);
      }
      const { block, week } = computeBlock(loaded.programStartDate);
      setState({ ...loaded, currentBlock: block, weekNumber: week });
      setIsLoading(false);
    });
  }, []);

  // Auth
  useEffect(() => {
    getCurrentUser().then((user) => setUserEmail(user?.email));

    const { data: { subscription } } = onAuthStateChange((authenticated, email) => {
      setUserEmail(email);
      if (authenticated) {
        loadState().then((loaded) => {
          if (!loaded.customExercises) {
            loaded = { ...loaded, customExercises: initCustomExercises() };
          }
          setState(loaded);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const exercises = useMemo(
    () =>
      getExercisesForSession(
        state.currentSession,
        state.currentBlock,
        state.customExercises
      ),
    [state.currentSession, state.currentBlock, state.customExercises]
  );

  // Auto-expand first exercise
  useEffect(() => {
    if (exercises.length > 0 && expandedExerciseId === null) {
      setExpandedExerciseId(exercises[0].id);
    }
  }, [exercises]);

  // ---- Handlers ----

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
        (ex, i) =>
          i > currentIndex &&
          !savedExercises.has(ex.id) &&
          ex.id !== exerciseId
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
          oldHistory.length > 0
            ? [...oldHistory.slice(0, -1), entry]
            : [entry];
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
      const name = currentCustom[session]?.find((e) => e.id === exerciseId)?.name;
      const updatedCustom = {
        ...currentCustom,
        [session]: (currentCustom[session] || []).filter(
          (ex) => ex.id !== exerciseId
        ),
      };
      const updated = { ...prev, customExercises: updatedCustom };
      saveState(updated);
      setSavedExercises((prev) => {
        const next = new Set(prev);
        next.delete(exerciseId);
        return next;
      });
      return updated;
    });
  }, []);

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

    const doFinish = () => {
      setState((prev) => {
        const updated = {
          ...prev,
          currentSession: nextSession[prev.currentSession],
        };
        saveState(updated);
        return updated;
      });
      setSavedExercises(new Set());
      setExpandedExerciseId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    if (unsaved.length > 0) {
      Alert.alert(
        "Séance incomplète",
        `${unsaved.length} exercice(s) non sauvegardé(s). Terminer quand même ?`,
        [
          { text: "Annuler", style: "cancel" },
          { text: "Terminer", onPress: doFinish },
        ]
      );
      return;
    }
    doFinish();
  };

  const allSaved =
    exercises.length > 0 && exercises.every((ex) => savedExercises.has(ex.id));

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#C0694A" size="large" />
        <Text className="text-foreground-muted text-sm mt-3">Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"] as const}>
      {/* Sticky header */}
      <SessionHeader
        session={state.currentSession}
        block={state.currentBlock}
        week={state.weekNumber}
        completedCount={savedExercises.size}
        totalCount={exercises.length}
        onChangeSession={handleChangeSession}
        userEmail={userEmail}
        onAuthClick={() => {
          // TODO: auth modal
          Alert.alert("Compte", userEmail ? `Connecté : ${userEmail}` : "Non connecté");
        }}
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
            onStartTimer={() => {
              // TODO: timer overlay
            }}
            onEditDefinition={() => {
              // TODO: exercise form sheet
              Alert.alert("Modifier", exercise.name);
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

        {/* Add exercise button — TODO */}
        <Pressable
          className="border-2 border-dashed border-primary/20 rounded-xl py-4 items-center mt-2 active:border-primary/50"
          onPress={() => Alert.alert("Ajouter", "Formulaire d'ajout — à venir")}
        >
          <Text className="text-primary/50 text-2xl font-light">+</Text>
        </Pressable>
      </ScrollView>

      {/* Finish session button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 bg-gradient-to-t from-background"
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
  );
}
