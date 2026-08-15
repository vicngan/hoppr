import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/theme/tokens';

type Props = {
  /** 0..1 fill fraction */
  value: number;
  color?: string;
  track?: string;
  height?: number;
  style?: ViewStyle;
};

/** The thin rust progress/spec meter used on Place specs and the You screen. */
export function MeterBar({ value, color = colors.accent, track = colors.ink10, height = 3, style }: Props) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { height, backgroundColor: track, borderRadius: height / 2 }, style]}>
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: color,
          width: `${pct * 100}%`,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
