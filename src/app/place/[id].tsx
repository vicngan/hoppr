import { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Kicker, Card, MeterBar, PillButton } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { mapsConfigured } from '@/core/maps';
import { BackButton } from '@/components/BackButton';
import { colors, radius, spacing } from '@/theme/tokens';
import { deriveSpecs, placeBadges, CATEGORY_LABEL } from '@/core/places';
import { usePlace } from '@/core/places-store';
import { useRanked, fmtDistance } from '@/core/discovery';
import { useLibrary, selectIsSaved, selectRating } from '@/core/library/store';
import { useTaste } from '@/core/taste/store';
import { useMenu, useMenuStore } from '@/core/menu/store';
import { recommendDish } from '@/core/menu/recommend';

/** Place detail. Match %, distance and reason come from the live engine ranking. */
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ranked } = useRanked();
  const place = usePlace(id);
  const saved = useLibrary(selectIsSaved(id ?? ''));
  const rating = useLibrary(selectRating(id ?? ''));
  const toggleSave = useLibrary((s) => s.toggleSave);
  const profile = useTaste((s) => s.profile);
  const menu = useMenu(id ?? '');
  const foodPrefs = useMenuStore((s) => s.prefs);

  const rp = useMemo(() => ranked.find((r) => r.place.id === id), [ranked, id]);
  const dish = useMemo(
    () => (place ? recommendDish(menu, profile, foodPrefs, place.category) : null),
    [menu, profile, foodPrefs, place],
  );
  const specs = useMemo(() => (place ? deriveSpecs(place) : []), [place]);

  if (!place) {
    return (
      <View style={styles.missing}>
        <Text variant="serif" size={20}>
          That place wandered off.
        </Text>
        <PillButton label="Back to Discover" onPress={() => router.replace('/(tabs)/discover')} />
      </View>
    );
  }

  const badges = placeBadges(place);
  const meta = [CATEGORY_LABEL[place.category], place.area, fmtDistance(rp?.distanceMi ?? null)]
    .filter(Boolean)
    .join(' · ');
  const quotes = place.quotes ?? [
    { text: 'Exactly what the app said it would be.', who: 'A regular' },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      <PlaceImage coords={place.coords} photo={place.photo} height={220} radius={0} mapSize={640}>
        <BackButton floating style={{ position: 'absolute', top: insets.top + 8, left: spacing.xl }} />
        {!mapsConfigured ? (
          <View style={styles.heroCaption}>
            <Text variant="kicker" size={9} color={colors.ink40}>
              photo — owner or visitor upload
            </Text>
          </View>
        ) : null}
      </PlaceImage>

      <View style={styles.body}>
        <View style={styles.badges}>
          {badges.map((b) => (
            <View key={b} style={styles.badge}>
              <Text variant="kicker" size={9} color={colors.ink60}>
                {b}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="display" size={30} style={{ marginBottom: 8 }}>
          {place.name}
        </Text>
        <Text variant="kicker" size={10} color={colors.ink50} style={{ marginBottom: 18 }}>
          {meta}
        </Text>
        <Text variant="serif" size={19} style={{ marginBottom: 22 }}>
          {rp?.reason ?? place.blurb}
        </Text>

        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.stats}>
            <Stat value={(3.9 + place.popularity).toFixed(1)} label="Rating" />
            <Stat value={rp ? `${rp.match}%` : '—'} label="Your match" />
            <Stat value="Half full" label="Right now" />
          </View>
          <View style={{ gap: 8, marginTop: 14 }}>
            <PillButton
              label={saved ? 'Saved to your list' : 'Save for later'}
              selected={saved}
              onPress={() => toggleSave(place)}
            />
            <PillButton
              label={rating ? `You rated it ${rating.stars}★ — edit` : "I've been here — rate it"}
              onPress={() => router.push(`/rate/${place.id}`)}
            />
          </View>
        </Card>

        <Kicker style={{ marginBottom: 12 }}>The specs · from visitors</Kicker>
        <View style={styles.specGrid}>
          {specs.map((s) => (
            <View key={s.label} style={styles.spec}>
              <Text variant="kicker" size={9} color={colors.ink42}>
                {s.label}
              </Text>
              <Text variant="bodyMedium" size={13} style={{ marginTop: 7, marginBottom: 9 }}>
                {s.value}
              </Text>
              <MeterBar value={s.fill} />
            </View>
          ))}
        </View>

        <Card accent style={{ marginTop: 24, marginBottom: 24 }} onPress={() => router.push(`/menu/${place.id}`)}>
          <Kicker accent style={{ marginBottom: 10 }}>
            Order this
          </Kicker>
          {dish ? (
            <>
              <View style={styles.dishHead}>
                <Text variant="serif" size={22} style={{ flex: 1 }}>
                  {dish.item.name}
                </Text>
                {dish.item.price != null ? (
                  <Text variant="bodyMedium" size={12} style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    ${dish.item.price.toFixed(2)}
                  </Text>
                ) : null}
              </View>
              <Text variant="body" size={13} color={colors.ink70} style={{ marginTop: 9 }}>
                {dish.reason}
              </Text>
              <Text variant="kicker" size={10} color={colors.accent} style={{ marginTop: 14 }}>
                See the full menu →
              </Text>
            </>
          ) : (
            <>
              <Text variant="serif" size={20}>
                No menu here yet.
              </Text>
              <Text variant="body" size={13} color={colors.ink70} style={{ marginTop: 9 }}>
                Snap a photo of the menu and Hoppr will read it and pick what fits you.
              </Text>
              <Text variant="kicker" size={10} color={colors.accent} style={{ marginTop: 14 }}>
                Add the menu →
              </Text>
            </>
          )}
        </Card>

        <Kicker style={{ marginBottom: 12 }}>What people say</Kicker>
        <View style={{ gap: 12 }}>
          {quotes.map((q) => (
            <Card key={q.who}>
              <Text variant="serif" size={16}>
                {q.text}
              </Text>
              <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 11 }}>
                {q.who}
              </Text>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text variant="serif" size={22}>
        {value}
      </Text>
      <Text variant="kicker" size={8} color={colors.ink45} style={{ marginTop: 5 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  missing: { flex: 1, gap: 16, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.paper },
  heroCaption: { position: 'absolute', left: spacing.xl, bottom: 16 },
  body: { padding: spacing.xl },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  badge: { borderWidth: 1, borderColor: colors.ink16, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 9 },
  stats: { flexDirection: 'row', gap: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.ink10 },
  dishHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spec: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink10,
    borderRadius: radius.md,
    padding: 13,
  },
});
