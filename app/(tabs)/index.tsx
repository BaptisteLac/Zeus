import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  loadState,
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

import { Colors } from "@/theme/colors";
import { useTimer } from "@/context/TimerContext";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useHaptics } from "@/hooks/useHaptics";
import { MilestoneToast } from "@/components/ui/MilestoneToast";

import SessionHeader from "@/components/SessionHeader";
import ExerciseCard from "@/components/ExerciseCard";
import ExerciseFormSheet from "@/components/ExerciseFormSheet";
import SessionSummary from "@/components/SessionSummary";
import AuthModal from "@/components/AuthModal";
import { SwipeableSerieRow } from "@/components/SwipeableSerieRow";

const nextSession: Record<SessionType, SessionType> = { A: "B", B: "C", C: "A" };

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<AppState>(getDefaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [savedExercises, setSavedExercises] = useState<Set<string>>(new Set());
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Exercise form sheet
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();

  // Session summary
  const [showSummary, setShowSummary] = useState(false);

  // End session confirmation sheet
  const [showEndSheet, setShowEndSheet] = useState(false);

  // Auth modal
  const [showAuth, setShowAuth] = useState(false);

  // Milestone — halfway toast
  const [showHalfway, setShowHalfway] = useState(false);
  // Ref pour éviter le toast parasite après crash recovery (ou double-déclenchement)
  const halfwayShownRef = useRef(false);

  // ── Global timer (Phase 6 — DynamicIslandPill dans _layout.tsx) ─────────────
  const { startTimer } = useTimer();

  // ── Auto-save (Phase 9) ──────────────────────────────────────────────────────
  const { saveImmediate, pendingSession, dismissPending } = useAutoSave();
  const haptics = useHaptics();

  // ── Load state ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadState().then((loaded) => {
      // Migration : si customExercises n'existe pas, on l'initialise
      if (!loaded.customExercises) {
        loaded = { ...loaded, customExercises: initCustomExercises() };
        saveImmediate(loaded);
      } else {
        // Migration v2 : ancien format avait `sets` au lieu de `setsMin/setsMax`
        const needsMigration = Object.values(loaded.customExercises)
          .flat()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .some((ex: any) => ex.sets !== undefined && ex.setsMin === undefined);
        if (needsMigration) {
          const migrated = { ...loaded.customExercises };
          for (const session of ['A', 'B', 'C'] as const) {
            migrated[session] = (loaded.customExercises[session] || []).map((ex: any) => ({
              ...ex,
              setsMin: ex.setsMin ?? ex.sets ?? 3,
              setsMax: ex.setsMax ?? ex.sets ?? 3,
              charge: ex.charge ?? 0,
            }));
          }
          loaded = { ...loaded, customExercises: migrated };
          saveImmediate(loaded);
        }
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
          if (!loaded.customExercises) {
            loaded = { ...loaded, customExercises: initCustomExercises() };
          } else {
            const needsMigration = Object.values(loaded.customExercises)
              .flat()
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .some((ex: any) => ex.sets !== undefined && ex.setsMin === undefined);
            if (needsMigration) {
              const migrated = { ...loaded.customExercises };
              for (const session of ['A', 'B', 'C'] as const) {
                migrated[session] = (loaded.customExercises[session] || []).map((ex: any) => ({
                  ...ex,
                  setsMin: ex.setsMin ?? ex.sets ?? 3,
                  setsMax: ex.setsMax ?? ex.sets ?? 3,
                  charge: ex.charge ?? 0,
                }));
              }
              loaded = { ...loaded, customExercises: migrated };
            }
          }
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

  // Pas d'auto-expand au chargement ni après modification de la liste.
  // L'auto-expand se fait uniquement après sauvegarde d'un exercice (handleSaveExercise).

  // ── Milestone : halfway detection ─────────────────────────────────────────────
  // halfwayShownRef empêche deux cas parasites :
  //   1. Double déclenchement si savedExercises.size repasse par halfway (peu probable
  //      mais possible si un exercice est supprimé puis re-sauvegardé).
  //   2. Toast incorrect après handleResumeSession — le restore peut setter
  //      savedExercises à exactement halfway exercices, ce qui déclencherait
  //      le toast alors que la séance était déjà à mi-chemin avant le crash.
  useEffect(() => {
    const halfway = Math.floor(exercises.length / 2);
    if (halfway > 0 && savedExercises.size === halfway && !halfwayShownRef.current) {
      halfwayShownRef.current = true;
      setShowHalfway(true);
    }
  }, [savedExercises.size, exercises.length]);

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
        // Maintenir currentSessionData.savedExercises pour le snapshot MMKV
        const prevSaved = prev.currentSessionData?.savedExercises ?? [];
        const updated = {
          ...prev,
          workoutData: { ...prev.workoutData, [exerciseId]: history },
          currentSessionData: {
            exerciseInputs: prev.currentSessionData?.exerciseInputs ?? {},
            savedExercises: prevSaved.includes(exerciseId)
              ? prevSaved
              : [...prevSaved, exerciseId],
          },
        };
        saveImmediate(updated);
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
    [exercises, savedExercises, saveImmediate]
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
        saveImmediate(updated);
        return updated;
      });
    },
    [saveImmediate]
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
      saveImmediate(updated);
      return updated;
    });
    setSavedExercises((prev) => {
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
    // Ferme la card si c'est elle qui était ouverte
    setExpandedExerciseId((prev) => (prev === exerciseId ? null : prev));
  }, [saveImmediate]);

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
        saveImmediate(updated);
        return updated;
      });
    },
    [saveImmediate]
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
        saveImmediate(updated);
        return updated;
      });
    },
    [saveImmediate]
  );

  const handleChangeSession = useCallback(
    (session: SessionType) => {
      const doChange = () => {
        halfwayShownRef.current = false; // nouvelle séance = droit au toast halfway
        setState((prev) => {
          const updated = {
            ...prev,
            currentSession: session,
            currentSessionData: undefined,
          };
          saveImmediate(updated);
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
    [savedExercises, saveImmediate]
  );

  const handleFinishSession = () => {
    setShowEndSheet(true);
  };

  const handleConfirmFinish = () => {
    halfwayShownRef.current = false; // nouvelle séance (A→B→C) = droit au toast halfway
    setShowSummary(false);
    setState((prev) => {
      const updated = {
        ...prev,
        currentSession: nextSession[prev.currentSession],
        currentSessionData: undefined,
      };
      saveImmediate(updated);
      return updated;
    });
    setSavedExercises(new Set());
    setExpandedExerciseId(null);
    dismissPending();
    haptics.success();
  };

  // ── Crash recovery ───────────────────────────────────────────────────────────

  const handleResumeSession = useCallback(() => {
    if (!pendingSession) return;
    // Marquer halfway comme "déjà montré" avant de restaurer savedExercises.
    // Sans ça, setSavedExercises déclenche l'effect halfway et affiche le toast
    // si le nombre restauré tombe exactement sur Math.floor(exercises.length / 2).
    halfwayShownRef.current = true;
    setState((prev) => ({
      ...prev,
      currentSession: pendingSession.sessionType,
      currentSessionData: {
        exerciseInputs: pendingSession.exerciseInputs,
        savedExercises: pendingSession.savedExercises,
      },
    }));
    setSavedExercises(new Set(pendingSession.savedExercises));
    dismissPending();
  }, [pendingSession, dismissPending]);

  const allSaved =
    exercises.length > 0 && exercises.every((ex) => savedExercises.has(ex.id));

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={Colors.emotional} size="large" />
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

        {/* Milestone — halfway toast (banner inline sous le header) */}
        {showHalfway && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <MilestoneToast
              type="halfway"
              visible
              onHide={() => setShowHalfway(false)}
            />
          </View>
        )}

        {/* Exercise list */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {exercises.length === 0 ? (
            /* ── Empty state ──────────────────────────────────────────────────── */
            <View className="flex-1 items-center justify-center py-16 gap-6">
              <View className="items-center gap-2">
                <Text className="text-4xl">💪</Text>
                <Text className="text-foreground text-base font-medium text-center">
                  Séance {state.currentSession} — aucun exercice
                </Text>
                <Text className="text-foreground-muted text-sm text-center px-8">
                  Ajoute des exercices pour démarrer ta séance.
                </Text>
              </View>
              <Pressable
                className="bg-primary rounded-xl px-8 py-4 items-center active:opacity-80"
                onPress={() => {
                  setEditingExercise(undefined);
                  setShowForm(true);
                }}
              >
                <Text className="text-white font-semibold text-[13px] uppercase tracking-wider">
                  + Ajouter un exercice
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {exercises.map((exercise) => (
                <SwipeableSerieRow
                  key={exercise.id}
                  onDelete={() => handleDeleteExercise(exercise.id)}
                >
                  <ExerciseCard
                    exercise={exercise}
                    history={state.workoutData[exercise.id] || []}
                    onSave={(input: ExerciseInput) => handleSaveExercise(exercise.id, input)}
                    onUpdate={(input: ExerciseInput) => handleUpdateExercise(exercise.id, input)}
                    onStartTimer={(seconds) =>
                      startTimer({ duration: seconds, exerciseName: exercise.name, nextSet: '' })
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
                </SwipeableSerieRow>
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
              {/* Bouton Terminer la séance — footer inline, toujours visible */}
              <Pressable
                onPress={handleFinishSession}
                disabled={savedExercises.size === 0}
                className={`rounded-2xl py-5 items-center justify-center mt-3 active:opacity-75 ${savedExercises.size === 0
                  ? 'bg-surface border border-border'
                  : allSaved
                    ? 'bg-emotional'
                    : 'bg-accent'
                  }`}
              >
                <Text
                  className={`text-[13px] font-bold uppercase tracking-widest ${savedExercises.size === 0 ? 'text-foreground-subtle' : 'text-white'
                    }`}
                >
                  {savedExercises.size === 0
                    ? 'Terminer la séance'
                    : allSaved
                      ? `✓  Terminer la séance ${state.currentSession}`
                      : `Terminer  ·  ${savedExercises.size}/${exercises.length} exercices`}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>

      </SafeAreaView>
      {/* End session confirmation sheet */}
      {showEndSheet && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setShowEndSheet(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
            onPress={() => setShowEndSheet(false)}
          >
            <Pressable
              onPress={() => { }}
              style={{
                backgroundColor: Colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: insets.bottom + 24,
                gap: 10,
              }}
            >
              {/* Titre + état */}
              <Text style={{ color: Colors.foreground, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                Terminer la séance {state.currentSession} ?
              </Text>

              {/* Liste exercices */}
              {exercises.map((ex) => (
                <View key={ex.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 16, width: 20 }}>
                    {savedExercises.has(ex.id) ? '✓' : '○'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: savedExercises.has(ex.id) ? Colors.foreground : Colors.foregroundSubtle,
                      fontWeight: savedExercises.has(ex.id) ? '500' : '400',
                      flex: 1,
                    }}
                  >
                    {ex.name}
                  </Text>
                  {!savedExercises.has(ex.id) && (
                    <Text style={{ fontSize: 11, color: Colors.error, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Non sauvegardé
                    </Text>
                  )}
                </View>
              ))}

              {/* Séparateur */}
              <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 8 }} />

              {/* CTA Terminer */}
              <Pressable
                onPress={() => {
                  setShowEndSheet(false);
                  setShowSummary(true);
                }}
                style={({ pressed }) => ({
                  backgroundColor: allSaved ? Colors.emotional : Colors.accent,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                  {allSaved ? '✓ Terminer' : 'Terminer quand même'}
                </Text>
              </Pressable>

              {/* CTA Continuer */}
              <Pressable
                onPress={() => setShowEndSheet(false)}
                style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: Colors.foregroundMuted, fontWeight: '500', fontSize: 15 }}>
                  Continuer la séance
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
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

      {/* ── Crash recovery — bottom sheet de reprise ─────────────────────────── */}
      {pendingSession && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={dismissPending}
        >
          {/* Backdrop — tap pour ignorer */}
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'flex-end',
            }}
            onPress={dismissPending}
          >
            {/* Sheet — absorbe les taps pour ne pas fermer au tap interne */}
            <Pressable
              onPress={() => { }}
              style={{
                backgroundColor: Colors.surface,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 24,
                paddingBottom: insets.bottom + 24,
                gap: 12,
              }}
            >
              <Text
                style={{ color: Colors.foreground, fontSize: 17, fontWeight: '600' }}
              >
                Séance en cours détectée
              </Text>
              <Text
                style={{ color: Colors.foregroundMuted, fontSize: 14, lineHeight: 20, marginBottom: 4 }}
              >
                Une séance {pendingSession.sessionType} a été interrompue.
                {pendingSession.savedExercises.length > 0
                  ? ` ${pendingSession.savedExercises.length} exercice(s) validé(s).`
                  : ' Aucun exercice validé.'}
              </Text>
              <Pressable
                onPress={handleResumeSession}
                style={{
                  backgroundColor: Colors.emotional,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
                  Reprendre la séance
                </Text>
              </Pressable>
              <Pressable
                onPress={dismissPending}
                style={{ borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: Colors.foregroundMuted, fontWeight: '500', fontSize: 15 }}>
                  Abandonner
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
