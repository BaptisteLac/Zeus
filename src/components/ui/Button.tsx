import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Colors, BorderRadius } from '@/theme/colors';
import { useHaptics } from '@/hooks/useHaptics';

const PRIMARY_PRESSED_BG = Colors.emotionalPressed;

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  variant?: ButtonVariant;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  label,
  onPress,
  disabled = false,
  loading = false,
}: ButtonProps) {
  const haptics = useHaptics();
  const handlePress = () => {
    haptics.light();
    onPress();
  };

  // ─── Ghost ───────────────────────────────────────────────────────────────
  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        hitSlop={30}
      >
        {({ pressed }) => (
          <Text
            style={{
              color: disabled
                ? Colors.foregroundSubtle
                : pressed
                ? Colors.foreground
                : Colors.foregroundMuted,
              opacity: pressed ? 0.7 : 1,
              fontSize: 15,
              fontWeight: '400',
            }}
          >
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  // ─── Primary & Secondary ─────────────────────────────────────────────────
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      hitSlop={8}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 48,
            paddingHorizontal: 24,
            borderRadius: BorderRadius.action,
            opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
            backgroundColor: isPrimary
              ? pressed
                ? PRIMARY_PRESSED_BG
                : Colors.emotional
              : pressed
              ? Colors.surfaceElevated
              : Colors.surface,
            ...(isPrimary
              ? {}
              : { borderWidth: 1, borderColor: Colors.border }),
          }}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isPrimary ? Colors.foreground : Colors.foreground}
            />
          ) : (
            <Text
              style={{
                color: isPrimary ? Colors.foreground : Colors.foreground,
                fontSize: 16,
                fontWeight: isPrimary ? '700' : '500',
                letterSpacing: 0.3,
              }}
            >
              {label}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
