import React, { useCallback } from 'react';
import { LayoutChangeEvent, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { Colors } from '@/theme/colors';

interface SwipeableSerieRowProps {
  children: React.ReactNode;
  /** Swipe droite→gauche : valider la série */
  onComplete?: () => void;
  /** Swipe gauche→droite : supprimer la série */
  onDelete?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const ACTIVATE_X = 10;
const FAIL_Y = 15;
const COMPLETE_RATIO = 0.38;
const SPRING_RETURN = { damping: 22, stiffness: 320 } as const;

export function SwipeableSerieRow({
  children,
  onComplete,
  onDelete,
  disabled = false,
  style,
}: SwipeableSerieRowProps) {
  const haptics = useHaptics();

  const rowWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  const checkScale = useSharedValue(1);
  const trashScale = useSharedValue(1);

  const triggerComplete = useCallback(() => {
    haptics.medium();
    onComplete?.();
  }, [haptics, onComplete]);

  const triggerDelete = useCallback(() => {
    haptics.heavy();
    onDelete?.();
  }, [haptics, onDelete]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-ACTIVATE_X, ACTIVATE_X])
    .failOffsetY([-FAIL_Y, FAIL_Y])
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      'worklet';
      const threshold = rowWidth.value * COMPLETE_RATIO;

      if (translateX.value <= -threshold && onComplete) {
        checkScale.value = withSequence(
          withTiming(1.5, { duration: 150 }),
          withSpring(1, { damping: 10, stiffness: 200 }),
        );
        translateX.value = withSpring(0, { damping: 25, stiffness: 250 });
        runOnJS(triggerComplete)();
      } else if (translateX.value >= threshold && onDelete) {
        trashScale.value = withSequence(
          withTiming(1.4, { duration: 120 }),
          withSpring(1, { damping: 10, stiffness: 200 }),
        );
        translateX.value = withSpring(0, { damping: 25, stiffness: 250 });
        runOnJS(triggerDelete)();
      } else {
        translateX.value = withSpring(0, SPRING_RETURN);
      }
    });

  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const successBgStyle = useAnimatedStyle(() => {
    const progress =
      rowWidth.value > 0
        ? Math.min((-translateX.value) / (rowWidth.value * COMPLETE_RATIO), 1)
        : 0;
    return { opacity: Math.max(0, progress) };
  });

  const checkmarkStyle = useAnimatedStyle(() => {
    const progress =
      rowWidth.value > 0
        ? Math.min((-translateX.value) / (rowWidth.value * COMPLETE_RATIO), 1)
        : 0;
    return {
      opacity: Math.max(0, progress),
      transform: [{ scale: checkScale.value }],
    };
  });

  const errorBgStyle = useAnimatedStyle(() => {
    const progress =
      rowWidth.value > 0
        ? Math.min(translateX.value / (rowWidth.value * COMPLETE_RATIO), 1)
        : 0;
    return { opacity: Math.max(0, progress) };
  });

  const trashStyle = useAnimatedStyle(() => {
    const progress =
      rowWidth.value > 0
        ? Math.min(translateX.value / (rowWidth.value * COMPLETE_RATIO), 1)
        : 0;
    return {
      opacity: Math.max(0, progress),
      transform: [{ scale: trashScale.value }],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    rowWidth.value = e.nativeEvent.layout.width;
  };

  return (
    <Animated.View
      onLayout={onLayout}
      style={[{ position: 'relative', overflow: 'hidden' }, style]}
    >
      {onDelete && (
        <Animated.View
          pointerEvents="none"
          style={[
            errorBgStyle,
            {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: Colors.error,
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingLeft: 20,
              borderRadius: 12,
            },
          ]}
        >
          <Animated.Text
            style={[
              trashStyle,
              { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 22 },
            ]}
          >
            🗑
          </Animated.Text>
        </Animated.View>
      )}

      {onComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            successBgStyle,
            {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: Colors.success,
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingRight: 20,
              borderRadius: 12,
            },
          ]}
        >
          <Animated.Text
            style={[
              checkmarkStyle,
              { color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 24 },
            ]}
          >
            ✓
          </Animated.Text>
        </Animated.View>
      )}

      <GestureDetector gesture={pan}>
        <Animated.View style={foregroundStyle}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
