import { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { Exercise, WorkoutEntry, ExerciseInput } from "@/lib/types";
import { calculateProgression } from "@/lib/progression";
import { ChargeStepper } from "./ChargeStepper";
import { RIRSelector } from "./RIRSelector";
import { OptionsSheet } from "./OptionsSheet";
import { Colors } from "@/theme/colors";

// ─── SetCheckmark ────────────────────────────────────────────────────────────
// Mounts when a set transitions to "done" — triggers scale-in animation once.
function SetCheckmark() {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.3, { duration: 180 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.Text style={[animStyle, { fontSize: 10, color: Colors.emotional }]}>
      ✓
    </Animated.Text>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  history: WorkoutEntry[];
  onSave: (input: ExerciseInput) => void;
  onUpdate?: (input: ExerciseInput) => void;
  onStartTimer?: (seconds: number) => void;
  onEditDefinition?: () => void;
  onDelete?: () => void;
  saved: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function ExerciseCard({
  exercise,
  history,
  onSave,
  onUpdate,
  onStartTimer,
  onEditDefinition,
  onDelete,
  saved,
  isExpanded = false,
  onToggle,
}: ExerciseCardProps) {
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;

  const progression = useMemo(
    () => calculateProgression(exercise, history),
    [exercise, history]
  );

  const defaultCharge = progression
    ? progression.nextCharge
    : lastEntry
      ? lastEntry.charge
      : 0;

  const [charge, setCharge] = useState(defaultCharge);
  const [sets, setSets] = useState<number[]>(
    Array.from({ length: exercise.sets }, (_, i) =>
      lastEntry?.sets[i] !== undefined ? lastEntry.sets[i] : 0
    )
  );
  const [rir, setRir] = useState(lastEntry ? lastEntry.rir : 1);
  const [modified, setModified] = useState(false);
  const [savedValues, setSavedValues] = useState<ExerciseInput | null>(null);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Set<number>>(
    () => saved ? new Set(Array.from({ length: exercise.sets }, (_, i) => i)) : new Set()
  );
  const [showOptions, setShowOptions] = useState(false);

  // Expand/collapse animation
  const expandAnim = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    expandAnim.value = withTiming(isExpanded ? 1 : 0, { duration: 280 });
  }, [isExpanded]);

  // Resync sets when exercise definition changes
  useEffect(() => {
    setSets((prev) => {
      if (prev.length === exercise.sets) return prev;
      return Array.from({ length: exercise.sets }, (_, i) => prev[i] ?? 0);
    });
    setCompletedSets((prev) => {
      const next = new Set(prev);
      for (const idx of next) {
        if (idx >= exercise.sets) next.delete(idx);
      }
      return next;
    });
  }, [exercise.sets]);

  // Track modifications after save
  useEffect(() => {
    if (saved && savedValues) {
      const changed =
        charge !== savedValues.charge ||
        rir !== savedValues.rir ||
        sets.some((s, i) => s !== savedValues.sets[i]);
      setModified(changed);
    }
  }, [charge, sets, rir, saved, savedValues]);

  const totalReps = sets.reduce((a, b) => a + b, 0);
  const filledSetsCount = sets.filter((s) => s > 0).length;
  const allSetsFilled = filledSetsCount === exercise.sets;
  const canSave = charge > 0 && sets.some((s) => s > 0);

  const handleSetChange = (i: number, val: string) => {
    const n = Math.max(0, parseInt(val) || 0);
    setSets((prev) => {
      const next = [...prev];
      next[i] = n;
      return next;
    });
  };

  const findNextUncompletedSet = (afterIndex: number): number | null => {
    for (let i = afterIndex + 1; i < exercise.sets; i++) {
      if (!completedSets.has(i)) return i;
    }
    return null;
  };

  const handleValidateSet = (setIndex: number) => {
    setCompletedSets((prev) => {
      const next = new Set(prev);
      next.add(setIndex);
      return next;
    });
    const nextIdx = findNextUncompletedSet(setIndex);
    if (nextIdx !== null) setActiveSetIndex(nextIdx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartTimer?.(exercise.rest);
  };

  const handleMainAction = () => {
    if (!canSave) return;

    if (saved && modified) {
      const input = { charge, sets, rir };
      onUpdate?.(input);
      setSavedValues(input);
      setModified(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (allSetsFilled && completedSets.size === 0) {
      const input = { charge, sets, rir };
      onSave(input);
      setSavedValues(input);
      setCompletedSets(new Set(sets.map((_, i) => i)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const currentSetHasReps = sets[activeSetIndex] > 0;
    const isLastSet =
      completedSets.size === exercise.sets - 1 && currentSetHasReps;

    if (isLastSet || (allSetsFilled && completedSets.size > 0)) {
      handleValidateSet(activeSetIndex);
      const input = { charge, sets, rir };
      onSave(input);
      setSavedValues(input);
      setCompletedSets(new Set(sets.map((_, i) => i)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (currentSetHasReps) {
      handleValidateSet(activeSetIndex);
    }
  };

  const getButtonConfig = () => {
    if (saved && !modified) {
      return { label: "Enregistré ✓", variant: "emotional", disabled: false };
    }
    if (saved && modified) {
      return { label: "Modifier", variant: "accent", disabled: false };
    }
    if (!canSave) {
      return { label: "Enregistrer", variant: "disabled", disabled: true };
    }
    if (allSetsFilled && completedSets.size === 0) {
      return { label: "Enregistrer l'exercice", variant: "emotional", disabled: false };
    }
    const remaining = exercise.sets - completedSets.size;
    if (remaining === 1 && sets[activeSetIndex] > 0) {
      return { label: "Terminer l'exercice ✓", variant: "emotional", disabled: false };
    }
    if (sets[activeSetIndex] > 0) {
      return {
        label: `Valider S${activeSetIndex + 1} & Repos ⏱`,
        variant: "accent",
        disabled: false,
      };
    }
    return {
      label: `Remplir S${activeSetIndex + 1}`,
      variant: "disabled",
      disabled: true,
    };
  };

  const getChipState = (i: number): "active" | "done" | "pending" => {
    if (completedSets.has(i) && i !== activeSetIndex) return "done";
    if (i === activeSetIndex) return "active";
    return "pending";
  };

  const buttonConfig = getButtonConfig();

  // ─── PR Detection ───────────────────────────────────────────────────────────
  // "prior" = all entries except the most recent (which is the current session
  // after save). If history doesn't yet include the current save, all entries
  // are prior — either way charge > maxPriorCharge signals a new record.
  const priorEntries = history.slice(0, history.length > 0 ? -1 : 0);
  const maxPriorCharge =
    priorEntries.length > 0
      ? Math.max(...priorEntries.map((h) => h.charge))
      : 0;
  const isPR = saved && maxPriorCharge > 0 && charge > maxPriorCharge;

  // ─── PR Animations ──────────────────────────────────────────────────────────
  const prBadgeScale = useSharedValue(0);
  const prGlowOpacity = useSharedValue(0);

  const prBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: prBadgeScale.value }],
    opacity: prBadgeScale.value,
  }));
  const prGlowStyle = useAnimatedStyle(() => ({
    opacity: prGlowOpacity.value,
  }));

  useEffect(() => {
    if (isPR) {
      // Badge: scale 0 → 1.2 → 1 in 600ms total
      prBadgeScale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1, { duration: 300 }),
      );
      // Glow: fade in, hold 2.4s, fade out
      prGlowOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(2400, withTiming(0, { duration: 300 })),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isPR]);

  const confirmDelete = () => {
    Alert.alert(
      `Supprimer ${exercise.name} ?`,
      "L'exercice sera retiré de ta séance. L'historique de performances sera conservé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => onDelete?.(),
        },
      ]
    );
  };

  // Card border color — 4 états visuels (spec Phase 4)
  const cardBorderClass = isPR
    ? "border-achievement"         // PR détecté : bordure achievement
    : saved
    ? "border-border"              // Terminée : bordure neutre (glow assure la distinction)
    : isExpanded
    ? "border-accent/30"           // En cours : bordure accent
    : "border-border";             // À faire : bordure neutre

  // Status badge
  const statusLabel = saved ? "VALIDÉ" : isExpanded ? "EN COURS" : "EN ATTENTE";
  const statusClass = saved
    ? "bg-emotional/10 border-emotional/20"
    : isExpanded
      ? "bg-accent/10 border-accent/20"
      : "bg-surface border-border";
  const statusTextClass = saved
    ? "text-emotional"
    : isExpanded
      ? "text-accent"
      : "text-foreground-muted";

  return (
    <>
      <View
        className={`relative rounded-card border overflow-hidden bg-surface ${cardBorderClass}`}
      >
        {/* Terminée — glow emotional 8% (statique) */}
        {saved && !isPR && (
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-emotional/8"
          />
        )}
        {/* PR — glow achievement 6% (animé, disparaît après 3s) */}
        {isPR && (
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, prGlowStyle]}
            className="bg-achievement/6"
          />
        )}

        {/* Header — tap to toggle, long-press to edit */}
        <Pressable
          onPress={() => onToggle?.()}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onEditDefinition?.();
          }}
          delayLongPress={500}
          className="px-4 pt-4 pb-3"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text
                className={`text-base font-semibold uppercase tracking-wide leading-tight ${isExpanded ? "text-accent" : "text-foreground"
                  }`}
              >
                {exercise.name}
              </Text>
              {isExpanded && (
                <Text className="text-foreground-muted text-xs mt-1">
                  {exercise.repsMin}–{exercise.repsMax} reps · RIR {exercise.rir}
                </Text>
              )}
              {/* Badge PR — scale 0→1.2→1 en 600ms via reanimated */}
              {isPR && (
                <Animated.View
                  style={prBadgeStyle}
                  className="self-start mt-2 px-2.5 py-0.5 rounded-full bg-achievement/15 border border-achievement/40"
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.achievement }}>
                    🏆 PR — {charge} kg
                  </Text>
                </Animated.View>
              )}
            </View>

            <View className="flex-row items-center gap-2">
              {/* Options button (only expanded) */}
              {isExpanded && (
                <Pressable
                  onPress={() => setShowOptions(true)}
                  hitSlop={8}
                  className="w-8 h-8 items-center justify-center rounded-full active:bg-white/5"
                >
                  <Text className="text-foreground-muted text-lg leading-none">⋯</Text>
                </Pressable>
              )}

              {/* Chevron */}
              <Text
                className={`text-lg ${isExpanded ? "text-accent" : "text-foreground-subtle"
                  }`}
              >
                {isExpanded ? "⌃" : "⌄"}
              </Text>
            </View>
          </View>

          {/* Status + last entry row */}
          <View className="flex-row items-center justify-between mt-2">
            <View
              className={`px-2.5 py-0.5 rounded-full border ${statusClass}`}
            >
              <Text className={`text-[11px] font-semibold ${statusTextClass}`}>
                {statusLabel}
              </Text>
            </View>

            {!isExpanded && lastEntry && (
              <Text className="text-foreground-subtle text-xs font-mono">
                {lastEntry.charge} kg · {lastEntry.sets.join("-")}
              </Text>
            )}
          </View>

          {/* Collapsed summary */}
          {!isExpanded && !saved && (
            <View className="flex-row gap-2 mt-2">
              <View className="bg-surface/60 rounded-md px-2 py-0.5">
                <Text className="text-foreground-muted text-xs font-mono">
                  {exercise.sets} séries
                </Text>
              </View>
              <View className="bg-surface/60 rounded-md px-2 py-0.5">
                <Text className="text-foreground-muted text-xs font-mono">
                  {exercise.repsMin}-{exercise.repsMax} reps
                </Text>
              </View>
            </View>
          )}
        </Pressable>

        {/* Expanded content */}
        {isExpanded && (
          <View className="px-4 pb-4 gap-4">
            {/* 3 dernières séances */}
            {history.length > 0 && (
              <View className="gap-0.5">
                {history
                  .slice(-3)
                  .reverse()
                  .map((entry, idx) => (
                    <View key={idx} className="flex-row justify-end items-center gap-1.5">
                      <Text className="text-foreground-subtle text-[10px] font-mono">
                        {idx === 0 ? "S-1" : idx === 1 ? "S-2" : "S-3"}
                      </Text>
                      <Text className="text-foreground-muted text-xs font-mono">
                        {entry.charge} kg · {entry.sets.join("-")} · RIR {entry.rir}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Progression banner */}
            {progression && (
              <View className="flex-row items-start gap-3 bg-achievement/10 border-l-4 border-achievement px-4 py-3 rounded-r-xl">
                <Text className="text-lg">
                  {progression.type === "increase_charge"
                    ? "🏆"
                    : progression.type === "stagnation"
                      ? "⚡"
                      : "📈"}
                </Text>
                <View className="flex-1">
                  <Text className="text-achievement font-medium text-sm">
                    Objectif : {progression.nextCharge} kg
                  </Text>
                  <Text className="text-foreground-muted text-xs mt-0.5">
                    Battre {progression.targetTotalReps} reps au total
                  </Text>
                </View>
              </View>
            )}

            {/* Charge + RIR */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <ChargeStepper
                  value={charge}
                  onChange={setCharge}
                  step={2.5}
                />
              </View>
              <View className="flex-1">
                <RIRSelector value={rir} onChange={setRir} />
              </View>
            </View>

            {/* Set chips */}
            <View>
              <View className="flex-row items-baseline justify-between mb-3">
                <Text className="text-foreground-muted text-xs uppercase tracking-wider">
                  Séries
                </Text>
                <Text className="text-foreground-muted text-xs">
                  Total :{" "}
                  <Text className="text-accent font-mono">{totalReps}</Text>
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {sets.map((val, i) => {
                  const state = getChipState(i);
                  const chipBg =
                    state === "active"
                      ? "border-accent bg-surface"
                      : state === "done"
                        ? "border-emotional/40 bg-emotional/10"
                        : "border-transparent bg-surface";
                  const textColor =
                    state === "active"
                      ? "text-accent"
                      : state === "done"
                        ? "text-emotional"
                        : "text-foreground-muted";

                  return (
                    <View
                      key={i}
                      className="flex-col items-center gap-1.5"
                      style={{ minWidth: 64, flex: 1 }}
                    >
                      {state === "done" ? (
                        <SetCheckmark />
                      ) : (
                        <Text
                          className={`text-[10px] uppercase tracking-widest ${
                            state === "active"
                              ? "text-accent font-semibold"
                              : "text-foreground-muted"
                          }`}
                        >
                          {`S${i + 1}`}
                        </Text>
                      )}
                      <Pressable
                        className={`w-full rounded-xl border ${chipBg}`}
                        onPress={() => setActiveSetIndex(i)}
                      >
                        <TextInput
                          value={val > 0 ? String(val) : ""}
                          onChangeText={(t) => handleSetChange(i, t)}
                          onFocus={() => setActiveSetIndex(i)}
                          keyboardType="numeric"
                          placeholder="—"
                          placeholderTextColor="#6E6E68"
                          className={`text-center text-lg font-mono py-3 px-1 ${textColor}`}
                          style={{ minHeight: 48 }}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {/* Progress bar */}
              <View className="flex-row items-center gap-3 mt-4">
                <View className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
                  <View
                    className="h-full rounded-full bg-emotional"
                    style={{
                      width: `${(completedSets.size / exercise.sets) * 100}%`,
                    }}
                  />
                </View>
                <Text className="text-foreground-muted text-[11px] font-mono">
                  {completedSets.size}/{exercise.sets}
                </Text>
              </View>
            </View>

            {/* Main action button */}
            <Pressable
              onPress={handleMainAction}
              disabled={buttonConfig.disabled}
              className={`w-full rounded-full py-4 items-center mt-2 active:opacity-80 ${buttonConfig.variant === "emotional"
                ? "bg-emotional"
                : buttonConfig.variant === "accent"
                  ? "bg-accent"
                  : "bg-surface border border-border"
                }`}
            >
              <Text
                className={`font-semibold text-sm uppercase tracking-wider ${buttonConfig.variant === "disabled"
                  ? "text-foreground-muted"
                  : "text-white"
                  }`}
              >
                {buttonConfig.label}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Options bottom sheet */}
      <OptionsSheet
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        title={exercise.name}
        onEdit={() => onEditDefinition?.()}
        onDelete={onDelete ? confirmDelete : undefined}
      />
    </>
  );
}
