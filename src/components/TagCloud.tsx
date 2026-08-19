import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';
import type { Tag } from '@/core/taste/tags';

type Props = {
  /** [tag, weight] pairs, best-first — from `confidentTraits(profile)` */
  traits: [Tag, number][];
  labels: Record<Tag, string>;
};

const PALETTE = [colors.accent, colors.ink, colors.mapPin, colors.success, colors.accentPressed];

/**
 * "Your likes" as a fun chip collage — size and color vary with how strongly
 * each tag is held, so the strongest trait reads first at a glance.
 */
export function TagCloud({ traits, labels }: Props) {
  if (traits.length === 0) return null;
  const maxW = Math.max(...traits.map(([, w]) => w), 0.01);

  return (
    <View style={styles.wrap}>
      {traits.map(([tag, w], i) => {
        const t = w / maxW; // 0..1 relative strength
        const fontSize = 12 + t * 10; // 12-22
        const paddingV = 6 + t * 6;
        const paddingH = 12 + t * 8;
        const color = PALETTE[i % PALETTE.length];
        const filled = t > 0.55;
        return (
          <View
            key={tag}
            style={[
              styles.chip,
              {
                paddingVertical: paddingV,
                paddingHorizontal: paddingH,
                backgroundColor: filled ? color : colors.card,
                borderColor: color,
                transform: [{ rotate: `${((i % 5) - 2) * 1.5}deg` }],
              },
            ]}>
            <Text variant="bodyMedium" size={fontSize} color={filled ? colors.onDark : color}>
              {labels[tag]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  chip: { borderRadius: radius.pill, borderWidth: 1.5 },
});
