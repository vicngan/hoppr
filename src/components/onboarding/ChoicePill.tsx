import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Wrapped pill for multi-select onboarding steps (e.g. ob-interests,
 * ob-dietary). Selected = filled accent bg + white text; unselected =
 * card bg + hairline border. See SPEC.md §7.
 */
export function ChoicePill({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && { opacity: 0.85 },
      ]}>
      <Text variant="bodyMedium" size={13} color={selected ? colors.onDark : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  selected: { backgroundColor: colors.accent, borderColor: colors.accent },
  unselected: { backgroundColor: colors.card, borderColor: colors.ink14 },
});
