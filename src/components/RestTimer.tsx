import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RestTimerProps {
  initialSeconds: number;
  onDismiss: () => void;
  onComplete?: () => void;
}

export default function RestTimer({
  initialSeconds,
  onDismiss,
  onComplete,
}: RestTimerProps) {
  const insets = useSafeAreaInsets();
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const overtimeRef = useRef(false);
  const expand = useSharedValue(0);

  // Reset when a new timer starts
  useEffect(() => {
    setRemaining(initialSeconds);
    setIsOvertime(false);
    overtimeRef.current = false;
  }, [initialSeconds]);

  // Countdown
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1 && !overtimeRef.current) {
          overtimeRef.current = true;
          setIsOvertime(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onComplete]);

  // Expand animation
  useEffect(() => {
    expand.value = withSpring(isExpanded ? 1 : 0, { damping: 18, stiffness: 220 });
  }, [isExpanded]);

  const pillStyle = useAnimatedStyle(() => ({
    width: interpolate(expand.value, [0, 1], [110, 190]),
    height: interpolate(expand.value, [0, 1], [38, 52]),
    borderRadius: 99,
  }));

  const timeStyle = useAnimatedStyle(() => ({
    fontSize: interpolate(expand.value, [0, 1], [14, 22]),
  }));

  const absRemaining = Math.abs(remaining);
  const mins = Math.floor(absRemaining / 60);
  const secs = absRemaining % 60;
  const timeDisplay = `${mins}:${String(secs).padStart(2, "0")}`;

  return (
    <View
      pointerEvents="box-none"
      style={[
        StyleSheet.absoluteFillObject,
        { top: insets.top + 8, zIndex: 100, alignItems: "center" },
      ]}
    >
      <Pressable onPress={() => setIsExpanded((v) => !v)}>
        <Animated.View
          style={[
            pillStyle,
            {
              backgroundColor: "rgba(10,10,10,0.92)",
              borderWidth: 1,
              borderColor: isOvertime ? "rgba(220,50,50,0.4)" : "rgba(255,255,255,0.1)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              gap: 8,
              paddingHorizontal: 14,
            },
          ]}
        >
          {/* Status dot */}
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isOvertime ? "#DC2626" : "#22C55E",
            }}
          />

          {/* Time */}
          <Animated.Text
            style={[
              timeStyle,
              {
                fontVariant: ["tabular-nums"],
                fontWeight: "500",
                color: isOvertime ? "#DC2626" : "#FFFFFF",
                letterSpacing: 2,
              },
            ]}
          >
            {timeDisplay}
          </Animated.Text>

          {/* Dismiss — only when expanded */}
          {isExpanded && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onDismiss();
              }}
              hitSlop={8}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14, lineHeight: 14 }}>✕</Text>
            </Pressable>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}
