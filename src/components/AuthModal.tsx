import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { signUp, signInWithPassword, signOut } from "@/lib/cloudStorage";
import { Colors } from "@/theme/colors";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail?: string;
  onAuthChange: () => void;
}

export default function AuthModal({
  visible,
  onClose,
  userEmail,
  onAuthChange,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
    setMode("signin");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");

    const result =
      mode === "signup"
        ? await signUp(email.trim(), password)
        : await signInWithPassword(email.trim(), password);

    if (result.success) {
      onAuthChange();
      resetForm();
      onClose();
    } else {
      setError(result.error || "Erreur d'authentification");
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
    onAuthChange();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <Pressable className="flex-1 bg-black/60" onPress={handleClose} />

        <View className="bg-surface rounded-t-3xl border-t border-border">
          {/* Handle */}
          <View className="w-10 h-1 bg-border rounded-full self-center mt-3 mb-5" />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          >
            {userEmail ? (
              /* ── Connected state ─────────────────────────── */
              <View className="items-center py-4 gap-3">
                <View className="w-16 h-16 rounded-full bg-success/10 items-center justify-center mb-1">
                  <Text className="text-3xl">✓</Text>
                </View>
                <Text className="text-foreground text-xl font-bold">Connecté</Text>
                <Text className="text-foreground-muted text-sm">{userEmail}</Text>
                <Text className="text-foreground-muted text-xs text-center mt-1">
                  Vos données sont automatiquement sauvegardées dans le cloud.
                </Text>

                <Pressable
                  onPress={handleSignOut}
                  disabled={loading}
                  className="w-full mt-4 py-4 rounded-xl bg-surface-elevated border border-border items-center active:opacity-70"
                >
                  {loading ? (
                    <ActivityIndicator color="#9CA3AF" />
                  ) : (
                    <Text className="text-foreground font-medium">Se déconnecter</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              /* ── Sign in / sign up form ──────────────────── */
              <>
                {/* Tabs */}
                <View className="flex-row bg-background p-1 rounded-xl mb-6 border border-border/50">
                  {(["signin", "signup"] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => {
                        setMode(m);
                        setError("");
                      }}
                      className={`flex-1 py-2.5 rounded-lg items-center ${
                        mode === m ? "bg-primary" : ""
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          mode === m ? "text-white" : "text-foreground-muted"
                        }`}
                      >
                        {m === "signin" ? "Se connecter" : "Créer un compte"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Email */}
                <Text className="text-foreground-muted text-[11px] uppercase tracking-wider mb-2">
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.foregroundSubtle}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-background border border-border rounded-xl px-4 py-3.5 text-foreground mb-4"
                />

                {/* Password */}
                <Text className="text-foreground-muted text-[11px] uppercase tracking-wider mb-2">
                  Mot de passe
                </Text>
                <View className="relative mb-1">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.foregroundSubtle}
                    secureTextEntry={!showPassword}
                    className="bg-background border border-border rounded-xl px-4 py-3.5 text-foreground"
                    style={{ paddingRight: 52 }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-3.5 p-1"
                  >
                    <Text className="text-foreground-muted text-base">
                      {showPassword ? "🙈" : "👁️"}
                    </Text>
                  </Pressable>
                </View>
                {mode === "signup" && (
                  <Text className="text-foreground-muted text-xs mt-1 mb-4">
                    Minimum 6 caractères
                  </Text>
                )}

                {/* Error */}
                {error ? (
                  <View className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 mt-3 mb-1">
                    <Text className="text-error text-sm">{error}</Text>
                  </View>
                ) : (
                  <View className="h-4" />
                )}

                {/* Submit */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading || !email.trim() || !password}
                  className="mt-3 py-4 rounded-xl bg-primary items-center active:opacity-80"
                  style={{ opacity: loading || !email.trim() || !password ? 0.5 : 1 }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold">
                      {mode === "signin" ? "Se connecter" : "Créer mon compte"}
                    </Text>
                  )}
                </Pressable>

                <Text className="text-foreground-muted text-xs text-center mt-4">
                  {mode === "signin"
                    ? "Vos données sont sécurisées et synchronisées dans le cloud"
                    : "Vos données seront automatiquement sauvegardées"}
                </Text>
              </>
            )}

            {/* Close */}
            <Pressable onPress={handleClose} className="mt-4 py-3 items-center">
              <Text className="text-foreground-muted text-sm">Fermer</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
