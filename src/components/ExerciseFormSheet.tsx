import { useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Exercise } from "@/lib/types";
import { CatalogEntry } from "@/lib/program";
import { Colors, BorderRadius } from "@/theme/colors";

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
  charge: 0,
  rest: 90,
  rir: "1",
};

const RIR_OPTIONS = ["0", "1", "1-2", "2", "2-3"] as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={{
      fontSize: 10,
      fontWeight: "700",
      color: Colors.foregroundSubtle,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginBottom: 10,
    }}>
      {children}
    </Text>
  );
}

interface StepperProps {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  step?: number;
  min?: number;
  suffix?: string;
}
function Stepper({ label, value, onChange, step = 1, min = 0, suffix }: StepperProps) {
  const numVal = (value as number) || 0;
  return (
    <View style={{ flex: 1 }}>
      <SectionLabel>{label}</SectionLabel>
      <View style={{ flexDirection: "row", alignItems: "center", height: 44 }}>
        <Pressable
          onPress={() => onChange(Math.max(min, numVal - step))}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: pressed ? Colors.accent + "35" : Colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: "300", color: Colors.foreground, lineHeight: 20 }}>−</Text>
        </Pressable>

        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <TextInput
            value={value === "" ? "" : String(value)}
            onChangeText={(t) => {
              if (t === "") { onChange(""); return; }
              const n = parseFloat(t.replace(",", "."));
              if (!isNaN(n)) onChange(Math.max(min, n));
            }}
            keyboardType="numeric"
            selectTextOnFocus
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: Colors.accent,
              textAlign: "center",
              minWidth: 36,
              padding: 0,
            }}
          />
          {suffix && (
            <Text style={{ fontSize: 12, color: Colors.foregroundSubtle }}>{suffix}</Text>
          )}
        </View>

        <Pressable
          onPress={() => onChange(numVal + step)}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: pressed ? Colors.accent + "35" : Colors.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontSize: 18, fontWeight: "300", color: Colors.foreground, lineHeight: 20 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ExerciseFormSheet({
  open,
  onOpenChange,
  exercise,
  onSubmit,
  onDelete,
  catalog = [],
}: ExerciseFormSheetProps) {
  const insets = useSafeAreaInsets();
  const isEditMode = !!exercise;

  const [name, setName] = useState("");
  const [sets, setSets] = useState<number | "">(DEFAULTS.sets);
  const [rest, setRest] = useState<number | "">(DEFAULTS.rest);
  const [repsMin, setRepsMin] = useState<number | "">(DEFAULTS.repsMin);
  const [repsMax, setRepsMax] = useState<number | "">(DEFAULTS.repsMax);
  const [charge, setCharge] = useState<number | "">(DEFAULTS.charge);
  const [rir, setRir] = useState(DEFAULTS.rir);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const translateY = useRef(new Animated.Value(500)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      if (exercise) {
        setName(exercise.name);
        setSets(exercise.sets);
        setRest(exercise.rest);
        setRepsMin(exercise.repsMin);
        setRepsMax(exercise.repsMax);
        setCharge(exercise.charge);
        setRir(exercise.rir);
      } else {
        setName(DEFAULTS.name);
        setSets(DEFAULTS.sets);
        setRest(DEFAULTS.rest);
        setRepsMin(DEFAULTS.repsMin);
        setRepsMax(DEFAULTS.repsMax);
        setCharge(DEFAULTS.charge);
        setRir(DEFAULTS.rir);
      }
      setShowSuggestions(false);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 26, stiffness: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 500, duration: 240, useNativeDriver: true }),
      ]).start();
    }
  }, [open, exercise]);

  const filteredCatalog = catalog
    .filter((e) => !isEditMode && name.trim() && e.name.toLowerCase().includes(name.toLowerCase().trim()))
    .slice(0, 5);
  const exactMatch = filteredCatalog.find(
    (e) => e.name.toLowerCase().trim() === name.toLowerCase().trim()
  );

  const handleSelectEntry = (entry: CatalogEntry) => {
    setName(entry.name);
    setSets(entry.sets);
    setRest(entry.rest);
    setRepsMin(entry.repsMin);
    setRepsMax(entry.repsMax);
    setCharge(entry.charge);
    setRir(entry.rir);
    setShowSuggestions(false);
  };

  const canSubmit =
    name.trim().length > 0 &&
    typeof sets === "number" && sets > 0 &&
    typeof repsMin === "number" && repsMin > 0 &&
    typeof repsMax === "number" && repsMax >= repsMin;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      sets: sets as number,
      repsMin: repsMin as number,
      repsMax: repsMax as number,
      charge: typeof charge === "number" ? charge : 0,
      rest: typeof rest === "number" ? rest : 90,
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
          onPress: () => { onDelete?.(); onOpenChange(false); },
        },
      ]
    );
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => onOpenChange(false)}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>

          <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(0,0,0,0.65)", opacity: backdrop },
              ]}
            />
          </TouchableWithoutFeedback>

          <Animated.View style={{
            backgroundColor: Colors.surfaceElevated,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "92%",
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateY }],
          }}>
            <View style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.border,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 24,
            }} />

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, gap: 16 }}
            >
              <View style={{ gap: 4, marginBottom: 8 }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: Colors.foreground,
                  letterSpacing: -0.4,
                }}>
                  {isEditMode ? "Modifier l'exercice" : "Nouvel exercice"}
                </Text>
                <Text style={{ fontSize: 13, color: Colors.foregroundMuted }}>
                  {isEditMode ? "Paramètres cibles de l'exercice" : "Définis les paramètres de départ"}
                </Text>
              </View>

              <View>
                <SectionLabel>Nom de l'exercice</SectionLabel>
                <TextInput
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    setShowSuggestions(t.trim().length > 0 && !isEditMode);
                  }}
                  placeholder="Ex: Squat, Développé couché…"
                  placeholderTextColor={Colors.foregroundSubtle}
                  autoCorrect={false}
                  autoCapitalize="words"
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: BorderRadius.input,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: Colors.foreground,
                    minHeight: 50,
                  }}
                />

                {showSuggestions && !isEditMode && (filteredCatalog.length > 0 || !exactMatch) && (
                  <View style={{
                    marginTop: 6,
                    backgroundColor: Colors.surface,
                    borderRadius: BorderRadius.input,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    overflow: "hidden",
                  }}>
                    {filteredCatalog.map((entry, idx) => (
                      <Pressable
                        key={entry.name}
                        onPress={() => handleSelectEntry(entry)}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          borderBottomWidth: idx < filteredCatalog.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: Colors.border,
                          backgroundColor: pressed ? Colors.surfaceElevated : "transparent",
                        })}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.foreground }}>
                            {entry.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: Colors.foregroundMuted, marginTop: 2 }}>
                            {entry.sets} séries · {entry.repsMin}–{entry.repsMax} reps
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 4 }}>
                          {entry.sessions.map((s) => (
                            <View key={s} style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: Colors.surfaceElevated,
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                              <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.foregroundMuted }}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </Pressable>
                    ))}
                    {!exactMatch && name.trim().length > 0 && (
                      <Pressable
                        onPress={() => setShowSuggestions(false)}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: Colors.border,
                          backgroundColor: pressed ? Colors.accent + "18" : "transparent",
                        })}
                      >
                        <View style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: Colors.accent + "20",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Text style={{ color: Colors.accent, fontSize: 12, lineHeight: 16 }}>+</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.accent }}>
                          Créer « {name.trim()} »
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              <View>
                <SectionLabel>Charge initiale</SectionLabel>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, height: 54 }}>
                  <Pressable
                    onPress={() => setCharge(Math.max(0, ((charge as number) || 0) - 2.5))}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? Colors.background : Colors.surface,
                      borderRadius: BorderRadius.input,
                      borderWidth: 1,
                      borderColor: pressed ? Colors.accent + "50" : Colors.border,
                      paddingHorizontal: 16,
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.foregroundMuted, letterSpacing: 0.2 }}>
                      −2.5
                    </Text>
                  </Pressable>

                  <View style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: Colors.surface,
                    borderRadius: BorderRadius.input,
                    borderWidth: 1,
                    borderColor: Colors.accent + "60",
                    height: "100%",
                    gap: 4,
                  }}>
                    <TextInput
                      value={charge === 0 || charge === "" ? "" : String(charge)}
                      onChangeText={(t) => {
                        if (t === "") { setCharge(""); return; }
                        const n = parseFloat(t.replace(",", "."));
                        if (!isNaN(n)) setCharge(Math.max(0, n));
                      }}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.foregroundSubtle}
                      selectTextOnFocus
                      style={{ fontSize: 26, fontWeight: "700", color: Colors.foreground, textAlign: "center", minWidth: 60, padding: 0 }}
                    />
                    <Text style={{ fontSize: 14, fontWeight: "500", color: Colors.foregroundMuted }}>kg</Text>
                  </View>

                  <Pressable
                    onPress={() => setCharge(((charge as number) || 0) + 2.5)}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? Colors.background : Colors.surface,
                      borderRadius: BorderRadius.input,
                      borderWidth: 1,
                      borderColor: pressed ? Colors.accent + "50" : Colors.border,
                      paddingHorizontal: 16,
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.foregroundMuted, letterSpacing: 0.2 }}>
                      +2.5
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{
                  flex: 1,
                  backgroundColor: Colors.surface,
                  borderRadius: BorderRadius.input,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                }}>
                  <Stepper label="Séries" value={sets} onChange={setSets} min={1} />
                </View>
                <View style={{
                  flex: 1,
                  backgroundColor: Colors.surface,
                  borderRadius: BorderRadius.input,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                }}>
                  <Stepper label="Repos" value={rest} onChange={setRest} min={0} step={15} suffix="s" />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{
                  flex: 1,
                  backgroundColor: Colors.surface,
                  borderRadius: BorderRadius.input,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                }}>
                  <Stepper label="Reps Min" value={repsMin} onChange={setRepsMin} min={1} />
                </View>
                <View style={{
                  flex: 1,
                  backgroundColor: Colors.surface,
                  borderRadius: BorderRadius.input,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                }}>
                  <Stepper label="Reps Max" value={repsMax} onChange={setRepsMax} min={1} />
                </View>
              </View>

              <View>
                <SectionLabel>RIR Cible</SectionLabel>
                <View style={{
                  flexDirection: "row",
                  backgroundColor: Colors.surface,
                  borderRadius: BorderRadius.input,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  padding: 4,
                  gap: 4,
                }}>
                  {RIR_OPTIONS.map((val) => (
                    <Pressable
                      key={val}
                      onPress={() => setRir(val)}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: rir === val ? Colors.accent : "transparent",
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: rir === val ? "#FFFFFF" : Colors.foregroundMuted,
                      }}>
                        {val}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 8,
              gap: 10,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: Colors.border,
            }}>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={{
                  height: 56,
                  borderRadius: 9999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.emotional,
                  opacity: !canSubmit ? 0.4 : 1,
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  letterSpacing: 0.3,
                }}>
                  {isEditMode ? "Enregistrer les modifications" : "Ajouter l'exercice"}
                </Text>
              </Pressable>
            </View>

          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
