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
