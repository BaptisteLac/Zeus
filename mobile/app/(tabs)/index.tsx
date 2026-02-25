import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, SafeAreaView, ScrollView } from "react-native";
import { loadState, saveState, computeBlock, getDefaultState } from "@/lib/storage";
import { getExercisesForSession } from "@/lib/program";
import { AppState } from "@/lib/types";

export default function WorkoutScreen() {
  const [state, setState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState().then((loaded) => {
      // Recompute block based on start date
      const { block, week } = computeBlock(loaded.programStartDate);
      setState({ ...loaded, currentBlock: block, weekNumber: week });
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !state) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#C0694A" size="large" />
      </View>
    );
  }

  const exercises = getExercisesForSession(
    state.currentSession,
    state.currentBlock,
    state.customExercises
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="pt-6 pb-4">
          <Text className="text-foreground-muted text-sm">
            Semaine {state.weekNumber} · Bloc {state.currentBlock}
          </Text>
          <Text className="text-foreground text-3xl font-bold mt-1">
            Séance {state.currentSession}
          </Text>
        </View>

        {/* Exercises list */}
        <View className="gap-3">
          {exercises.map((exercise) => (
            <View
              key={exercise.id}
              className="bg-surface-elevated rounded-2xl p-4"
            >
              <Text className="text-foreground text-base font-semibold">
                {exercise.name}
              </Text>
              <Text className="text-foreground-muted text-sm mt-1">
                {exercise.sets} séries · {exercise.repsMin}–{exercise.repsMax} reps · {exercise.rest}s repos
              </Text>
            </View>
          ))}
        </View>

        {/* Placeholder notice */}
        <View className="mt-8 bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-primary font-semibold text-sm">Migration en cours</Text>
          <Text className="text-foreground-muted text-sm mt-1">
            Cet écran est un placeholder. La UI complète arrive dans la prochaine phase.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
