import { useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton, MatchBadge } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, spacing, radius } from '@/theme/tokens';
import { useTogether, pickTallies } from '@/core/together';
import type { PickTally } from '@/core/together';
import { usePlaces } from '@/core/places-repo';
import { usePlace } from '@/core/places-store';
import { useUserLocation } from '@/core/location';
import { CATEGORY_LABEL } from '@/core/places';

/** Resolve member ids to display names for a "Liked by …" line. */
function likedByNames(hop: ReturnType<typeof useTogether.getState>['hop'], ids: string[]): string {
  if (!hop) return '';
  const names = ids
    .map((id) => hop.members.find((m) => m.id === id)?.name)
    .filter(Boolean) as string[];
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
}

/**
 * The reveal — the place that cleared the table, with the "why" (who liked it,
 * whether it was unanimous) and the runner-up overlaps below.
 */
export default function PickScreen() {
  const router = useRouter();
  const hydrated = useTogether((s) => s.hydrated);
  const hop = useTogether((s) => s.hop);

  const { coords } = useUserLocation();
  const { places } = usePlaces(coords);

  useEffect(() => {
    if (hydrated && !hop) router.replace('/(tabs)/together');
  }, [hydrated, hop, router]);

  const tallies: PickTally[] = useMemo(
    () => (hop ? pickTallies(hop, places) : []),
    [hop, places],
  );
  const pick = usePlace(hop?.pickId ?? undefined);

  if (!hydrated || !hop) return <Screen>{null}</Screen>;

  // No clean overlap — nobody liked anything in common.
  if (!hop.pickId || !pick) {
    return (
      <Screen contentStyle={styles.center}>
        <Kicker accent center style={{ marginBottom: 10 }}>
          No clean overlap
        </Kicker>
        <Text variant="display" center style={{ marginBottom: 10 }}>
          Nothing cleared the table.
        </Text>
        <Text variant="body" center color={colors.ink55} style={{ marginBottom: spacing.xxl }}>
          Happens sometimes. Run the deck again and see where you land.
        </Text>
        <PillButton
          label="Swipe again"
          variant="solid"
          style={{ alignSelf: 'stretch' }}
          onPress={() => router.replace('/hop/swipe')}
        />
      </Screen>
    );
  }

  const winner = tallies.find((t) => t.placeId === hop.pickId);
  const runnersUp = tallies.filter((t) => t.placeId !== hop.pickId && t.likes > 0).slice(0, 3);
  const match = winner ? Math.round(winner.groupScore * 100) : null;

  return (
    <Screen>
      <Animated.View entering={FadeIn.duration(300)}>
        <Kicker accent center style={{ marginBottom: 10 }}>
          The table agrees
        </Kicker>
        <Text variant="display" size={30} center style={{ marginBottom: spacing.lg }}>
          Group Pick
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(120)}>
      <Card
        accent
        padded={false}
        style={{ marginBottom: spacing.lg }}
        onPress={() => router.push(`/place/${pick.id}`)}>
        <PlaceImage coords={pick.coords} photo={pick.photo} width="100%" height={220} mapSize={800}>
          {match != null ? (
            <View style={styles.badge}>
              <MatchBadge value={`${match}%`} />
            </View>
          ) : null}
        </PlaceImage>
        <View style={styles.cardBody}>
          <Text variant="serif" size={26} style={{ marginBottom: 6 }}>
            {pick.name}
          </Text>
          <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 12 }}>
            {[CATEGORY_LABEL[pick.category], pick.area].filter(Boolean).join(' · ')}
          </Text>
          {winner ? (
            <Text variant="body" size={14} color={colors.ink72} style={{ marginBottom: 8 }}>
              {winner.unanimous
                ? 'Unanimous — everyone liked it.'
                : `Liked by ${likedByNames(hop, winner.likedBy)}.`}
            </Text>
          ) : null}
          <Text variant="kicker" size={9} color={colors.accent}>
            Tap to see the place →
          </Text>
        </View>
      </Card>
      </Animated.View>

      {runnersUp.length > 0 ? (
        <>
          <Kicker style={{ marginBottom: spacing.sm }}>Also had overlap</Kicker>
          <Card style={{ marginBottom: spacing.lg }}>
            {runnersUp.map((t, i) => (
              <RunnerUpRow
                key={t.placeId}
                tally={t}
                hop={hop}
                last={i === runnersUp.length - 1}
                onPress={() => router.push(`/place/${t.placeId}`)}
              />
            ))}
          </Card>
        </>
      ) : null}

      <PillButton
        label="Lock a time"
        variant="solid"
        onPress={() => router.push('/hop/plan')}
      />
    </Screen>
  );
}

function RunnerUpRow({
  tally,
  hop,
  last,
  onPress,
}: {
  tally: PickTally;
  hop: NonNullable<ReturnType<typeof useTogether.getState>['hop']>;
  last: boolean;
  onPress: () => void;
}) {
  const place = usePlace(tally.placeId);
  if (!place) return null;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.runRow, !last && styles.runDivider, { opacity: pressed ? 0.6 : 1 }]}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" size={14} numberOfLines={1}>
          {place.name}
        </Text>
        <Text variant="body" size={12} color={colors.ink55} numberOfLines={1}>
          {likedByNames(hop, tally.likedBy)}
        </Text>
      </View>
      <Text variant="kicker" size={10} color={colors.ink45}>
        {tally.likes} like{tally.likes === 1 ? '' : 's'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  badge: { position: 'absolute', top: 12, right: 12 },
  cardBody: { padding: 18 },
  runRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  runDivider: { borderBottomWidth: 1, borderBottomColor: colors.ink10 },
});
