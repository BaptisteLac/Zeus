import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
} from "react-native-reanimated";
import { Exercise, WorkoutEntry, ExerciseInput } from "@/lib/types";
import { calculateProgression } from "@/lib/progression";
import { ChargeStepper } from "./ChargeStepper";
import { RIRSelector } from "./RIRSelector";
import { OptionsSheet } from "./OptionsSheet";
import { Colors } from "@/theme/colors";
import { useHaptics } from "@/hooks/useHaptics";
import { PRBadge, PRGlow } from "@/components/ui/PRBadge";
import { SwipeableSerieRow } from "@/components/SwipeableSerieRow";

// ─── SetCheckmark ────────────────────────────────────────────────────────────
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
    <Animated.Text style={[animStyle, { fontSize: 14, color: Colors.emotional }]}>
      ✓
    </Animated.Text>
  );
}

// ─── StatusDot ───────────────────────────────────────────────────────────────
// Petit indicateur coloré dans le header représentant l'état de la card
interface StatusDotProps {
  isPR: boolean;
  saved: boolean;
  isExpanded: boolean;
}

function StatusDot({ isPR, saved, isExpanded }: StatusDotProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isExpanded && !saved) {
      // Pulse doux en état actif
      pulse.value = withSequence(
        withTiming(1.4, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isExpanded, saved]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const color = isPR
    ? Colors.achievement
    : saved
      ? Colors.emotional
      : isExpanded
        ? Colors.accent
        : Colors.foregroundSubtle;

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
      ]}
    />
  );
}

// ─── AnimatedChevron ─────────────────────────────────────────────────────────
function AnimatedChevron({ isExpanded }: { isExpanded: boolean }) {
  const rotation = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 1 : 0, { duration: 250 });
  }, [isExpanded]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(rotation.value, [0, 1], [0, 180])}deg`,
      },
    ],
  }));

  return (
    <Animated.Text
      style={[
        animStyle,
        {
          fontSize: 12,
          color: isExpanded ? Colors.accent : Colors.foregroundSubtle,
          lineHeight: 16,
        },
      ]}
    >
      ▾
    </Animated.Text>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

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

// ─── SerieRow ────────────────────────────────────────────────────────────────
// Ligne horizontale remplaçant les chips carrées
interface SerieRowProps {
  index: number;
  value: number;
  state: "active" | "done" | "pending";
  onChangeText: (val: string) => void;
  onFocus: () => void;
  onValidate: () => void;
  onDelete: () => void;
  onUnvalidate: () => void;
}

function SerieRow({ index, value, state, onChangeText, onFocus, onValidate, onDelete, onUnvalidate }: SerieRowProps) {
  const labelColor =
    state === "active"
      ? Colors.accent
      : state === "done"
        ? Colors.emotional
        : Colors.foregroundSubtle;

  const inputColor =
    state === "active"
      ? Colors.foreground
      : state === "done"
        ? Colors.emotional
        : Colors.foregroundMuted;

  return (
    <SwipeableSerieRow
      onComplete={onValidate}
      onDelete={onDelete}
      disabled={false}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: state === "active" ? Colors.surfaceElevated : "transparent",
          borderRadius: 12,
          marginBottom: 2,
          paddingHorizontal: 12,
          paddingVertical: 2,
          borderWidth: 1,
          borderColor:
            state === "active"
              ? Colors.accent + "40"
              : state === "done"
                ? Colors.emotional + "25"
                : "transparent",
        }}
      >
        {/* Label S1 / S2 / S3 */}
        <View style={{ width: 36 }}>
          {state === "done" ? (
            <SetCheckmark />
          ) : (
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: labelColor,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {`S${index + 1}`}
            </Text>
          )}
        </View>

        {/* Input reps — largeur fixe, centré */}
        <View style={{ flex: 1 }}>
          <TextInput
            value={value > 0 ? String(value) : ""}
            onChangeText={onChangeText}
            onFocus={() => {
              if (state === "done") onUnvalidate();
              onFocus();
            }}
            keyboardType="numeric"
            placeholder="—"
            placeholderTextColor={Colors.foregroundSubtle}
            style={{
              textAlign: "center",
              fontSize: 22,
              fontWeight: "700",
              color: inputColor,
              fontVariant: ["tabular-nums"],
              paddingVertical: 14,
              paddingHorizontal: 8,
            }}
          />
        </View>

        {/* Hint swipe ou unité reps */}
        <View style={{ width: 48, alignItems: "flex-end" }}>
          {state === "done" ? (
            <Text style={{ fontSize: 11, color: Colors.success + "CC", fontWeight: "600" }}>
              {value} reps
            </Text>
          ) : state === "active" ? (
            <Text style={{ fontSize: 9, color: Colors.foregroundSubtle, letterSpacing: 0.3, textAlign: "right" }}>
              {"← valider"}
            </Text>
          ) : (
            <Text style={{ fontSize: 11, color: Colors.foregroundSubtle, fontWeight: "400" }}>
              reps
            </Text>
          )}
        </View>
      </View>
    </SwipeableSerieRow>
  );
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

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
  const haptics = useHaptics();

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

  // Button press scale animation
  const btnScale = useSharedValue(1);
  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

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
  const allSetsFilled = filledSetsCount === sets.length;
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
    for (let i = afterIndex + 1; i < sets.length; i++) {
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
    haptics.medium();
    onStartTimer?.(exercise.rest);
  };

  const handleDeleteSet = (setIndex: number) => {
    if (sets.length <= 1) return; // Garder au moins 1 série
    setSets((prev) => prev.filter((_, i) => i !== setIndex));
    setCompletedSets((prev) => {
      const next = new Set<number>();
      for (const idx of prev) {
        if (idx < setIndex) next.add(idx);
        else if (idx > setIndex) next.add(idx - 1);
      }
      return next;
    });
    setActiveSetIndex((prev) => Math.max(0, prev > setIndex ? prev - 1 : prev));
    haptics.light();
  };

  const handleUnvalidateSet = (setIndex: number) => {
    setCompletedSets((prev) => {
      const next = new Set(prev);
      next.delete(setIndex);
      return next;
    });
    setActiveSetIndex(setIndex);
    haptics.light();
  };

  const handleAddSet = () => {
    setSets((prev) => [...prev, 0]);
    setActiveSetIndex(sets.length); // Focus sur la nouvelle série
    haptics.light();
  };

  const handleMainAction = () => {
    if (!canSave) return;

    // Animate button
    btnScale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );

    if (saved && modified) {
      const input = { charge, sets, rir };
      onUpdate?.(input);
      setSavedValues(input);
      setModified(false);
      haptics.success();
      return;
    }

    if (allSetsFilled && completedSets.size === 0) {
      const input = { charge, sets, rir };
      onSave(input);
      setSavedValues(input);
      setCompletedSets(new Set(sets.map((_, i) => i)));
      haptics.success();
      return;
    }

    const currentSetHasReps = sets[activeSetIndex] > 0;
    const isLastSet =
      completedSets.size === sets.length - 1 && currentSetHasReps;

    if (isLastSet || (allSetsFilled && completedSets.size > 0)) {
      handleValidateSet(activeSetIndex);
      const input = { charge, sets, rir };
      onSave(input);
      setSavedValues(input);
      setCompletedSets(new Set(sets.map((_, i) => i)));
      haptics.success();
      return;
    }

    if (currentSetHasReps) {
      handleValidateSet(activeSetIndex);
    }
  };

  const getButtonConfig = () => {
    if (saved && !modified) {
      return { label: "Enregistré", icon: "✓", variant: "emotional", disabled: false };
    }
    if (saved && modified) {
      return { label: "Modifier", icon: "✎", variant: "accent", disabled: false };
    }
    if (!canSave) {
      return { label: "Enregistrer", icon: null, variant: "disabled", disabled: true };
    }
    if (allSetsFilled && completedSets.size === 0) {
      return { label: "Enregistrer l'exercice", icon: "✓", variant: "emotional", disabled: false };
    }
    const remaining = sets.length - completedSets.size;
    if (remaining === 1 && sets[activeSetIndex] > 0) {
      return { label: "Terminer l'exercice", icon: "✓", variant: "emotional", disabled: false };
    }
    if (sets[activeSetIndex] > 0) {
      return {
        label: `Valider S${activeSetIndex + 1} & repos`,
        icon: "⏱",
        variant: "accent",
        disabled: false,
      };
    }
    return {
      label: `Renseigner S${activeSetIndex + 1}`,
      icon: null,
      variant: "disabled",
      disabled: true,
    };
  };

  const getChipState = (i: number): "active" | "done" | "pending" => {
    if (completedSets.has(i)) return "done";
    if (i === activeSetIndex) return "active";
    return "pending";
  };

  const buttonConfig = getButtonConfig();

  // ─── PR Detection ─────────────────────────────────────────────────────────
  const priorEntries = history.slice(0, history.length > 0 ? -1 : 0);
  const maxPriorCharge =
    priorEntries.length > 0
      ? Math.max(...priorEntries.map((h) => h.charge))
      : 0;
  const isPR = saved && maxPriorCharge > 0 && charge > maxPriorCharge;

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

  // ─── Card border ──────────────────────────────────────────────────────────
  const cardBorderColor = isPR
    ? Colors.achievement + "60"
    : saved
      ? Colors.emotional + "30"
      : isExpanded
        ? Colors.accent + "35"
        : Colors.border;

  return (
    <>
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: cardBorderColor,
          backgroundColor: Colors.surface,
          overflow: "hidden",
        }}
      >
        {/* Saved glow */}
        {saved && !isPR && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: Colors.emotional + "0D",
            }}
          />
        )}
        <PRGlow visible={isPR} />

        {/* ── Header ──────────────────────────────────────────────────── */}
        <Pressable
          onPress={() => onToggle?.()}
          onLongPress={() => {
            haptics.heavy();
            onEditDefinition?.();
          }}
          delayLongPress={500}
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}
        >
          {/* Ligne 1 : Nom + Options + Chevron */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
              <StatusDot isPR={isPR} saved={saved} isExpanded={isExpanded} />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontWeight: "700",
                  color: isExpanded ? Colors.accent : Colors.foreground,
                  letterSpacing: -0.2,
                }}
              >
                {exercise.name}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {isExpanded && (
                <Pressable
                  onPress={() => setShowOptions(true)}
                  hitSlop={10}
                  style={{
                    width: 30,
                    height: 30,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 15,
                  }}
                >
                  <Text style={{ color: Colors.foregroundMuted, fontSize: 18, lineHeight: 20 }}>
                    ⋯
                  </Text>
                </Pressable>
              )}
              <AnimatedChevron isExpanded={isExpanded} />
            </View>
          </View>

          {/* Ligne 2 : Sous-titre contextuel */}
          <View style={{ marginTop: 6, marginLeft: 16 }}>
            {/* État collapsed — résumé de l'exercice */}
            {!isExpanded && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 13, color: Colors.foregroundMuted }}>
                  {exercise.sets} × {exercise.repsMin}–{exercise.repsMax} reps
                </Text>
                {lastEntry && (
                  <Text style={{
                    fontSize: 12,
                    color: Colors.foregroundSubtle,
                    fontVariant: ["tabular-nums"],
                  }}>
                    · S-1 : {lastEntry.charge} kg · {lastEntry.sets.join("-")}
                  </Text>
                )}
              </View>
            )}

            {/* État expanded — cible de reps + RIR objectif */}
            {isExpanded && (
              <Text style={{ fontSize: 12, color: Colors.foregroundMuted }}>
                {exercise.repsMin}–{exercise.repsMax} reps · RIR cible {exercise.rir}
              </Text>
            )}
          </View>

          {/* Badge PR */}
          {isPR && (
            <View style={{ marginTop: 8, marginLeft: 16 }}>
              <PRBadge visible={isPR} value={`${charge} kg`} />
            </View>
          )}
        </Pressable>

        {/* ── Contenu expanded ────────────────────────────────────────── */}
        {isExpanded && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 20, gap: 20 }}>

            {/* Progression banner */}
            {progression && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: Colors.achievement + "12",
                  borderLeftWidth: 3,
                  borderLeftColor: Colors.achievement,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 16 }}>
                  {progression.type === "increase_charge"
                    ? "🏆"
                    : progression.type === "stagnation"
                      ? "⚡"
                      : "📈"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.achievement, fontWeight: "600", fontSize: 13 }}>
                    Objectif · {progression.nextCharge} kg
                  </Text>
                  <Text style={{ color: Colors.foregroundMuted, fontSize: 11, marginTop: 1 }}>
                    Vise {progression.targetTotalReps} reps au total
                  </Text>
                </View>
              </View>
            )}

            {/* Charge */}
            <View style={{ gap: 6 }}>
              <Text style={{
                fontSize: 10,
                fontWeight: "700",
                color: Colors.foregroundSubtle,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}>
                Charge
              </Text>
              <ChargeStepper value={charge} onChange={setCharge} step={2.5} />
            </View>

            {/* Séries — Set Rows horizontaux */}
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: Colors.foregroundSubtle,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}>
                  Séries
                </Text>
                <Text style={{ fontSize: 11, color: Colors.foregroundSubtle, fontVariant: ["tabular-nums"] }}>
                  {completedSets.size}/{sets.length} · {totalReps} reps
                </Text>
              </View>

              {sets.map((val, i) => {
                const state = getChipState(i);
                return (
                  <SerieRow
                    key={i}
                    index={i}
                    value={val}
                    state={state}
                    onChangeText={(t) => handleSetChange(i, t)}
                    onFocus={() => setActiveSetIndex(i)}
                    onValidate={() => handleValidateSet(i)}
                    onDelete={() => handleDeleteSet(i)}
                    onUnvalidate={() => handleUnvalidateSet(i)}
                  />
                );
              })}

              {/* Barre de progression */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
                <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.surfaceElevated, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      borderRadius: 2,
                      backgroundColor: completedSets.size === sets.length ? Colors.emotional : Colors.accent,
                      width: `${sets.length > 0 ? (completedSets.size / sets.length) * 100 : 0}%`,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 10, color: Colors.foregroundSubtle, fontVariant: ["tabular-nums"] }}>
                  {Math.round(sets.length > 0 ? (completedSets.size / sets.length) * 100 : 0)}%
                </Text>
              </View>

              {/* Bouton Ajouter une série */}
              {!saved && (
                <Pressable
                  onPress={handleAddSet}
                  style={({ pressed }) => ({
                    marginTop: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: pressed ? Colors.accent : Colors.border,
                    backgroundColor: pressed ? Colors.accent + "10" : "transparent",
                    paddingVertical: 12,
                    alignItems: "center",
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: Colors.foregroundMuted,
                      letterSpacing: 0.5,
                    }}
                  >
                    + Ajouter une série
                  </Text>
                </Pressable>
              )}
            </View>

            {/* RIR */}
            <View style={{ gap: 6 }}>
              <Text style={{
                fontSize: 10,
                fontWeight: "700",
                color: Colors.foregroundSubtle,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}>
                Ressenti (RIR)
              </Text>
              <RIRSelector value={rir} onChange={setRir} />
            </View>

            {/* Bouton CTA principal */}
            <Animated.View style={btnAnimStyle}>
              <Pressable
                onPress={handleMainAction}
                disabled={buttonConfig.disabled}
                style={{
                  width: "100%",
                  borderRadius: 14,
                  paddingVertical: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  backgroundColor:
                    buttonConfig.variant === "emotional"
                      ? Colors.emotional
                      : buttonConfig.variant === "accent"
                        ? Colors.accent
                        : Colors.surfaceElevated,
                  borderWidth: buttonConfig.variant === "disabled" ? 1 : 0,
                  borderColor: Colors.border,
                  opacity: buttonConfig.disabled ? 0.5 : 1,
                }}
              >
                {buttonConfig.icon && (
                  <Text style={{
                    fontSize: 16,
                    color: buttonConfig.variant === "disabled" ? Colors.foregroundMuted : "#FFFFFF",
                  }}>
                    {buttonConfig.icon}
                  </Text>
                )}
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 15,
                    color: buttonConfig.variant === "disabled"
                      ? Colors.foregroundMuted
                      : "#FFFFFF",
                    letterSpacing: 0.2,
                  }}
                >
                  {buttonConfig.label}
                </Text>
              </Pressable>
            </Animated.View>
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
