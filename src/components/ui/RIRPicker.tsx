/**
 * RIRPicker — Mode B de saisie : roue de sélection en bottom sheet
 * Phase 5: Saisie numérique
 *
 * Pattern identique à OptionsSheet.tsx (Modal + reanimated).
 * Aucun BottomSheetModalProvider requis dans _layout.tsx.
 *
 * Usage :
 *   const [rir, setRir] = useState(1);
 *   const [open, setOpen] = useState(false);
 *
 *   <Pressable onPress={() => setOpen(true)}>
 *     <Text>RIR {rir}</Text>
 *   </Pressable>
 *   <RIRPicker
 *     value={rir}
 *     onChange={setRir}
 *     items={RIR_ITEMS}
 *     visible={open}
 *     onClose={() => setOpen(false)}
 *     label="RIR Ressenti"
 *   />
 *
 * Items prédéfinis exportés :
 *   RIR_ITEMS   — RIR 0 à RIR 5
 */

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
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';

// ─── Items prédéfinis ─────────────────────────────────────────────────────────

export interface PickerItem {
  label: string;
  value: number;
}

export const RIR_ITEMS: PickerItem[] = [0, 1, 2, 3, 4, 5].map((v) => ({
  label: `RIR ${v}`,
  value: v,
}));

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Mêmes animations que OptionsSheet.tsx
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
        {/* Backdrop — tap pour fermer */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0,0,0.6)' },
              backdropStyle,
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={[sheetStyle, { paddingBottom: Math.max(insets.bottom, 16) }]}
          className="bg-surface-elevated rounded-t-3xl"
        >
          {/* Handle */}
          <View className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />

          {/* Label */}
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

          {/* Picker wheel — UIPickerView sur iOS, Spinner sur Android */}
          <View
            style={{
              backgroundColor: Colors.surfaceElevated,
              overflow: 'hidden',
            }}
          >
            <Picker<number>
              selectedValue={value}
              onValueChange={(itemValue) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(itemValue);
              }}
              // itemStyle : iOS uniquement — définit la typo de la roue
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
                  // color fonctionne sur Android pour le texte de chaque item
                  color={Colors.foreground}
                />
              ))}
            </Picker>
          </View>

          {/* Bouton Confirmer — style primary (Phase 2) */}
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
              style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}
            >
              Confirmer
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
