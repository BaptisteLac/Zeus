/**
 * theme/typography.ts — Iron Progress Typography Tokens
 * Phase 3: Typography & Affordance
 *
 * Usage:
 *   import { Typography } from '@/theme/typography';
 *   <Text style={Typography.dataLarge}>100</Text>
 *   <Text style={[Typography.dataLarge, { color: Colors.accent }]}>100</Text>
 *
 * Affordance rule: interactive text must never look static.
 *   → Use a color token (accent / emotional) or add textDecorationLine: 'underline'
 *   → Never leave a tappable Text with foregroundSubtle — too invisible under effort.
 */

import { Platform, TextStyle } from 'react-native';
import { Colors } from './colors';

/**
 * Monospace font for numeric data — prevents "digit jump" during updates.
 * Uses system mono fonts — no font loading required.
 * Paired with fontVariant: ['tabular-nums'] for fixed-width digit columns.
 */
const FONT_MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
});

// ─── Data Variants (numeric displays) ────────────────────────────────────────
// CRITICAL: fontVariant tabular-nums prevents the "number jump" effect
// when digits change width (e.g. 9→10, 99→100 during a live timer or rep count).

export const Typography = {
  /**
   * dataLarge — 32pt bold mono
   * Primary numeric data: weight on bar, main timer, 1RM.
   * The dominant visual element — must be unmissable at a glance.
   */
  dataLarge: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: FONT_MONO,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  } as TextStyle,

  /**
   * dataMedium — 24pt bold mono
   * Secondary numeric data: rep count, set number, rest time.
   */
  dataMedium: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.foreground,
    fontFamily: FONT_MONO,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  // ─── Label Variant ──────────────────────────────────────────────────────────

  /**
   * label — 12pt bold muted
   * Unit labels ("kg", "reps", "RIR", "set").
   * Must be visually subordinate to data — foregroundMuted creates the contrast.
   */
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.foregroundMuted,
    letterSpacing: 0.8,
  } as TextStyle,

  // ─── Body Variants ──────────────────────────────────────────────────────────

  /**
   * body — 16pt regular foreground
   * Standard readable text: descriptions, instructions, sheet content.
   */
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.foreground,
  } as TextStyle,

  /**
   * bodyMuted — 14pt regular foregroundMuted
   * Secondary text: session name, exercise subtitle, dates.
   */
  bodyMuted: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.foregroundMuted,
  } as TextStyle,

  /**
   * caption — 12pt regular foregroundSubtle
   * Low-priority hints: placeholders, helper text, timestamps.
   * ⚠️  Affordance: never use caption on a tappable element — too invisible.
   */
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.foregroundSubtle,
  } as TextStyle,
} as const;

export type TypographyVariant = keyof typeof Typography;

// ─── Affordance Helpers ───────────────────────────────────────────────────────
// Overlays to apply on top of any variant when the text is interactive.
// Usage: style={[Typography.bodyMuted, Affordance.tappable]}

export const Affordance = {
  /**
   * tappable — shifts muted text to full foreground to signal interactivity.
   * Apply to any text that triggers an action.
   */
  tappable: {
    color: Colors.foreground,
  } as TextStyle,

  /**
   * tappableAccent — uses the accent color for primary interactive text.
   * Use for links, active tab labels, or inline actions.
   */
  tappableAccent: {
    color: Colors.accent,
  } as TextStyle,

  /**
   * underline — thin underline for text-links when color alone isn't enough.
   */
  underline: {
    textDecorationLine: 'underline',
  } as TextStyle,
} as const;
