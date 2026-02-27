import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/theme/colors';
import { useHaptics } from '@/hooks/useHaptics';

interface ChargeStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

// ─── StepButton ───────────────────────────────────────────────────────────────
// flex:1 est dans useAnimatedStyle → l'Animated.View est un enfant flex direct
// du row parent, sans wrapper intermédiaire qui casserait la résolution de taille.

interface StepButtonProps {
  label: string;
  onPress: () => void;
}

function StepButton({ label, onPress }: StepButtonProps) {
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  // flex:1 ICI → l'Animated.View participe au layout flex du parent row
  const animStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.88, { duration: 70 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    haptics.light();
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      {/*
       * Pressable sans width explicite → React Native l'étire automatiquement
       * à la largeur de son parent (Animated.View flex:1 dans un row).
       * height:52 fixe l'axe vertical.
       */}
      <Pressable
        onPress={handlePress}
        hitSlop={6}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: 14,
          backgroundColor: pressed ? Colors.surfaceElevated : Colors.surface,
          borderWidth: 1,
          borderColor: pressed ? Colors.accent + '60' : Colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: Colors.foregroundMuted,
            letterSpacing: 0.3,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── ChargeStepper ────────────────────────────────────────────────────────────

export function ChargeStepper({
  value,
  onChange,
  step = 2.5,
  min = 0,
  max = 500,
}: ChargeStepperProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');

  const adjust = (delta: number) => {
    const next = Math.round((value + delta) * 10) / 10;
    onChange(Math.min(max, Math.max(min, next)));
  };

  const commit = (text: string) => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  const displayValue = value > 0 ? String(value) : '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* ── Bouton − : Animated.View flex:1 direct dans le row ── */}
      <StepButton
        label={`−${step} kg`}
        onPress={() => adjust(-step)}
      />

      {/* ── Valeur centrale : flex:1, height:52 explicite ── */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={{ flex: 1, height: 52 }}
        hitSlop={4}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: focused ? Colors.accent : Colors.border,
            backgroundColor: focused ? Colors.surfaceElevated : Colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 8,
          }}
        >
          <TextInput
            ref={inputRef}
            value={focused ? raw : displayValue}
            onChangeText={setRaw}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
            onFocus={() => {
              setFocused(true);
              setRaw(displayValue);
            }}
            onBlur={() => {
              setFocused(false);
              commit(raw);
            }}
            onSubmitEditing={() => commit(raw)}
            placeholder="0"
            placeholderTextColor={Colors.foregroundSubtle}
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: focused ? Colors.accent : Colors.foreground,
              fontVariant: ['tabular-nums'],
              textAlign: 'center',
              paddingVertical: 0,
              minWidth: 48,
            }}
          />
          {!focused && value > 0 && (
            <Text
              style={{
                fontSize: 13,
                fontWeight: '500',
                color: Colors.foregroundSubtle,
                marginLeft: 4,
              }}
            >
              kg
            </Text>
          )}
        </View>
      </Pressable>

      {/* ── Bouton + : Animated.View flex:1 direct dans le row ── */}
      <StepButton
        label={`+${step} kg`}
        onPress={() => adjust(step)}
      />
    </View>
  );
}
