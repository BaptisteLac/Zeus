/**
 * AdjustButtons — Mode C de saisie : micro-ajustements au-dessus du clavier
 * Phase 5: Saisie numérique
 *
 * Barre de boutons compacts à afficher au-dessus du clavier natif.
 * Utilise useSafeAreaInsets() pour ne pas être masqué par le Home Indicator.
 *
 * Positionnement recommandé par le parent :
 *   - iOS  : wrapper KeyboardAvoidingView behavior="padding", ou InputAccessoryView
 *   - Android : KeyboardAvoidingView behavior="height"
 *
 * Usage (charge + reps) :
 *   <AdjustButtons
 *     adjustments={[
 *       { label: '−2.5', onPress: () => setCharge(c => Math.max(0, c - 2.5)) },
 *       { label: '+2.5', onPress: () => setCharge(c => c + 2.5) },
 *       { label: '+1 rep', onPress: () => updateActiveRep(r => r + 1) },
 *     ]}
 *   />
 *
 * Usage avec ajustements par défaut (charge uniquement) :
 *   <AdjustButtons onDefaultAdjust={(delta) => setCharge(c => c + delta)} />
 */

import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius } from '@/theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Adjustment {
  label: string;
  onPress: () => void;
  /** Optionnel — label accessible pour screen readers */
  accessibilityLabel?: string;
}

interface AdjustButtonsProps {
  adjustments: Adjustment[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdjustButtons({ adjustments }: AdjustButtonsProps) {
  const insets = useSafeAreaInsets();

  const handlePress = (onPress: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        // Safe area : évite que les boutons soient masqués par le Home Indicator
        // Quand le clavier est visible, insets.bottom est généralement 0 sur iOS
        // et la valeur réelle quand le clavier est fermé.
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
            height: 48, // Touch target minimum (Phase 2 / "Invisible Fat Finger")
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
