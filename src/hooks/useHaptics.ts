import { useRef } from 'react';
import * as Haptics from 'expo-haptics';

export interface HapticFunctions {
  light: () => Promise<void>;
  medium: () => Promise<void>;
  heavy: () => Promise<void>;
  success: () => Promise<void>;
  error: () => Promise<void>;
  warning: () => Promise<void>;
}

export function useHaptics(): HapticFunctions {
  const ref = useRef<HapticFunctions>({
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    success: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    error: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    warning: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  });

  return ref.current;
}
