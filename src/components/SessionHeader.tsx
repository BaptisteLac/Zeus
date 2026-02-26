import { View, Text, Pressable, Modal, TouchableWithoutFeedback } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { SessionType } from "@/lib/types";

interface SessionHeaderProps {
  session: SessionType;
  block: 1 | 2 | 3;
  week: number;
  completedCount: number;
  totalCount: number;
  onChangeSession: (session: SessionType) => void;
  userEmail?: string;
  onAuthClick?: () => void;
}

const DAYS_FR = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];

export default function SessionHeader({
  session,
  block,
  week,
  completedCount,
  totalCount,
  onChangeSession,
  userEmail,
  onAuthClick,
}: SessionHeaderProps) {
  const insets = useSafeAreaInsets();
  const [showPicker, setShowPicker] = useState(false);

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const now = new Date();
  const dayStr = DAYS_FR[now.getDay()];
  const dayNum = now.getDate();
  const dateStr = `${dayStr} ${dayNum}`;

  return (
    <>
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="bg-background/90 border-b border-border/50"
      >
        <View className="px-5 pb-3 flex-row items-end justify-between">
          {/* Left: date + session selector */}
          <View>
            <Text className="text-primary text-[11px] font-semibold tracking-[0.12em] uppercase mb-1">
              {dateStr} · Bloc {block} · S{week}
            </Text>

            <Pressable
              onPress={() => setShowPicker(true)}
              className="flex-row items-center gap-2 active:opacity-70"
            >
              <Text className="text-foreground text-3xl font-bold tracking-tight">
                Séance {session}
              </Text>
              <View className="w-6 h-6 rounded-full bg-surface-elevated border border-border items-center justify-center mt-1">
                <Text className="text-foreground-muted text-xs">⌄</Text>
              </View>
            </Pressable>
          </View>

          {/* Right: progress + auth */}
          <View className="flex-row items-center gap-3 pb-1">
            {totalCount > 0 && (
              <View className="px-3 py-1.5 rounded-full bg-surface-elevated border border-border">
                <Text className="text-foreground text-xs font-mono font-medium">
                  {completedCount}/{totalCount}
                </Text>
              </View>
            )}

            {onAuthClick && (
              <Pressable
                onPress={onAuthClick}
                className="active:scale-90"
                hitSlop={8}
              >
                {userEmail ? (
                  <View className="relative">
                    <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                      <Text className="text-white font-bold text-sm">
                        {userEmail.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background"
                    />
                  </View>
                ) : (
                  <View className="w-10 h-10 rounded-full bg-surface-elevated border border-border items-center justify-center">
                    <Text className="text-foreground text-base">👤</Text>
                  </View>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View className="h-0.5 bg-surface">
          <View
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Session picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
          <View className="flex-1 bg-black/60 justify-start" style={{ paddingTop: insets.top + 80 }}>
            <View className="mx-5 bg-surface-elevated rounded-2xl overflow-hidden border border-border">
              {(["A", "B", "C"] as SessionType[]).map((s, i) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    onChangeSession(s);
                    setShowPicker(false);
                  }}
                  className={`px-5 py-4 flex-row items-center justify-between active:bg-white/5 ${i < 2 ? "border-b border-border" : ""
                    }`}
                >
                  <Text
                    className={`font-medium text-base ${session === s ? "text-primary" : "text-foreground"
                      }`}
                  >
                    Séance {s}
                  </Text>
                  {session === s && (
                    <View className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
  );
}
