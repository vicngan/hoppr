import { View, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { Text } from './Text';

/** The translucent "94%" match chip pinned to the corner of place photos. */
export function MatchBadge({ value }: { value: string }) {
  return (
    <View style={styles.badge}>
      <Text variant="body" size={10} style={styles.text}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(247,242,232,0.94)',
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  text: { fontFamily: fonts.monoMedium, color: colors.ink },
});
