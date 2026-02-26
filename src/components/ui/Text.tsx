/**
 * components/ui/Text.tsx — Typed typography wrapper
 * Phase 3: Typography & Affordance
 *
 * Drop-in replacement for React Native's Text, with optional `variant` prop.
 * When no variant is specified, behaves exactly like <Text> from react-native.
 *
 * Usage:
 *   import { Text } from '@/components/ui/Text';
 *
 *   <Text variant="dataLarge">100</Text>
 *   <Text variant="label">kg</Text>
 *   <Text variant="body">Bench Press</Text>
 *
 *   // Override any token property via style:
 *   <Text variant="dataLarge" style={{ color: Colors.accent }}>8</Text>
 */

import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { Typography, TypographyVariant } from '@/theme/typography';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
}

export function Text({ variant, style, ...props }: TextProps) {
  return (
    <RNText
      style={[variant ? Typography[variant] : undefined, style]}
      {...props}
    />
  );
}
