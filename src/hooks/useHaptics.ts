/**
 * useHaptics — Point d'entrée unique pour tous les feedbacks haptiques
 * Phase 7: Système émotionnel
 *
 * Centralise les appels expo-haptics avec des noms sémantiques.
 * L'objet retourné est stable (useRef) — peut être passé en prop ou mis
 * en dépendance d'un useEffect sans déclencher de re-render.
 *
 * Usage :
 *   const haptics = useHaptics();
 *   haptics.light();    // navigation, clavier
 *   haptics.medium();   // validation série, lancement repos
 *   haptics.heavy();    // milestone 50%, dernière série
 *   haptics.success();  // PR détecté, exercice terminé
 *   haptics.error();    // suppression, erreur
 *   haptics.warning();  // repos dépassé (existant dans RestTimer)
 *
 * Avantages vs appels directs :
 *   - Renommage centralisé (ex: changer Light → Medium globalement)
 *   - Désactivable en test / mode accessibilité
 *   - Sémantique métier (haptics.success() > ImpactFeedbackStyle.Light)
 */

import { useRef } from 'react';
import * as Haptics from 'expo-haptics';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HapticFunctions {
  /** Navigation, frappe clavier, sélection — feedback le plus léger */
  light: () => Promise<void>;
  /** Validation série, lancement timer — feedback moyen */
  medium: () => Promise<void>;
  /** Milestone (50% atteint, dernière série) — feedback fort */
  heavy: () => Promise<void>;
  /** PR détecté, exercice terminé — notification Success */
  success: () => Promise<void>;
  /** Suppression, erreur — notification Error */
  error: () => Promise<void>;
  /** Repos dépassé — notification Warning */
  warning: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Retourne un objet stable de fonctions haptiques.
 * useRef garantit que la référence ne change jamais entre les renders.
 */
export function useHaptics(): HapticFunctions {
  const ref = useRef<HapticFunctions>({
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    success: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    error: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    warning: () =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  });

  return ref.current;
}
