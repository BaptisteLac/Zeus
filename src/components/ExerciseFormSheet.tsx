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
  setsMin: 3,
  setsMax: 4,
  repsMin: 8,
  repsMax: 12,
  charge: 0,
  rest: 90,
  rir: "1",
};

const RIR_OPTIONS = ["0", "1", "1-2", "2", "2-3"] as const;

// ─── Label section ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

// ─── Stepper générique ────────────────────────────────────────────────────────
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
      <View style={styles.stepperRow}>
        {/* − */}
        <Pressable
          onPress={() => onChange(Math.max(min, numVal - step))}
          style={({ pressed }) => [styles.stepperBtn, pressed && styles.stepperBtnPressed]}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </Pressable>

        {/* Valeur */}
        <View style={styles.stepperValueArea}>
          <TextInput
            value={value === "" ? "" : String(value)}
            onChangeText={(t) => {
              if (t === "") { onChange(""); return; }
              const n = parseFloat(t.replace(",", "."));
              if (!isNaN(n)) onChange(Math.max(min, n));
            }}
            keyboardType="numeric"
            selectTextOnFocus
            style={styles.stepperInput}
          />
          {suffix && <Text style={styles.stepperSuffix}>{suffix}</Text>}
        </View>

        {/* + */}
        <Pressable
          onPress={() => onChange(numVal + step)}
          style={({ pressed }) => [styles.stepperBtn, pressed && styles.stepperBtnPressed]}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── ExerciseFormSheet ────────────────────────────────────────────────────────
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

  // ── State ──────────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [setsMin, setSetsMin] = useState<number | "">(DEFAULTS.setsMin);
  const [setsMax, setSetsMax] = useState<number | "">(DEFAULTS.setsMax);
  const [repsMin, setRepsMin] = useState<number | "">(DEFAULTS.repsMin);
  const [repsMax, setRepsMax] = useState<number | "">(DEFAULTS.repsMax);
  const [charge, setCharge] = useState<number | "">(DEFAULTS.charge);
  const [rir, setRir] = useState(DEFAULTS.rir);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Animation (RN Animated, pas Reanimated) ────────────────────────────────
  const translateY = useRef(new Animated.Value(500)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      // Populate
      if (exercise) {
        setName(exercise.name);
        setSetsMin(exercise.setsMin);
        setSetsMax(exercise.setsMax);
        setRepsMin(exercise.repsMin);
        setRepsMax(exercise.repsMax);
        setCharge(exercise.charge);
        setRir(exercise.rir);
      } else {
        setName(DEFAULTS.name);
        setSetsMin(DEFAULTS.setsMin);
        setSetsMax(DEFAULTS.setsMax);
        setRepsMin(DEFAULTS.repsMin);
        setRepsMax(DEFAULTS.repsMax);
        setCharge(DEFAULTS.charge);
        setRir(DEFAULTS.rir);
      }
      setShowSuggestions(false);
      // Slide up
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

  // ── Autocomplete ───────────────────────────────────────────────────────────
  const filteredCatalog = catalog
    .filter((e) => !isEditMode && name.trim() && e.name.toLowerCase().includes(name.toLowerCase().trim()))
    .slice(0, 5);
  const exactMatch = filteredCatalog.find(
    (e) => e.name.toLowerCase().trim() === name.toLowerCase().trim()
  );

  const handleSelectEntry = (entry: CatalogEntry) => {
    setName(entry.name);
    setSetsMin(entry.setsMin);
    setSetsMax(entry.setsMax);
    setRepsMin(entry.repsMin);
    setRepsMax(entry.repsMax);
    setCharge(entry.charge);
    setRir(entry.rir);
    setShowSuggestions(false);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const canSubmit =
    name.trim().length > 0 &&
    typeof setsMin === "number" && setsMin > 0 &&
    typeof setsMax === "number" && setsMax >= setsMin &&
    typeof repsMin === "number" && repsMin > 0 &&
    typeof repsMax === "number" && repsMax >= repsMin;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      setsMin: setsMin as number,
      setsMax: setsMax as number,
      repsMin: repsMin as number,
      repsMax: repsMax as number,
      charge: typeof charge === "number" ? charge : 0,
      rest: 90,
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
        { text: "Supprimer", style: "destructive", onPress: () => { onDelete?.(); onOpenChange(false); } },
      ]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => onOpenChange(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>

          {/* ── Backdrop ──────────────────────────────────────────── */}
          <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: "rgba(0,0,0,0.65)", opacity: backdrop },
              ]}
            />
          </TouchableWithoutFeedback>

          {/* ── Sheet ─────────────────────────────────────────────── */}
          <Animated.View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 8), transform: [{ translateY }] }]}
          >
            {/* Handle */}
            <View style={styles.handle} />

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* ── Header ──────────────────────────────────────── */}
              <Text style={styles.title}>
                {isEditMode ? "Modifier l'exercice" : "Nouvel exercice"}
              </Text>
              <Text style={styles.subtitle}>
                {isEditMode ? "Paramètres cibles de l'exercice" : "Définis les paramètres de départ"}
              </Text>

              {/* ── Nom ─────────────────────────────────────────── */}
              <View style={styles.fieldBlock}>
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
                  style={styles.textInput}
                />

                {/* Autocomplete */}
                {showSuggestions && !isEditMode && (filteredCatalog.length > 0 || !exactMatch) && (
                  <View style={styles.autocompleteBox}>
                    {filteredCatalog.map((entry, idx) => (
                      <Pressable
                        key={entry.name}
                        onPress={() => handleSelectEntry(entry)}
                        style={({ pressed }) => [
                          styles.autocompleteItem,
                          idx < filteredCatalog.length - 1 && styles.autocompleteItemBorder,
                          pressed && { backgroundColor: Colors.surfaceElevated + "80" },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.autocompleteItemName}>{entry.name}</Text>
                          <Text style={styles.autocompleteItemMeta}>
                            {entry.setsMin}–{entry.setsMax} séries · {entry.repsMin}–{entry.repsMax} reps
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 4 }}>
                          {entry.sessions.map((s) => (
                            <View key={s} style={styles.sessionBadge}>
                              <Text style={styles.sessionBadgeText}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </Pressable>
                    ))}
                    {!exactMatch && name.trim().length > 0 && (
                      <Pressable
                        onPress={() => setShowSuggestions(false)}
                        style={({ pressed }) => [
                          styles.autocompleteCreate,
                          pressed && { backgroundColor: Colors.accent + "18" },
                        ]}
                      >
                        <View style={styles.createIcon}>
                          <Text style={{ color: Colors.accent, fontSize: 12, lineHeight: 16 }}>+</Text>
                        </View>
                        <Text style={styles.autocompleteCreateText}>Créer « {name.trim()} »</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              {/* ── Charge ──────────────────────────────────────── */}
              <View style={styles.fieldBlock}>
                <SectionLabel>Charge initiale</SectionLabel>
                <View style={styles.chargeRow}>
                  <Pressable
                    onPress={() => setCharge(Math.max(0, ((charge as number) || 0) - 2.5))}
                    style={({ pressed }) => [styles.chargeBtn, pressed && styles.stepperBtnPressed]}
                  >
                    <Text style={styles.chargeBtnText}>−2.5</Text>
                  </Pressable>
                  <View style={styles.chargeValueBox}>
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
                      style={styles.chargeInput}
                    />
                    <Text style={styles.chargeUnit}>kg</Text>
                  </View>
                  <Pressable
                    onPress={() => setCharge(((charge as number) || 0) + 2.5)}
                    style={({ pressed }) => [styles.chargeBtn, pressed && styles.stepperBtnPressed]}
                  >
                    <Text style={styles.chargeBtnText}>+2.5</Text>
                  </Pressable>
                </View>
              </View>

              {/* ── Séries ──────────────────────────────────────── */}
              <View style={[styles.fieldBlock, styles.rowGroup]}>
                <Stepper label="Séries Min" value={setsMin} onChange={setSetsMin} min={1} />
                <View style={styles.rowDivider} />
                <Stepper label="Séries Max" value={setsMax} onChange={setSetsMax} min={1} />
              </View>

              {/* ── Reps ────────────────────────────────────────── */}
              <View style={[styles.fieldBlock, styles.rowGroup]}>
                <Stepper label="Reps Min" value={repsMin} onChange={setRepsMin} min={1} />
                <View style={styles.rowDivider} />
                <Stepper label="Reps Max" value={repsMax} onChange={setRepsMax} min={1} />
              </View>

              {/* ── RIR ─────────────────────────────────────────── */}
              <View style={styles.fieldBlock}>
                <SectionLabel>RIR Cible</SectionLabel>
                <View style={styles.rirRow}>
                  {RIR_OPTIONS.map((val) => (
                    <Pressable
                      key={val}
                      onPress={() => setRir(val)}
                      style={[styles.rirPill, rir === val && styles.rirPillActive]}
                    >
                      <Text style={[styles.rirPillText, rir === val && styles.rirPillTextActive]}>
                        {val}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* ── Footer ────────────────────────────────────────── */}
            <View style={styles.footer}>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.ctaBtn,
                  canSubmit ? styles.ctaBtnActive : styles.ctaBtnDisabled,
                  pressed && canSubmit && { backgroundColor: Colors.emotionalPressed },
                ]}
              >
                <Text style={[styles.ctaBtnText, !canSubmit && styles.ctaBtnTextDisabled]}>
                  {isEditMode ? "Enregistrer les modifications" : "Ajouter l'exercice"}
                </Text>
              </Pressable>

              {isEditMode && onDelete && (
                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [styles.deleteBtn, pressed && { backgroundColor: Colors.error + "12" }]}
                >
                  <Text style={styles.deleteBtnText}>Supprimer l'exercice</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Sheet
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  // Header
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.foreground,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.foregroundMuted,
    marginBottom: 28,
  },

  // Fields
  fieldBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.foregroundSubtle,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Text input (nom)
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.foreground,
    minHeight: 50,
  },

  // Autocomplete
  autocompleteBox: {
    marginTop: 6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  autocompleteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  autocompleteItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  autocompleteItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.foreground,
  },
  autocompleteItemMeta: {
    fontSize: 11,
    color: Colors.foregroundMuted,
    marginTop: 2,
  },
  sessionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.foregroundMuted,
  },
  autocompleteCreate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  createIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  autocompleteCreateText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.accent,
  },

  // Charge
  chargeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 54,
  },
  chargeBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  chargeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.foregroundMuted,
    letterSpacing: 0.2,
  },
  chargeValueBox: {
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
  },
  chargeInput: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.foreground,
    textAlign: "center",
    minWidth: 60,
    padding: 0,
  },
  chargeUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.foregroundMuted,
  },

  // Stepper row group
  rowGroup: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  rowDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    alignSelf: "stretch",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    backgroundColor: "transparent",
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnPressed: {
    backgroundColor: Colors.border,
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: "300",
    color: Colors.foreground,
    lineHeight: 20,
  },
  stepperValueArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  stepperInput: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.accent,
    textAlign: "center",
    minWidth: 36,
    padding: 0,
  },
  stepperSuffix: {
    fontSize: 12,
    color: Colors.foregroundSubtle,
  },

  // RIR
  rirRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 4,
  },
  rirPill: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  rirPillActive: {
    backgroundColor: Colors.accent,
  },
  rirPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.foregroundMuted,
  },
  rirPillTextActive: {
    color: "#FFFFFF",
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  ctaBtn: {
    borderRadius: BorderRadius.action,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaBtnActive: {
    backgroundColor: Colors.emotional,
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ctaBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  ctaBtnTextDisabled: {
    color: Colors.foregroundSubtle,
  },
  deleteBtn: {
    borderRadius: BorderRadius.input,
    borderWidth: 1.5,
    borderColor: Colors.error + "40",
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.error,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
