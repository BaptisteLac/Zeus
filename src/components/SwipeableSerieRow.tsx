/**
 * SwipeableSerieRow — Swipe vers la droite pour valider une série
 * Phase 8: Gestures & Swipe-to-Done
 *
 * Fonctionne entièrement sur le UI thread — zéro passage par le thread JS
 * pendant le geste (react-native-gesture-handler + reanimated worklets).
 *
 * Structure visuelle :
 *   ┌─────────────────────────────────────────────┐
 *   │ [fond emotional + ✓]  ← révélé par le swipe│
 *   │ ┌─────────────────────────────────────────┐ │
 *   │ │         foreground ({children})         │ │ ← se translate →
 *   │ └─────────────────────────────────────────┘ │
 *   └─────────────────────────────────────────────┘
 *
 * Seuil : 40% de la largeur du composant.
 * En dessous → retour élastique. Au-dessus → onComplete() + haptique Medium.
 *
 * Compatibilité ScrollView :
 *   activeOffsetX([10, Infinity]) → s'active uniquement sur swipe droite > 10px
 *   failOffsetY([-15, 15])        → échoue si vertical > 15px (laisse le scroll)
 *
 * Usage :
 *   <SwipeableSerieRow onComplete={() => validateSet(i)} disabled={isDone}>
 *     <SerieChip ... />
 *   </SwipeableSerieRow>
 */

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface SwipeableSerieRowProps {
  children: React.ReactNode;
  /** Appelé quand le seuil de 40% est atteint — parent met à jour isDone */
  onComplete: () => void;
  /** Désactive le geste (série déjà validée, chargement…) */
  disabled?: boolean;
  /** Style du conteneur principal */
  style?: ViewStyle;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Seuil minimum de déplacement horizontal (px) pour activer le gesture */
const ACTIVATION_THRESHOLD_PX = 10;
/** Déplacement vertical max (px) avant que le gesture échoue (laisse le scroll) */
const VERTICAL_FAIL_THRESHOLD_PX = 15;
/** Fraction de la largeur à atteindre pour valider */
const COMPLETE_RATIO = 0.4;

const SPRING_RETURN = { damping: 22, stiffness: 320 } as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function SwipeableSerieRow({
  children,
  onComplete,
  disabled = false,
  style,
}: SwipeableSerieRowProps) {
  const haptics = useHaptics();

  // Largeur du composant mesurée via onLayout (JS) → shared value (UI thread)
  const rowWidth = useSharedValue(0);
  // Translation courante du foreground
  const translateX = useSharedValue(0);
  // Scale de la coche pour l'animation de complétion
  const checkScale = useSharedValue(1);

  // ─── Callback JS — appelé depuis le UI thread via runOnJS ─────────────────
  const triggerComplete = useCallback(() => {
    haptics.medium();
    onComplete();
  }, [haptics, onComplete]);

  // ─── Gesture Pan ──────────────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .enabled(!disabled)
    // S'active uniquement sur swipe droite (> ACTIVATION_THRESHOLD_PX en X)
    .activeOffsetX([ACTIVATION_THRESHOLD_PX, Infinity])
    // Échoue si mouvement vertical > seuil → laisse ScrollView gérer
    .failOffsetY([-VERTICAL_FAIL_THRESHOLD_PX, VERTICAL_FAIL_THRESHOLD_PX])
    .onUpdate((e) => {
      'worklet';
      // Restreint au sens droit — ignore le swipe gauche
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd(() => {
      'worklet';
      const threshold = rowWidth.value * COMPLETE_RATIO;

      if (translateX.value >= threshold) {
        // ── Seuil atteint : animation de complétion ──────────────────────

        // Coche : scale-in (0.8→1.5→1) pendant le retour du foreground
        checkScale.value = withSequence(
          withTiming(1.5, { duration: 150 }),
          withSpring(1, { damping: 10, stiffness: 200 }),
        );

        // Foreground : retour élastique rapide
        translateX.value = withSpring(0, { damping: 25, stiffness: 250 });

        // Callback JS : haptique + mise à jour parent
        runOnJS(triggerComplete)();
      } else {
        // ── Sous le seuil : retour élastique sans action ─────────────────
        translateX.value = withSpring(0, SPRING_RETURN);
      }
    });

  // ─── Styles animés ────────────────────────────────────────────────────────

  /** Foreground : se déplace vers la droite */
  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  /**
   * Fond emotional + coche : opacity proportionnelle au progress (0→1).
   * 0% swipe = invisible, 100% du seuil = pleinement visible.
   */
  const backgroundStyle = useAnimatedStyle(() => {
    const progress =
      rowWidth.value > 0
        ? Math.min(translateX.value / (rowWidth.value * COMPLETE_RATIO), 1)
        : 0;
    return { opacity: progress };
  });

  /**
   * Coche : opacity identique au background + scale animé à la complétion.
   */
  const checkmarkStyle = useAnimatedStyle(() => {
    const progress =
      rowWidth.value > 0
        ? Math.min(translateX.value / (rowWidth.value * COMPLETE_RATIO), 1)
        : 0;
    return {
      opacity: progress,
      transform: [{ scale: checkScale.value }],
    };
  });

  // ─── onLayout ─────────────────────────────────────────────────────────────
  // Mesure la largeur réelle du composant pour calculer le seuil.
  // Tourne sur le JS thread mais met à jour un shared value (safe).
  const onLayout = (e: LayoutChangeEvent) => {
    rowWidth.value = e.nativeEvent.layout.width;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Animated.View
      onLayout={onLayout}
      style={[{ position: 'relative', overflow: 'hidden' }, style]}
    >
      {/* ── Fond emotional — révélé progressivement par le swipe ─────────── */}
      <Animated.View
        pointerEvents="none"
        style={[
          backgroundStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.emotional,
            // Aligne la coche à gauche — c'est l'aire révélée en premier
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingLeft: 20,
            borderRadius: 12,
          },
        ]}
      >
        {/* Coche — apparaît progressivement, se scale-in à la complétion */}
        <Animated.Text
          style={[
            checkmarkStyle,
            {
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: '700',
              lineHeight: 24,
            },
          ]}
        >
          ✓
        </Animated.Text>
      </Animated.View>

      {/* ── Foreground — contenu de la ligne, se translate vers la droite ── */}
      <GestureDetector gesture={pan}>
        <Animated.View style={foregroundStyle}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
