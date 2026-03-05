import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { Colors, BorderRadius } from '@/theme/colors';

interface PRBadgeProps {
  visible: boolean;
  value?: string;
}

export function PRBadge({ visible, value }: PRBadgeProps) {
  const haptics = useHaptics();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1.0, { duration: 300 }),
      );
      opacity.value = withTiming(1, { duration: 200 });
      haptics.success();
    } else {
      scale.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const label = value ? `🏆 PR — ${value}` : '🏆 PR';

  return (
    <Animated.View
      style={[
        animStyle,
        {
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: BorderRadius.action,
          borderWidth: 1,
          borderColor: `${Colors.achievement}66`,
          backgroundColor: `${Colors.achievement}26`,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: Colors.achievement,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

export function PRGlow({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 2400 }),
        withTiming(0, { duration: 300 }),
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        glowStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `${Colors.achievement}0F`,
        },
      ]}
    />
  );
}
