import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius } from '@/theme/colors';
import { useHaptics } from '@/hooks/useHaptics';

export interface Adjustment {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

interface AdjustButtonsProps {
  adjustments: Adjustment[];
}

export function AdjustButtons({ adjustments }: AdjustButtonsProps) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const handlePress = (onPress: () => void) => {
    haptics.light();
    onPress();
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
      }}
    >
      {adjustments.map(({ label, onPress, accessibilityLabel }) => (
        <Pressable
          key={label}
          onPress={() => handlePress(onPress)}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flex: 1,
            height: 48,
            borderRadius: BorderRadius.action,
            borderWidth: 1,
            borderColor: Colors.border,
            backgroundColor: pressed ? Colors.surfaceElevated : Colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              color: Colors.foreground,
              fontSize: 15,
              fontWeight: '500',
              letterSpacing: 0.2,
            }}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
