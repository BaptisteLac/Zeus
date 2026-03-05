import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, BorderRadius } from '@/theme/colors';
import { Typography } from '@/theme/typography';

export type MilestoneType = 'halfway' | 'lastSet' | 'weightImprovement';

interface MilestoneToastProps {
  type: MilestoneType;
  visible: boolean;
  onHide?: () => void;
}

function HalfwayBanner({
  visible,
  onHide,
}: {
  visible: boolean;
  onHide?: () => void;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: 200 });
      return;
    }

    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(3100, withTiming(0, { duration: 600 })),
    );

    const timer = setTimeout(() => onHide?.(), 4000);
    return () => clearTimeout(timer);
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animStyle,
        {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: BorderRadius.card,
          borderLeftWidth: 3,
          borderLeftColor: Colors.emotional,
          backgroundColor: `${Colors.emotional}14`,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
      ]}
    >
      <Text style={{ fontSize: 14 }}>🔥</Text>
      <Text
        style={[
          Typography.body,
          {
            color: Colors.emotional,
            fontWeight: '500',
            flex: 1,
          },
        ]}
      >
        Mi-chemin. Continue.
      </Text>
    </Animated.View>
  );
}

function LastSetTag({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: BorderRadius.action,
          borderWidth: 1,
          borderColor: `${Colors.accent}4D`,
          backgroundColor: `${Colors.accent}1A`,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: Colors.accent,
          letterSpacing: 0.5,
        }}
      >
        Dernière série
      </Text>
    </Animated.View>
  );
}

function WeightArrow({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={{ justifyContent: 'center' }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: Colors.accent,
          lineHeight: 16,
        }}
        accessibilityLabel="Amélioration de charge"
      >
        ↑
      </Text>
    </View>
  );
}

export function MilestoneToast({ type, visible, onHide }: MilestoneToastProps) {
  switch (type) {
    case 'halfway':
      return <HalfwayBanner visible={visible} onHide={onHide} />;
    case 'lastSet':
      return <LastSetTag visible={visible} />;
    case 'weightImprovement':
      return <WeightArrow visible={visible} />;
  }
}
