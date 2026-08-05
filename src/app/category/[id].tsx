import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Text, Kicker, StripePlaceholder } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { colors, radius } from '@/theme/tokens';
import { useRanked } from '@/core/discovery';
import { placeMeta } from '@/components/PlaceCard';

/** Vertical list of ranked places (a "see all" from a Discover row). */
export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { ranked } = useRanked();

  return (
    <Screen contentStyle={{ paddingTop: 60 }}>
      <BackButton style={{ marginBottom: 18 }} />
      <Text variant="display" size={28} style={{ marginBottom: 8 }}>
        {String(id ?? 'Places').replace(/-/g, ' ')}
      </Text>
      <Kicker style={{ marginBottom: 20 }}>{ranked.length} places, best fit first</Kicker>

      <View style={{ gap: 14 }}>
        {ranked.map((rp) => (
          <View key={rp.place.id} style={styles.row}>
            <StripePlaceholder width={96} radius={0} />
            <View style={styles.body}>
              <View style={styles.top}>
                <Text variant="serif" size={18} style={{ flex: 1 }}>
                  {rp.place.name}
                </Text>
                <Text variant="kicker" size={10} color={colors.ink45}>
                  {rp.match}%
                </Text>
              </View>
              <Text variant="kicker" size={9} color={colors.ink45} style={{ marginVertical: 6 }}>
                {placeMeta(rp)}
              </Text>
              <Text variant="body" size={12} color={colors.ink70}>
                {rp.reason}
              </Text>
            </View>
            <View
              style={StyleSheet.absoluteFill}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => router.push(`/place/${rp.place.id}`)}
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink10,
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 96,
  },
  body: { flex: 1, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
});
