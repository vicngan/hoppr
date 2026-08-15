import { type ReactNode } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** optional leading icon/emoji glyph */
  icon?: ReactNode;
  /** optional secondary line under the label */
  sub?: string;
};

/**
 * Stacked full-width row for single-select onboarding steps (e.g. ob-budget,
 * ob-crew, ob-when). Selected = accent border + a light accent tint bg, text
 * stays ink, with a trailing filled checkmark badge; unselected = card bg +
 * hairline border. See SPEC.md §7.
 */
export function ChoiceRow({ label, selected, onPress, icon, sub }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && { opacity: 0.85 },
      ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.textCol}>
        <Text variant="bodyMedium" size={15} color={colors.ink}>
          {label}
        </Text>
        {sub ? (
          <Text variant="body" size={12} color={colors.ink50} style={styles.sub}>
            {sub}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.check}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.onDark} strokeWidth={3}>
            <Path d="M5 13l4 4L19 7" />
          </Svg>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  selected: { backgroundColor: 'rgba(200,67,28,0.08)', borderColor: colors.accent },
  unselected: { backgroundColor: colors.card, borderColor: colors.ink14 },
  icon: { width: 24, alignItems: 'center' },
  textCol: { flex: 1 },
  sub: { marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
