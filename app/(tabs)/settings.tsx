import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadState, saveState, resetState, computeBlock } from "@/lib/storage";
import { getCurrentUser, onAuthStateChange } from "@/lib/cloudStorage";
import { AppState } from "@/lib/types";
import AuthModal from "@/components/AuthModal";

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-foreground-muted text-[11px] uppercase tracking-wider px-5 mb-2 mt-5">
      {label}
    </Text>
  );
}

function Row({
  label,
  value,
  onPress,
  destructive,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between px-5 py-4 active:bg-white/5"
    >
      <Text className={`text-base ${destructive ? "text-error" : "text-foreground"}`}>
        {label}
      </Text>
      {value !== undefined && (
        <Text className="text-foreground-muted text-sm">{value}</Text>
      )}
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-border/50 mx-5" />;
}

export default function SettingsScreen() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    Promise.all([loadState(), getCurrentUser()]).then(([state, user]) => {
      setAppState(state);
      setUserEmail(user?.email);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = onAuthStateChange((_authenticated, email) => {
      setUserEmail(email);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert(
      "Réinitialiser le programme ?",
      "Toutes les données et l'historique seront définitivement perdus. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: async () => {
            resetState();
            const fresh = await loadState();
            setAppState(fresh);
          },
        },
      ]
    );
  }, []);

  const handleChangeBlock = useCallback(
    (block: 1 | 2 | 3) => {
      if (!appState) return;
      Alert.alert(`Passer au Bloc ${block} ?`, "La progression sera recalculée.", [
        { text: "Annuler", style: "cancel" },
        {
          text: `Bloc ${block}`,
          onPress: () => {
            const updated = { ...appState, currentBlock: block };
            saveState(updated);
            setAppState(updated);
          },
        },
      ]);
    },
    [appState]
  );

  if (loading || !appState) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#C0694A" />
      </View>
    );
  }

  const { block, week } = computeBlock(appState.programStartDate);
  const startDate = new Date(appState.programStartDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const totalEntries = Object.values(appState.workoutData).reduce(
    (a, v) => a + v.length,
    0
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"] as const}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-5 pb-3 border-b border-border/50">
          <Text className="text-foreground text-3xl font-bold tracking-tight">
            Réglages
          </Text>
        </View>

        {/* Compte */}
        <SectionLabel label="Compte" />
        <View className="bg-surface rounded-2xl mx-4 overflow-hidden border border-border">
          <Row
            label={userEmail ?? "Se connecter"}
            value={userEmail ? "Connecté ●" : "→"}
            onPress={handleAuth}
          />
        </View>

        {/* Programme */}
        <SectionLabel label="Programme" />
        <View className="bg-surface rounded-2xl mx-4 overflow-hidden border border-border">
          <Row label="Date de début" value={startDate} />
          <Divider />
          <Row label="Progression" value={`Bloc ${block} · S${week}`} />
          <Divider />
          <View className="px-5 py-3">
            <Text className="text-foreground-muted text-[11px] uppercase tracking-wider mb-2">
              Changer de bloc
            </Text>
            <View className="flex-row gap-2">
              {([1, 2, 3] as const).map((b) => (
                <Pressable
                  key={b}
                  onPress={() => handleChangeBlock(b)}
                  className={`flex-1 py-2.5 rounded-xl items-center ${
                    appState.currentBlock === b
                      ? "bg-primary"
                      : "bg-background border border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      appState.currentBlock === b ? "text-white" : "text-foreground-muted"
                    }`}
                  >
                    Bloc {b}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Données */}
        <SectionLabel label="Données" />
        <View className="bg-surface rounded-2xl mx-4 overflow-hidden border border-border">
          <Row label="Entrées enregistrées" value={`${totalEntries}`} />
          <Divider />
          <Row
            label="Réinitialiser toutes les données"
            onPress={handleReset}
            destructive
          />
        </View>

        {/* À propos */}
        <SectionLabel label="À propos" />
        <View className="bg-surface rounded-2xl mx-4 overflow-hidden border border-border mb-10">
          <Row label="Zeus — Tracker musculation" value="v1.0" />
        </View>
      </ScrollView>

      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        userEmail={userEmail}
        onAuthChange={() => {
          getCurrentUser().then((user) => setUserEmail(user?.email ?? undefined));
        }}
      />
    </SafeAreaView>
  );
}
