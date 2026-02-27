import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { loadState } from "@/lib/storage";
import { Colors } from "@/theme/colors";
import { getExercisesForSession, initCustomExercises } from "@/lib/program";
import { AppState, SessionType, WorkoutEntry } from "@/lib/types";

type ExerciseRow = {
  id: string;
  name: string;
  history: WorkoutEntry[];
};

/** Mini bar chart: relative volume of last 6 entries */
function MiniChart({ history }: { history: WorkoutEntry[] }) {
  const last = history.slice(-6);
  if (last.length === 0) return null;
  const volumes = last.map((e) => e.charge * e.sets.reduce((a, b) => a + b, 0));
  const maxVol = Math.max(...volumes, 1);

  return (
    <View className="flex-row items-end gap-0.5 h-8">
      {volumes.map((v, i) => (
        <View
          key={i}
          style={{ height: `${Math.max((v / maxVol) * 100, 8)}%` }}
          className={`flex-1 rounded-sm ${i === volumes.length - 1 ? "bg-primary" : "bg-foreground-subtle/40"
            }`}
        />
      ))}
    </View>
  );
}

function ExerciseHistoryRow({ item }: { item: ExerciseRow }) {
  const [expanded, setExpanded] = useState(false);
  const last = item.history.length > 0 ? item.history[item.history.length - 1] : null;

  if (!last) {
    return (
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-foreground text-sm">{item.name}</Text>
        <Text className="text-foreground-muted text-xs">Pas d'entrée</Text>
      </View>
    );
  }

  const totalReps = last.sets.reduce((a, b) => a + b, 0);
  const volume = last.charge * totalReps;
  const dateStr = new Date(last.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <Pressable onPress={() => setExpanded((v) => !v)} className="active:bg-white/3">
      <View className="px-4 py-3 flex-row items-center gap-3">
        <View style={{ width: 52 }}>
          <MiniChart history={item.history} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-sm font-medium">{item.name}</Text>
          <Text className="text-foreground-muted text-xs mt-0.5">
            {last.charge} kg · {last.sets.join("-")} · RIR {last.rir}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-primary text-sm font-mono font-medium">
            {volume.toLocaleString("fr-FR")} kg
          </Text>
          <Text className="text-foreground-muted text-[11px]">{dateStr}</Text>
        </View>
      </View>

      {expanded && item.history.length > 1 && (
        <View className="mx-4 mb-3 bg-background rounded-xl overflow-hidden border border-border">
          {item.history
            .slice(-5)
            .reverse()
            .map((entry, i, arr) => {
              const d = new Date(entry.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              });
              const vol = entry.charge * entry.sets.reduce((a, b) => a + b, 0);
              return (
                <View
                  key={i}
                  className={`flex-row items-center px-3 py-2 ${i < arr.length - 1 ? "border-b border-border/50" : ""
                    }`}
                >
                  <Text className="text-foreground-muted text-[11px] w-14">{d}</Text>
                  <Text className="text-foreground text-xs font-mono flex-1">
                    {entry.charge} kg — {entry.sets.join("-")}
                  </Text>
                  <Text className="text-foreground-muted text-[11px] font-mono">
                    {vol.toLocaleString("fr-FR")} kg
                  </Text>
                </View>
              );
            })}
        </View>
      )}
    </Pressable>
  );
}

export default function HistoryScreen() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [activeSession, setActiveSession] = useState<SessionType>("A");

  useEffect(() => {
    loadState().then(setAppState);
  }, []);

  const exercisesBySession = useMemo<Record<SessionType, ExerciseRow[]>>(() => {
    if (!appState) return { A: [], B: [], C: [] };
    return (["A", "B", "C"] as SessionType[]).reduce(
      (acc, s) => {
        const exs = getExercisesForSession(
          s,
          appState.currentBlock,
          appState.customExercises ?? initCustomExercises()
        );
        acc[s] = exs.map((ex) => ({
          id: ex.id,
          name: ex.name,
          history: appState.workoutData[ex.id] || [],
        }));
        return acc;
      },
      {} as Record<SessionType, ExerciseRow[]>
    );
  }, [appState]);

  if (!appState) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={Colors.emotional} />
      </View>
    );
  }

  const totalEntries = Object.values(appState.workoutData).reduce(
    (a, v) => a + v.length,
    0
  );
  const rows = exercisesBySession[activeSession] ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"] as const}>
      {/* Header */}
      <View className="px-5 pt-5 pb-3 border-b border-border/50">
        <Text className="text-foreground text-3xl font-bold tracking-tight">
          Historique
        </Text>
        <Text className="text-foreground-muted text-sm mt-1">
          {totalEntries} entrée{totalEntries > 1 ? "s" : ""} enregistrée
          {totalEntries > 1 ? "s" : ""}
        </Text>
      </View>

      {/* Session tabs */}
      <View className="flex-row px-4 py-3 gap-2">
        {(["A", "B", "C"] as SessionType[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => setActiveSession(s)}
            className={`flex-1 py-2.5 rounded-xl items-center ${activeSession === s ? "bg-primary" : "bg-surface border border-border"
              }`}
          >
            <Text
              className={`text-sm font-semibold ${activeSession === s ? "text-white" : "text-foreground-muted"
                }`}
            >
              Séance {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {rows.length > 0 ? (
        <SectionList
          sections={[{ title: activeSession, data: rows }]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExerciseHistoryRow item={item} />}
          renderSectionHeader={() => null}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-border/40 mx-4" />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <View className="items-center gap-2">
            <Text className="text-2xl">🏋️</Text>
            <Text className="text-foreground text-base font-medium text-center">
              Séance {activeSession} — pas encore de données
            </Text>
            <Text className="text-foreground-muted text-sm text-center">
              Lance une séance pour voir tes performances ici.
            </Text>
          </View>
          <Pressable
            className="bg-primary rounded-xl px-8 py-4 items-center active:opacity-80"
            onPress={() => router.push('/')}
          >
            <Text className="text-white font-semibold text-[13px] uppercase tracking-wider">
              Démarrer une séance
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
