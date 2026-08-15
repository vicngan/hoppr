import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

type Variant =
  | 'display' // Instrument Serif, large editorial headings
  | 'serif' // Instrument Serif, editorial body lines
  | 'body' // DM Sans regular
  | 'bodyMedium' // DM Sans medium (UI labels, buttons)
  | 'kicker'; // JetBrains Mono, uppercase, letter-spaced micro-label

export type TextProps = RNTextProps & {
  variant?: Variant;
  /** override font size (line height scales for serif/display) */
  size?: number;
  color?: string;
  center?: boolean;
};

/**
 * Themed text. Defaults reproduce the recurring type styles from the design.
 * Pass `size` to scale; `color` to recolor; `style` to fine-tune per use.
 */
export function Text({ variant = 'body', size, color, center, style, ...rest }: TextProps) {
  const base = variantStyles[variant];
  return (
    <RNText
      {...rest}
      style={[
        base,
        size != null && sizeOverride(variant, size),
        color != null && { color },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}

function sizeOverride(variant: Variant, size: number) {
  // serif/display read best with tight leading; sans/mono a touch looser
  const ratio = variant === 'display' ? 1.05 : variant === 'serif' ? 1.3 : 1.4;
  const override: { fontSize: number; lineHeight: number; letterSpacing?: number } = {
    fontSize: size,
    lineHeight: Math.round(size * ratio),
  };
  // display tracking is em-based in the design (~-0.019em) — keep it
  // proportional so headlines don't read cramped/loose away from the base size.
  if (variant === 'display') override.letterSpacing = Math.round(size * -0.019 * 100) / 100;
  return override;
}

const variantStyles = StyleSheet.create({
  display: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  serif: {
    fontFamily: fonts.serif,
    fontSize: 19,
    lineHeight: 25,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  bodyMedium: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
  kicker: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink45,
  },
});
