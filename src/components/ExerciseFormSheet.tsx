import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Exercise } from "@/lib/types";
import { CatalogEntry } from "@/lib/program";

interface ExerciseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise;
  onSubmit: (exercise: Omit<Exercise, "id">) => void;
  onDelete?: () => void;
  catalog?: CatalogEntry[];
}

const DEFAULTS: Omit<Exercise, "id"> = {
  name: "",
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  rest: 90,
  rir: "1",
};

const RIR_OPTIONS = ["0", "1", "1-2", "2", "2-3"] as const;

export default function ExerciseFormSheet({
  open,
  onOpenChange,
  exercise,
  onSubmit,
  onDelete,
  catalog = [],
}: ExerciseFormSheetProps) {
  const isEditMode = !!exercise;

  const [name, setName] = useState("");
  const [sets, setSets] = useState<number | "">(3);
  const [repsMin, setRepsMin] = useState<number | "">(8);
  const [repsMax, setRepsMax] = useState<number | "">(12);
  const [rest, setRest] = useState<number | "">(90);
  const [rir, setRir] = useState("1");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Slide-up animation
  const translateY = useSharedValue(600);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (open) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 300 });
      // Populate form
      if (exercise) {
        setName(exercise.name);
        setSets(exercise.sets);
        setRepsMin(exercise.repsMin);
        setRepsMax(exercise.repsMax);
        setRest(exercise.rest);
        setRir(exercise.rir);
      } else {
        setName(DEFAULTS.name);
        setSets(DEFAULTS.sets);
        setRepsMin(DEFAULTS.repsMin);
        setRepsMax(DEFAULTS.repsMax);
        setRest(DEFAULTS.rest);
        setRir(DEFAULTS.rir);
      }
      setShowSuggestions(false);
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(600, { duration: 240 });
    }
  }, [open, exercise]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Autocomplete
  const filteredCatalog = useMemo(() => {
    if (!name.trim() || isEditMode) return [];
    const q = name.toLowerCase().trim();
    return catalog.filter((e) => e.name.toLowerCase().includes(q));
  }, [name, catalog, isEditMode]);

  const exactMatch = filteredCatalog.find(
    (e) => e.name.toLowerCase().trim() === name.toLowerCase().trim()
  );

  const handleSelectEntry = (entry: CatalogEntry) => {
    setName(entry.name);
    setSets(entry.sets);
    setRepsMin(entry.repsMin);
    setRepsMax(entry.repsMax);
    setRest(entry.rest);
    setRir(entry.rir);
    setShowSuggestions(false);
  };

  const canSubmit =
    name.trim().length > 0 &&
    typeof sets === "number" &&
    sets > 0 &&
    typeof repsMin === "number" &&
    repsMin > 0 &&
    typeof repsMax === "number" &&
    repsMax >= repsMin &&
    typeof rest === "number";

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      sets: sets as number,
      repsMin: repsMin as number,
      repsMax: repsMax as number,
      rest: rest as number,
      rir,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    Alert.alert(
      `Supprimer ${exercise?.name} ?`,
      "L'exercice sera retiré de ta séance. L'historique sera conservé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            onDelete?.();
            onOpenChange(false);
          },
        },
      ]
    );
  };

  const numField = (
    label: string,
    value: number | "",
    onChange: (v: number | "") => void,
    opts?: { step?: number; min?: number }
  ) => (
    <View className="flex-1">
      <Text className="text-foreground-muted text-[11px] uppercase tracking-wider mb-2 text-center">
        {label}
      </Text>
      <View className="flex-row items-center bg-surface rounded-xl h-12 overflow-hidden">
        <Pressable
          onPress={() =>
            onChange(
              Math.max(opts?.min ?? 0, ((value as number) || 0) - (opts?.step ?? 1))
            )
          }
          className="w-10 h-full items-center justify-center active:bg-white/5"
        >
          <Text className="text-foreground text-lg font-light">−</Text>
        </Pressable>
        <TextInput
          value={value === "" ? "" : String(value)}
          onChangeText={(t) => {
            if (t === "" || t === "-") {
              onChange("");
              return;
            }
            const n = parseInt(t);
            if (!isNaN(n)) onChange(Math.max(opts?.min ?? 0, n));
          }}
          keyboardType="numeric"
          className="flex-1 text-center text-base font-mono text-primary"
          style={{ minHeight: 48 }}
        />
        <Pressable
          onPress={() =>
            onChange(((value as number) || 0) + (opts?.step ?? 1))
          }
          className="w-10 h-full items-center justify-center active:bg-white/5"
        >
          <Text className="text-foreground text-lg font-light">+</Text>
        </Pressable>
      </View>
    </View>
  );

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={() => onOpenChange(false)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
            <Animated.View
              style={[
                { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)" },
                backdropStyle,
              ]}
            />
          </TouchableWithoutFeedback>

          {/* Sheet */}
          <Animated.View
            style={[sheetStyle, { backgroundColor: "#111111", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" }]}
          >
            {/* Handle */}
            <View className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-5" />

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <Text className="text-foreground text-2xl font-semibold mb-1">
                {isEditMode ? "Modifier l'exercice" : "Nouvel exercice"}
              </Text>
              <Text className="text-foreground-muted text-sm mb-6">
                {isEditMode
                  ? "Modifie les paramètres"
                  : "Ajoute un exercice à ta séance"}
              </Text>

              {/* Name field + suggestions */}
              <View className="mb-5">
                <Text className="text-foreground-muted text-[11px] uppercase tracking-wider mb-2">
                  Nom de l'exercice
                </Text>
                <TextInput
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    setShowSuggestions(t.trim().length > 0 && !isEditMode);
                  }}
                  placeholder="Ex: Squat, Développé couché…"
                  placeholderTextColor="#6E6E68"
                  autoCorrect={false}
                  autoCapitalize="words"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground text-base"
                  style={{ minHeight: 48 }}
                />

                {/* Autocomplete list */}
                {showSuggestions && !isEditMode && (filteredCatalog.length > 0 || !exactMatch) && (
                  <View className="mt-1 bg-surface-elevated border border-border rounded-xl overflow-hidden">
                    {filteredCatalog.slice(0, 5).map((entry, idx, arr) => (
                      <Pressable
                        key={entry.name}
                        onPress={() => handleSelectEntry(entry)}
                        className={`flex-row items-center justify-between px-4 py-3 active:bg-white/5 ${idx < arr.length - 1 ? "border-b border-border/50" : ""
                          }`}
                      >
                        <View className="flex-1 mr-3">
                          <Text className="text-foreground text-sm font-medium">
                            {entry.name}
                          </Text>
                          <Text className="text-foreground-muted text-xs mt-0.5">
                            {entry.sets}×{entry.repsMin}–{entry.repsMax} · {entry.rest}s repos
                          </Text>
                        </View>
                        <View className="flex-row gap-1">
                          {entry.sessions.map((s) => (
                            <View
                              key={s}
                              className="w-5 h-5 rounded-full bg-white/10 items-center justify-center"
                            >
                              <Text className="text-foreground-muted text-[10px] font-semibold">
                                {s}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </Pressable>
                    ))}

                    {!exactMatch && name.trim().length > 0 && (
                      <Pressable
                        onPress={() => setShowSuggestions(false)}
                        className="flex-row items-center gap-3 px-4 py-3 active:bg-primary/10"
                      >
                        <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
                          <Text className="text-primary text-xs">+</Text>
                        </View>
                        <Text className="text-primary text-sm font-medium">
                          Créer « {name.trim()} »
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              {/* Séries + Repos */}
              <View className="flex-row gap-3 mb-5">
                {numField("Séries", sets, setSets, { min: 1 })}
                {numField("Repos (s)", rest, setRest, { step: 15, min: 0 })}
              </View>

              {/* Reps min + max */}
              <View className="flex-row gap-3 mb-5">
                {numField("Reps Min", repsMin, setRepsMin, { min: 1 })}
                {numField("Reps Max", repsMax, setRepsMax, { min: 1 })}
              </View>

              {/* RIR cible */}
              <View className="mb-6">
                <Text className="text-foreground-muted text-[11px] uppercase tracking-wider mb-2 text-center">
                  RIR Cible
                </Text>
                <View className="flex-row bg-surface rounded-xl p-1 gap-1">
                  {RIR_OPTIONS.map((val) => (
                    <Pressable
                      key={val}
                      onPress={() => setRir(val)}
                      className={`flex-1 h-10 rounded-lg items-center justify-center ${rir === val ? "bg-primary" : ""
                        }`}
                    >
                      <Text
                        className={`text-sm font-mono ${rir === val
                            ? "text-white font-semibold"
                            : "text-foreground-muted"
                          }`}
                      >
                        {val}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                className={`rounded-full py-4 items-center mb-3 active:opacity-80 ${canSubmit ? "bg-primary" : "bg-surface border border-border"
                  }`}
              >
                <Text
                  className={`font-semibold text-sm uppercase tracking-wider ${canSubmit ? "text-white" : "text-foreground-muted"
                    }`}
                >
                  {isEditMode ? "Enregistrer les modifications" : "Ajouter l'exercice"}
                </Text>
              </Pressable>

              {/* Delete */}
              {isEditMode && onDelete && (
                <Pressable
                  onPress={handleDelete}
                  className="rounded-xl border-2 border-error/30 py-4 items-center active:bg-error/5"
                >
                  <Text className="text-error font-medium text-sm uppercase tracking-wider">
                    Supprimer cet exercice
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
      </KeyboardAvoidingView >
    </Modal >
  );
}
