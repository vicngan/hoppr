import { ScrollView, View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';
import type { StreakDay } from '@/core/library/streak';

type Props = {
  days: StreakDay[];
};

/** Horizontally-scrollable day-card streak strip, replacing the single dark streak card. */
export function StreakStrip({ days }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((d) => (
        <View key={d.iso} style={[styles.card, d.active && styles.cardActive, d.isToday && styles.cardToday]}>
          <Text
            variant="kicker"
            size={9}
            color={d.active ? 'rgba(247,242,232,0.6)' : colors.ink40}>
            {d.weekdayLabel.slice(0, 3).toUpperCase()}
          </Text>
          <Text
            variant="bodyMedium"
            size={15}
            color={d.active ? colors.onDark : colors.ink}
            style={{ marginTop: 4 }}>
            {d.dayNum}
          </Text>
          {d.active ? <View style={styles.dot} /> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  card: {
    width: 46,
    height: 62,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  cardToday: { borderColor: colors.accent, borderWidth: 1.5 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginTop: 5 },
});
