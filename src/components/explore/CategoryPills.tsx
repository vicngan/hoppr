import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from '@/components/ui';

type Props = {
  categories: string[];
  active: string;
  onSelect: (cat: string) => void;
};

/**
 * The design's one real data-bound select pattern: a horizontal row of
 * pills where the active pill flips to a filled accent background + inverse
 * text, matching the onboarding selection convention (SPEC.md §7).
 */
export function CategoryPills({ categories, active, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {categories.map((cat) => {
        const selected = cat === active;
        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            style={({ pressed }) => [
              styles.pill,
              selected ? styles.pillActive : styles.pillInactive,
              pressed && { opacity: 0.85 },
            ]}>
            <Text
              variant="bodyMedium"
              size={13}
              color={selected ? colors.onDark : colors.ink}>
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: spacing.xl },
  pill: {
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillInactive: { backgroundColor: colors.card, borderColor: colors.ink14 },
});
