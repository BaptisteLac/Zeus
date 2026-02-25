import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Exercise, WorkoutEntry } from "@/lib/types";
import { calculateProgression } from "@/lib/progression";

interface SessionSummaryProps {
  visible: boolean;
  exercises: Exercise[];
  workoutData: Record<string, WorkoutEntry[]>;
  savedExercises: Set<string>;
  session: string;
  onClose: () => void;
}

export default function SessionSummary({
  visible,
  exercises,
  workoutData,
  savedExercises,
  session,
  onClose,
}: SessionSummaryProps) {
  const completedCount = savedExercises.size;
  const totalCount = exercises.length;

  const totalVolume = exercises.reduce((acc, ex) => {
    const history = workoutData[ex.id] || [];
    if (history.length === 0) return acc;
    const latest = history[history.length - 1];
    const repsTotal = latest.sets.reduce((a, b) => a + b, 0);
    return acc + latest.charge * repsTotal;
  }, 0);

  const progressions = exercises
    .map((ex) => {
      const history = workoutData[ex.id] || [];
      const p = calculateProgression(ex, history);
      return p ? { name: ex.name, type: p.type } : null;
    })
    .filter(Boolean) as Array<{ name: string; type: string }>;

  const improvements = progressions.filter(
    (p) => p.type === "increase_charge" || p.type === "increase_reps"
  );
  const stagnations = progressions.filter((p) => p.type === "stagnation");

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill} className="bg-background/95 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-surface rounded-2xl overflow-hidden border border-border">
          {/* Header */}
          <View className="bg-primary px-6 py-6 items-center">
            <Text className="text-4xl mb-2">🎉</Text>
            <Text className="text-white text-2xl font-semibold tracking-tight">
              Séance {session} terminée
            </Text>
            <Text className="text-white/80 text-sm mt-1">
              {completedCount}/{totalCount} exercices complétés
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats grid */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-background rounded-xl p-4 items-center">
                <Text className="text-foreground-muted text-[10px] uppercase tracking-wider">
                  Volume total
                </Text>
                <Text className="text-foreground text-2xl font-mono mt-1">
                  {totalVolume.toLocaleString("fr-FR")}
                  <Text className="text-foreground-muted text-sm"> kg</Text>
                </Text>
              </View>
              <View className="flex-1 bg-background rounded-xl p-4 items-center">
                <Text className="text-foreground-muted text-[10px] uppercase tracking-wider">
                  Exercices
                </Text>
                <Text className="text-foreground text-2xl font-mono mt-1">
                  {completedCount}/{totalCount}
                </Text>
              </View>
            </View>

            {/* Progressions */}
            {improvements.length > 0 && (
              <View>
                <Text className="text-foreground-muted text-xs uppercase tracking-wider mb-2">
                  📈 Progressions
                </Text>
                <View className="gap-1.5">
                  {improvements.map((p, i) => (
                    <View
                      key={i}
                      className="flex-row items-center gap-2 bg-success/10 border border-success/20 rounded-lg px-3 py-2"
                    >
                      <Text className="text-success font-bold">↑</Text>
                      <Text className="text-foreground text-sm">{p.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Stagnations */}
            {stagnations.length > 0 && (
              <View>
                <Text className="text-foreground-muted text-xs uppercase tracking-wider mb-2">
                  ⚠️ Points d'attention
                </Text>
                <View className="gap-1.5">
                  {stagnations.map((p, i) => (
                    <View
                      key={i}
                      className="flex-row items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-lg px-3 py-2"
                    >
                      <Text className="text-secondary font-bold">→</Text>
                      <Text className="text-foreground text-sm">
                        {p.name} — stagnation
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* CTA */}
          <View className="px-5 pb-6 pt-2">
            <Pressable
              onPress={onClose}
              className="bg-primary rounded-xl py-4 items-center active:opacity-80"
            >
              <Text className="text-white font-semibold text-sm uppercase tracking-wider">
                Continuer →
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
