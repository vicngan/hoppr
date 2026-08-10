import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, spacing, radius } from '@/theme/tokens';
import { useTogether, groupFit } from '@/core/together';
import { usePlaces } from '@/core/places-repo';
import { usePlace } from '@/core/places-store';
import { useUserLocation } from '@/core/location';
import { CATEGORY_LABEL } from '@/core/places';

/**
 * Swipe the shared shortlist, one card at a time. Pass / Like are the baseline
 * controls (work on web + SSR). When the deck runs out, the Group Pick is built.
 */
export default function SwipeScreen() {
  const router = useRouter();
  const hydrated = useTogether((s) => s.hydrated);
  const hop = useTogether((s) => s.hop);
  const swipe = useTogether((s) => s.swipe);
  const finishSwiping = useTogether((s) => s.finishSwiping);

  const { coords } = useUserLocation();
  const { places } = usePlaces(coords);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (hydrated && !hop) router.replace('/(tabs)/together');
  }, [hydrated, hop, router]);

  // Empty deck (nothing to swipe) — go straight to the reveal.
  useEffect(() => {
    if (hop && hop.status === 'swiping' && hop.shortlist.length === 0) {
      finishSwiping(places);
      router.replace('/hop/pick');
    }
  }, [hop, places, finishSwiping, router]);

  const shortlist = hop?.shortlist ?? [];
  const currentId = shortlist[index];
  const place = usePlace(currentId);

  if (!hydrated || !hop) return <Screen>{null}</Screen>;

  const total = shortlist.length;
  const done = index >= total;

  const act = (like: boolean) => {
    if (!currentId) return;
    swipe(currentId, like);
    const next = index + 1;
    if (next >= total) {
      finishSwiping(places);
      router.replace('/hop/pick');
    } else {
      setIndex(next);
    }
  };

  if (done || !place) {
    return (
      <Screen contentStyle={styles.center}>
        <Kicker accent center>
          Tallying the table…
        </Kicker>
      </Screen>
    );
  }

  // Group-aware, not just your taste: how well it sits with the whole table.
  const fit = groupFit(hop.members, place.tags);
  const why =
    fit >= 0.62
      ? 'A safe bet for the whole table.'
      : fit >= 0.5
        ? 'Could work — the table might split.'
        : 'Divisive — someone will love it, someone won’t.';

  return (
    <Screen scroll={false} contentStyle={styles.wrap}>
      <View style={styles.head}>
        <Kicker accent>Swipe the shortlist</Kicker>
        <Text variant="kicker" size={10} color={colors.ink45}>
          {index + 1} of {total}
        </Text>
      </View>

      <View style={styles.tableRow}>
        <View style={styles.avatars}>
          {hop.members.map((m) => (
            <View key={m.id} style={styles.avatar}>
              <Text variant="body" size={13}>
                {m.emoji}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="body" size={12} color={colors.ink45}>
          the table’s swiping too
        </Text>
      </View>

      <Pressable
        style={styles.cardWrap}
        onPress={() => router.push(`/place/${place.id}`)}>
        <View style={styles.heroBox}>
          <PlaceImage
            coords={place.coords}
            photo={place.photo}
            width="100%"
            height="100%"
            radius={0}
            mapSize={800}
          />
        </View>
        <View style={styles.body}>
          <Text variant="serif" size={26} style={{ marginBottom: 6 }}>
            {place.name}
          </Text>
          <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 10 }}>
            {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
          </Text>
          <Text variant="body" size={14} color={colors.ink72}>
            {why}
          </Text>
        </View>
      </Pressable>

      <View style={styles.controls}>
        <Pressable onPress={() => act(false)} style={({ pressed }) => [styles.ctrl, styles.pass, { opacity: pressed ? 0.85 : 1 }]}>
          <Text variant="bodyMedium" size={16} color={colors.ink}>
            Pass
          </Text>
        </Pressable>
        <Pressable onPress={() => act(true)} style={({ pressed }) => [styles.ctrl, styles.like, { opacity: pressed ? 0.85 : 1 }]}>
          <Text variant="bodyMedium" size={16} color={colors.onDark}>
            Like
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingBottom: spacing.xxl, width: '100%', maxWidth: 460, alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md },
  avatars: { flexDirection: 'row', paddingLeft: 6 },
  avatar: {
    width: 26,
    height: 26,
    marginLeft: -6,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    borderWidth: 1,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrap: { flex: 1 },
  // The hero fills the space left above the body text — bounded, so the name and
  // "why" line are always visible instead of a full-viewport square pushing them off.
  heroBox: { flex: 1, minHeight: 0, borderRadius: radius.xxl, overflow: 'hidden' },
  body: { paddingTop: spacing.lg },
  controls: { flexDirection: 'row', gap: 12, marginTop: spacing.lg },
  ctrl: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  pass: { backgroundColor: colors.card, borderColor: colors.ink16 },
  like: { backgroundColor: colors.ink, borderColor: colors.ink },
});
