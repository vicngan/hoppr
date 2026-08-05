import { View, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

type Props = {
  count: number;
  /** number of filled (answered/active) dots */
  active: number;
};

/** The row of short dashes tracking progress through the Ask question flow. */
export function ProgressDots({ count, active }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[styles.dash, { backgroundColor: i < active ? colors.accent : colors.ink16 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dash: { width: 28, height: 3, borderRadius: 2 },
});
