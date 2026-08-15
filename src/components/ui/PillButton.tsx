import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { Text } from './Text';

type Variant = 'outline' | 'solid' | 'ink';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** render as a selected/active pill */
  selected?: boolean;
  /** smaller padding + type, for filter/reply chips */
  compact?: boolean;
  style?: ViewStyle;
  /** small leading glyph, e.g. "✦" */
  icon?: string;
};

/**
 * The rounded pill used throughout the design for options, chips, filters,
 * and primary actions.
 *   - outline: paper-filled with a hairline border (default option chip)
 *   - solid:   ink-filled inverse (primary CTA)
 *   - ink:     compact ink chip (e.g. "Surprise me")
 */
export function PillButton({ label, onPress, variant = 'outline', selected, compact, style, icon }: Props) {
  const small = compact || variant === 'ink';
  const fontSize = small ? 12 : 15;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.base, small && styles.compact, resolve(variant, selected), style]}>
        {icon ? (
          <Text variant="bodyMedium" size={fontSize} color={fg(variant, selected)} style={styles.icon}>
            {icon}
          </Text>
        ) : null}
        <Text variant="bodyMedium" size={fontSize} color={fg(variant, selected)}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function resolve(variant: Variant, selected?: boolean): ViewStyle {
  if (variant === 'solid') return { backgroundColor: colors.ink, borderColor: colors.ink };
  if (variant === 'ink') return { backgroundColor: colors.ink, borderColor: colors.ink };
  // outline — the design reserves ink/black for primary CTAs only; every
  // selection/active/filter state (onboarding pills, category filters, map
  // toggle) uses the accent color instead.
  if (selected) return { backgroundColor: colors.accent, borderColor: colors.accent };
  return { backgroundColor: colors.card, borderColor: colors.ink16 };
}

function fg(variant: Variant, selected?: boolean): string {
  if (variant === 'solid' || variant === 'ink' || selected) return colors.onDark;
  return colors.ink;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  compact: { paddingVertical: 9, paddingHorizontal: 14 },
  icon: { marginRight: 2 },
});
