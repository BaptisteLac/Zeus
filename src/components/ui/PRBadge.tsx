/**
 * PRBadge — Badge animé de record personnel
 * Phase 7: Système émotionnel
 *
 * Composant standalone réutilisable. La version inline dans ExerciseCard
 * (Phase 4) coexiste — ce composant est destiné à remplacer l'inline
 * lors de la migration de ExerciseCard (cascade change non effectué ici).
 *
 * Animation : scale 0 → 1.2 → 1 en 600ms (spec Phase 4 + 7)
 * Haptique   : haptics.success() au déclenchement
 * Couleur    : achievement (#FF8C42)
 *
 * Usage :
 *   <PRBadge visible={isPR} value="102.5 kg" />
 *
 * Le composant est TOUJOURS monté (pas de conditional render).
 * La visibilité est gérée par l'animation scale + opacity.
 * Cela évite de perdre l'état d'animation lors de re-renders.
 */

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface PRBadgeProps {
  /** Déclenche l'animation et le feedback quand passe de false → true */
  visible: boolean;
  /**
   * Valeur affichée après "PR". Ex: "102.5 kg"
   * Si omis, affiche juste "🏆 PR"
   */
  value?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PRBadge({ visible, value }: PRBadgeProps) {
  const haptics = useHaptics();

  // scale + opacity partagés — scale 0 = invisible, évite "placeholder" layout
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Scale 0 → 1.2 → 1 en 600ms total (spec Phase 4 & 7)
      scale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1.0, { duration: 300 }),
      );
      opacity.value = withTiming(1, { duration: 200 });
      // Feedback haptique via hook centralisé
      haptics.success();
    } else {
      // Reset silencieux (ex: nouveau timer = nouveau PR potentiel)
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
          borderColor: `${Colors.achievement}66`, // 40% opacity
          backgroundColor: `${Colors.achievement}26`, // 15% opacity
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

// ─── Glow helper ─────────────────────────────────────────────────────────────
/**
 * PRGlow — Overlay de fond achievement à 6% opacity pendant 3s.
 * À poser en absolute inset-0 dans la carte parente.
 * Disparaît automatiquement après 3s.
 *
 * Usage :
 *   <View style={{ position: 'relative' }}>
 *     <PRGlow visible={isPR} />
 *     {/* contenu de la carte *\/}
 *   </View>
 */
export function PRGlow({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Apparaît en 300ms, disparaît après 2.4s de maintien + 300ms fade-out
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 2400 }), // hold
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
          // achievement à 6% opacity
          backgroundColor: `${Colors.achievement}0F`,
        },
      ]}
    />
  );
}
