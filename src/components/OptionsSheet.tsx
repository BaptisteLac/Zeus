import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useEffect } from "react";

interface OptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  onEdit: () => void;
  onDelete?: () => void;
}

export function OptionsSheet({
  visible,
  onClose,
  title,
  onEdit,
  onDelete,
}: OptionsSheetProps) {
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 280 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(300, { duration: 240 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} className="justify-end">
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }, backdropStyle]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={sheetStyle}
          className="bg-surface rounded-t-3xl px-6 pb-10 pt-3"
        >
          {/* Handle */}
          <View className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

          {/* Title */}
          <Text className="text-foreground text-2xl font-semibold mb-1">{title}</Text>
          <Text className="text-foreground-muted text-sm mb-6">Gérer cet exercice</Text>

          {/* Actions */}
          <View className="gap-3">
            <Pressable
              onPress={() => {
                onClose();
                // iOS ne peut pas présenter un nouveau modal pendant qu'un autre
                // se dismisse. On attend la fin de l'animation de fermeture (~300ms).
                setTimeout(() => onEdit(), 350);
              }}
              className="flex-row items-center gap-4 bg-surface-elevated rounded-2xl px-4 py-4 active:opacity-70"
            >
              <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-primary text-base">✏️</Text>
              </View>
              <Text className="text-foreground font-medium text-base">
                Modifier l'exercice
              </Text>
            </Pressable>

            {onDelete && (
              <Pressable
                onPress={() => {
                  onClose();
                  onDelete();
                }}
                className="flex-row items-center gap-4 bg-error/5 rounded-2xl px-4 py-4 active:opacity-70 border border-error/10"
              >
                <View className="w-9 h-9 rounded-full bg-error/10 items-center justify-center">
                  <Text className="text-base">🗑️</Text>
                </View>
                <Text className="text-error font-medium text-base">
                  Supprimer l'exercice
                </Text>
              </Pressable>
            )}
          </View>

          {/* Cancel */}
          <Pressable
            onPress={onClose}
            className="mt-4 py-4 items-center active:opacity-50"
          >
            <Text className="text-foreground-muted font-medium">Annuler</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
