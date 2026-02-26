/**
 * MilestoneToast — Micro-feedbacks de gratification
 * Phase 7: Système émotionnel
 *
 * 3 variantes selon le type de milestone :
 *
 * ┌─────────────────────┬────────────────────────────────┬───────────────────┐
 * │ type                │ UI                             │ Animation         │
 * ├─────────────────────┼────────────────────────────────┼───────────────────┤
 * │ 'halfway'           │ Banner pleine largeur          │ fade-in / fade-out│
 * │                     │ "Mi-chemin. Continue."         │ auto-dismiss 4s   │
 * │                     │ couleur emotional              │                   │
 * ├─────────────────────┼────────────────────────────────┼───────────────────┤
 * │ 'lastSet'           │ Tag inline pill                │ fade-in léger     │
 * │                     │ "Dernière série"               │ (200ms)           │
 * │                     │ couleur accent                 │                   │
 * ├─────────────────────┼────────────────────────────────┼───────────────────┤
 * │ 'weightImprovement' │ Indicateur ↑ inline            │ aucune            │
 * │                     │ couleur accent                 │                   │
 * └─────────────────────┴────────────────────────────────┴───────────────────┘
 *
 * Règle d'or : la couleur émotionnelle récompense une ACTION, jamais ne décore.
 *
 * Usage — halfway :
 *   const [showHalfway, setShowHalfway] = useState(false);
 *   // Déclencher quand 50% des exercices sont validés
 *   <MilestoneToast type="halfway" visible={showHalfway} onHide={() => setShowHalfway(false)} />
 *
 * Usage — lastSet (inline, dans la ligne de série) :
 *   <MilestoneToast type="lastSet" visible={setIndex === exercise.sets - 1} />
 *
 * Usage — weightImprovement (inline, à côté d'un chiffre) :
 *   <Text>{charge} kg</Text>
 *   <MilestoneToast type="weightImprovement" visible={charge > lastCharge} />
 */

import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, BorderRadius } from '@/theme/colors';
import { Typography } from '@/theme/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MilestoneType = 'halfway' | 'lastSet' | 'weightImprovement';

interface MilestoneToastProps {
  type: MilestoneType;
  /** Contrôlé par le parent. true = déclenche l'apparition. */
  visible: boolean;
  /**
   * Appelé après l'auto-dismiss (type 'halfway' uniquement, après ~4s).
   * Le parent devrait setter visible à false dans ce callback.
   */
  onHide?: () => void;
}

// ─── halfway — Banner fade-in / fade-out auto-dismiss 4s ─────────────────────

function HalfwayBanner({
  visible,
  onHide,
}: {
  visible: boolean;
  onHide?: () => void;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: 200 });
      return;
    }

    // Séquence : fade-in 300ms → maintien 3100ms → fade-out 600ms = 4000ms
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(3100, withTiming(0, { duration: 600 })),
    );

    // Notifie le parent après la séquence complète (4000ms)
    const timer = setTimeout(() => onHide?.(), 4000);
    return () => clearTimeout(timer);
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        animStyle,
        {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: BorderRadius.card,
          borderLeftWidth: 3,
          borderLeftColor: Colors.emotional,
          backgroundColor: `${Colors.emotional}14`, // 8% opacity
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
      ]}
    >
      <Text style={{ fontSize: 14 }}>🔥</Text>
      <Text
        style={[
          Typography.body,
          {
            color: Colors.emotional,
            fontWeight: '500',
            flex: 1,
          },
        ]}
      >
        Mi-chemin. Continue.
      </Text>
    </Animated.View>
  );
}

// ─── lastSet — Tag inline discret ─────────────────────────────────────────────

function LastSetTag({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: BorderRadius.action,
          borderWidth: 1,
          borderColor: `${Colors.accent}4D`, // 30% opacity
          backgroundColor: `${Colors.accent}1A`, // 10% opacity
        },
      ]}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: Colors.accent,
          letterSpacing: 0.5,
        }}
      >
        Dernière série
      </Text>
    </Animated.View>
  );
}

// ─── weightImprovement — Indicateur ↑ statique ────────────────────────────────

function WeightArrow({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={{ justifyContent: 'center' }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: Colors.accent,
          lineHeight: 16,
        }}
        accessibilityLabel="Amélioration de charge"
      >
        ↑
      </Text>
    </View>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function MilestoneToast({ type, visible, onHide }: MilestoneToastProps) {
  switch (type) {
    case 'halfway':
      return <HalfwayBanner visible={visible} onHide={onHide} />;
    case 'lastSet':
      return <LastSetTag visible={visible} />;
    case 'weightImprovement':
      return <WeightArrow visible={visible} />;
  }
}
