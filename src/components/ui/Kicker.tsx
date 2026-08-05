import { Text, type TextProps } from './Text';
import { colors } from '@/theme/tokens';

/**
 * Uppercase mono micro-label ("HOPPR WANTS TO KNOW ONE THING", "THE SPECS", …).
 * Thin wrapper over Text's `kicker` variant with the option to tint accent.
 */
export function Kicker({ accent, color, ...rest }: TextProps & { accent?: boolean }) {
  return <Text variant="kicker" color={color ?? (accent ? colors.accent : undefined)} {...rest} />;
}
