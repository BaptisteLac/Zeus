import { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useHaptics } from '@/hooks/useHaptics';

export interface PickerItem {
  label: string;
  value: number;
}

export const RIR_ITEMS: PickerItem[] = [0, 1, 2, 3, 4, 5].map((v) => ({
  label: `RIR ${v}`,
  value: v,
}));

interface RIRPickerProps {
  value: number;
  onChange: (value: number) => void;
  items: PickerItem[];
  visible: boolean;
  onClose: () => void;
  label?: string;
}

export function RIRPicker({
  value,
  onChange,
  items,
  visible,
  onClose,
  label = 'Sélectionner',
}: RIRPickerProps) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 280 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(400, { duration: 240 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFill} className="justify-end">
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0,0,0.6)' },
              backdropStyle,
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}
          className="bg-surface-elevated rounded-t-3xl"
        >
          <View className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />

          <Text
            style={[
              Typography.label,
              {
                textAlign: 'center',
                paddingHorizontal: 24,
                marginBottom: 4,
              },
            ]}
          >
            {label.toUpperCase()}
          </Text>

          <View
            style={{
              backgroundColor: Colors.surfaceElevated,
              overflow: 'hidden',
            }}
          >
            <Picker<number>
              selectedValue={value}
              onValueChange={(itemValue) => {
                haptics.light();
                onChange(itemValue);
              }}
              itemStyle={{
                color: Colors.foreground,
                fontSize: 20,
                fontWeight: '500',
              }}
            >
              {items.map((item) => (
                <Picker.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                  color={Colors.foreground}
                />
              ))}
            </Picker>
          </View>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              marginHorizontal: 24,
              marginTop: 12,
              height: 48,
              borderRadius: 9999,
              backgroundColor: pressed ? Colors.emotionalPressed : Colors.emotional,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{ color: Colors.foreground, fontSize: 16, fontWeight: '700' }}
            >
              Confirmer
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
