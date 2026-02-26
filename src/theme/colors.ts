/**
 * theme/colors.ts — Elite Stealth Design Tokens
 * Phase 1: Foundations
 *
 * Usage (StyleSheet / programmatic):
 *   import { Colors, BorderRadius } from '@/theme/colors';
 *   backgroundColor: Colors.surface
 *   borderRadius: BorderRadius.card
 *
 * NativeWind class equivalents:
 *   Colors.background       → bg-background
 *   Colors.surface          → bg-surface
 *   Colors.surfaceElevated  → bg-surface-elevated
 *   Colors.foreground       → text-foreground
 *   Colors.foregroundMuted  → text-foreground-muted
 *   Colors.foregroundSubtle → text-foreground-subtle
 *   Colors.border           → border-border
 *   Colors.accent           → text-accent / bg-accent
 *   Colors.emotional        → text-emotional / bg-emotional
 *   Colors.achievement      → text-achievement / bg-achievement
 */

// ─── Backgrounds ─────────────────────────────────────────────────────────────

export const Colors = {
  /** Gris Carbone profond — fond principal */
  background: '#111318',
  /** Fond des cartes */
  surface: '#1E2128',
  /** Modales, bottom sheets */
  surfaceElevated: '#2A2E37',

  // ─── Text ──────────────────────────────────────────────────────────────────

  /** Blanc cassé — texte principal */
  foreground: '#F5F5F7',
  /** Labels, textes secondaires */
  foregroundMuted: '#8B92A5',
  /** Placeholders, textes discrets */
  foregroundSubtle: '#555B6A',

  // ─── Borders ───────────────────────────────────────────────────────────────

  /** Bordure standard */
  border: '#2A2E37',

  // ─── Emotional System (3 layers) ───────────────────────────────────────────

  /** Focus — "Tu es ici, tu agis maintenant" */
  accent: '#C47A3D',
  /** Validation — "Tu viens d'accomplir quelque chose" */
  emotional: '#E05D36',
  /** Achievement / PR — "Tu viens de te dépasser" */
  achievement: '#FF8C42',
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const BorderRadius = {
  /** Cartes — 16px (NativeWind: rounded-xl) */
  card: 16,
  /** Inputs — 12px */
  input: 12,
  /** Boutons pilule — NativeWind: rounded-full */
  action: 9999,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColorToken = keyof typeof Colors;
export type BorderRadiusToken = keyof typeof BorderRadius;

// ─── Premium Wellness — Light Mode (future) ──────────────────────────────────
// Kept here for reference. To be activated when light mode is implemented.
//
// background:       '#F6F4F0'
// surface:          '#FFFFFF'
// surfaceElevated:  '#EDE8DF'
// foreground:       '#2D2B2A'
// foregroundMuted:  '#736F6D'
// foregroundSubtle: '#A09B98'
// border:           '#E8E3D8'
// accent:           '#2E6B4F'
// emotional:        '#1A4331'
// achievement:      '#4A8C6A'
