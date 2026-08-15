import { type ReactNode } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** optional leading icon/emoji glyph rendered above the label */
  icon?: ReactNode;
};

/**
 * Grid tile for multi-select onboarding steps (e.g. ob-energy). Selected =
 * accent border + a light accent tint bg, text stays ink; unselected = card
 * bg + hairline border. See SPEC.md §7 for the shared selectable-option
 * convention.
 */
export function ChoiceTile({ label, selected, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && { opacity: 0.85 },
      ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text variant="bodyMedium" size={15} color={colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 96,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  selected: { backgroundColor: 'rgba(200,67,28,0.08)', borderColor: colors.accent },
  unselected: { backgroundColor: colors.card, borderColor: colors.ink14 },
  icon: { marginBottom: 2 },
});
