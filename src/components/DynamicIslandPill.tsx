/**
 * DynamicIslandPill — Timer de repos flottant, global, omniprésent
 * Phase 6
 *
 * Rendu dans _layout.tsx au-dessus du Stack de navigation.
 * Toujours monté, jamais démonté. Visibility gérée par animation.
 *
 * 3 états visuels :
 *  - Inactif   → opacity 0, translateY -60 (invisible, non-interactive)
 *  - En cours  → pill compacte, fond surface, bordure accent
 *  - Terminé   → pill pulsée en boucle, couleur emotional
 *
 * Tap → bottom sheet avec contexte complet (exercice, prochaine série, dismiss)
 */

import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimer } from '@/context/TimerContext';
import { Colors, BorderRadius } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { useHaptics } from '@/hooks/useHaptics';

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DynamicIslandPill() {
  const { isActive, duration, startedAt, exerciseName, nextSet, stopTimer } =
    useTimer();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [remaining, setRemaining] = useState(0);
  const [showSheet, setShowSheet] = useState(false);

  const isOvertime = isActive && remaining < 0;

  // ─── Countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || !startedAt) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(duration - elapsed);
    };
    tick(); // Mise à jour immédiate sans attendre 1s
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, startedAt, duration]);

  // ─── Animations pill (show/hide) ────────────────────────────────────────────
  const pillOpacity = useSharedValue(0);
  const pillTranslateY = useSharedValue(-60);

  useEffect(() => {
    if (isActive) {
      pillOpacity.value = withTiming(1, { duration: 280 });
      pillTranslateY.value = withSpring(0, { damping: 18, stiffness: 220 });
    } else {
      pillOpacity.value = withTiming(0, { duration: 200 });
      pillTranslateY.value = withTiming(-60, { duration: 200 });
    }
  }, [isActive]);

  // ─── Animation pulse (repos terminé) ────────────────────────────────────────
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isOvertime) {
      // scale 1→1.05→1 en boucle infinie
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600 }),
          withTiming(1.0, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      // Interrompt withRepeat et revient à 1
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isOvertime]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [
      { translateY: pillTranslateY.value },
      { scale: pulseScale.value },
    ],
  }));

  // ─── Animations sheet ───────────────────────────────────────────────────────
  const sheetTranslateY = useSharedValue(400);
  const sheetOpacity = useSharedValue(0);

  useEffect(() => {
    if (showSheet) {
      sheetOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 280 });
    } else {
      sheetOpacity.value = withTiming(0, { duration: 180 });
      sheetTranslateY.value = withTiming(400, { duration: 240 });
    }
  }, [showSheet]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handlePillTap = () => {
    haptics.light();
    setShowSheet(true);
  };

  const handleDismiss = () => {
    stopTimer();
    setShowSheet(false);
    haptics.medium();
  };

  // ─── Couleurs selon l'état ──────────────────────────────────────────────────
  const accentColor = isOvertime ? Colors.emotional : Colors.accent;
  const timeColor = isOvertime ? Colors.emotional : Colors.foreground;
  const timePrefix = isOvertime ? '+' : '';

  return (
    <>
      {/* ── Pill flottante ────────────────────────────────────────────────── */}
      <Animated.View
        // Non-interactive quand invisible
        pointerEvents={isActive ? 'box-none' : 'none'}
        style={[
          pillStyle,
          {
            position: 'absolute',
            top: insets.top + 6,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 999,
          },
        ]}
      >
        <Pressable onPress={handlePillTap} hitSlop={12}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 9,
              borderRadius: BorderRadius.action,
              borderWidth: 1,
              borderColor: accentColor,
              backgroundColor: Colors.surface,
            }}
          >
            {/* Dot de statut */}
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: accentColor,
              }}
            />

            {/* Chrono — tabular-nums pour éviter le "digit jump" */}
            <Text
              style={{
                fontVariant: ['tabular-nums'],
                fontSize: 15,
                fontWeight: '600',
                color: timeColor,
                letterSpacing: 1,
              }}
            >
              {timePrefix}{formatTime(remaining)}
            </Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* ── Bottom sheet contextuel ───────────────────────────────────────── */}
      <Modal
        visible={showSheet}
        transparent
        animationType="none"
        onRequestClose={() => setShowSheet(false)}
      >
        <View style={StyleSheet.absoluteFill} className="justify-end">
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={() => setShowSheet(false)}>
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
            style={[
              sheetStyle,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
            className="bg-surface-elevated rounded-t-3xl px-6 pt-3"
          >
            {/* Handle */}
            <View className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

            {/* Label exercice */}
            {exerciseName ? (
              <Text style={[Typography.label, { marginBottom: 6 }]}>
                {exerciseName.toUpperCase()}
              </Text>
            ) : null}

            {/* Temps restant — grand affichage */}
            <Text
              style={[
                Typography.dataLarge,
                { color: timeColor, marginBottom: 4 },
              ]}
            >
              {isOvertime
                ? `+${formatTime(remaining)}`
                : formatTime(remaining)}
            </Text>

            {/* État */}
            <Text style={[Typography.bodyMuted, { marginBottom: 4 }]}>
              {isOvertime ? 'Repos dépassé — prêt quand tu veux' : 'Repos en cours'}
            </Text>

            {/* Prochaine série */}
            {nextSet ? (
              <Text style={[Typography.body, { marginBottom: 28 }]}>
                Prochaine série ·{' '}
                <Text style={{ color: Colors.accent, fontWeight: '600' }}>
                  {nextSet}
                </Text>
              </Text>
            ) : (
              <View style={{ marginBottom: 28 }} />
            )}

            {/* Bouton Arrêter */}
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => ({
                height: 48,
                borderRadius: BorderRadius.action,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: pressed
                  ? Colors.surfaceElevated
                  : Colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: Colors.foregroundMuted,
                  fontSize: 15,
                  fontWeight: '500',
                }}
              >
                Arrêter le timer
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
