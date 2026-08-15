import { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Screen, Text, Card, Kicker } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { GemIcon } from '@/theme/icons';
import { colors, radius, spacing } from '@/theme/tokens';
import { useRanked, fmtDistance } from '@/core/discovery';
import { isHiddenGem } from '@/core/places';

/**
 * Hidden gems list. `isHiddenGem` (rating ≥4.4, ≤200 reviews) already exists
 * on `core/places.ts` — reused as-is, no stand-in heuristic needed.
 */
export default function GemsScreen() {
  const router = useRouter();
  const { ranked, loading } = useRanked();
  const gems = useMemo(() => ranked.filter((r) => isHiddenGem(r.place)), [ranked]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <AppHeader
        variant="sub"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/home' as Href))}
      />
      <Screen>
        <View style={styles.eyebrowRow}>
          <GemIcon size={16} color={colors.accent} />
          <Kicker color={colors.accent}>Off the beaten path</Kicker>
        </View>
        <Text variant="display" size={28} style={styles.headline}>
          Places you&apos;d never find yourself.
        </Text>
        <Text variant="body" size={13} color={colors.ink55} style={styles.intro}>
          Independent, newly opened, and loved by locals — matched to your taste.
        </Text>

        <View style={styles.meterCard}>
          <View style={styles.meterHead}>
            <Text variant="bodyMedium" size={12} color="rgba(247,242,232,0.5)">
              Familiar
            </Text>
            <Text variant="bodyMedium" size={12} color={colors.onDark}>
              Max adventure
            </Text>
          </View>
          <View style={styles.meterTrack}>
            <View style={styles.meterFill} />
            <View style={styles.meterThumb} />
          </View>
        </View>

        {gems.length === 0 ? (
          <Text variant="body" size={13} color={colors.ink45} style={{ marginTop: spacing.xl }}>
            {loading ? 'Looking for gems near you…' : 'No hidden gems have turned up yet — check back soon.'}
          </Text>
        ) : (
          <View style={styles.list}>
            {gems.map((r) => (
              <Pressable key={r.place.id} onPress={() => router.push(`/place/${r.place.id}`)}>
                <Card padded={false} style={styles.card}>
                  <PlaceImage
                    coords={r.place.coords}
                    photo={r.place.photo}
                    width={104}
                    height="100%"
                    radius={0}>
                    <View style={styles.gemBadge}>
                      <GemIcon size={9} color={colors.onDark} />
                      <Text variant="kicker" size={8} color={colors.onDark}>
                        GEM
                      </Text>
                    </View>
                  </PlaceImage>
                  <View style={styles.cardBody}>
                    <Text variant="serif" size={17}>
                      {r.place.name}
                    </Text>
                    <Kicker size={10} color={colors.ink45} style={{ marginVertical: 6 }}>
                      {r.place.area} · {fmtDistance(r.distanceMi)}
                    </Kicker>
                    <Text variant="body" size={12} color={colors.ink60} numberOfLines={2}>
                      {r.place.blurb}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  headline: { marginTop: spacing.sm, marginBottom: 6 },
  intro: { marginBottom: spacing.lg },
  meterCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(247,242,232,0.15)',
    justifyContent: 'center',
  },
  meterFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 6,
    width: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  meterThumb: {
    position: 'absolute',
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.onDark,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  card: { flexDirection: 'row', overflow: 'hidden' },
  gemBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cardBody: { flex: 1, justifyContent: 'center', padding: spacing.md },
});
