import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { AppHeader } from '@/components/AppHeader';
import { colors, radius, spacing } from '@/theme/tokens';
import { CATEGORY_LABEL, type Place, type PlaceCategory } from '@/core/places';
import { usePlacesStore } from '@/core/places-store';
import { useLibrary } from '@/core/library/store';

/**
 * Saved tab-root. Design calls for All/Places/Events/Lists filter pills and
 * "your lists" cards, but `library/store.ts` only tracks a flat saved-id set
 * (no event type, no named lists exist in the data model) — see
 * `Place`/`PlaceCategory` in `core/places.ts`. Simplified to a flat saved grid
 * with real client-side filter pills built from the `PlaceCategory` values
 * actually present in the saved set, grouped into three buckets that mirror
 * the design's intent (Eat & Drink / Study / Photo) without inventing fields.
 *
 * Events dropped from the filter set entirely (not just simplified): grepped
 * `src/core` for any "event" data model (`detail-event` in SCREEN_MAP.md
 * points to "the data-model decision" in the redesign plan file, which this
 * package doesn't own) — there is no event type anywhere in the app's data
 * layer today, only `Place`/`PlaceCategory`. Nothing to filter by yet; add an
 * Events pill here once the Detail/Menu package (which owns `detail-event`)
 * lands whatever data shape it picks.
 */
type FilterKey = 'all' | 'eatDrink' | 'study' | 'photo';

const CATEGORY_BUCKET: Record<PlaceCategory, Exclude<FilterKey, 'all'>> = {
  cafe: 'eatDrink',
  bar: 'eatDrink',
  restaurant: 'eatDrink',
  bakery: 'eatDrink',
  study: 'study',
  photo: 'photo',
};

const FILTER_LABEL: Record<FilterKey, string> = {
  all: 'All',
  eatDrink: 'Places',
  study: 'Study',
  photo: 'Photo',
};

export default function SavedScreen() {
  const router = useRouter();
  const saved = useLibrary((s) => s.saved);
  const byId = usePlacesStore((s) => s.byId);
  const [filter, setFilter] = useState<FilterKey>('all');

  const savedPlaces = useMemo(
    () =>
      (Object.keys(saved)
        .map((id) => byId[id])
        .filter(Boolean) as Place[]),
    [saved, byId],
  );

  const availableFilters = useMemo(() => {
    const present = new Set<FilterKey>(['all']);
    for (const p of savedPlaces) present.add(CATEGORY_BUCKET[p.category]);
    return (['all', 'eatDrink', 'study', 'photo'] as FilterKey[]).filter((f) => present.has(f));
  }, [savedPlaces]);

  const items = useMemo(
    () => (filter === 'all' ? savedPlaces : savedPlaces.filter((p) => CATEGORY_BUCKET[p.category] === filter)),
    [savedPlaces, filter],
  );

  return (
    <>
      <AppHeader variant="root" />
      <Screen>
        <Text variant="kicker" size={11} color={colors.ink45} style={{ marginBottom: 6 }}>
          {savedPlaces.length} {savedPlaces.length === 1 ? 'SPOT' : 'SPOTS'}
        </Text>
        <Text variant="display" size={30} style={{ marginBottom: 18 }}>
          Saved
        </Text>

        {availableFilters.length > 1 ? (
          <View style={styles.pills}>
            {availableFilters.map((f) => (
              <PillButton
                key={f}
                label={FILTER_LABEL[f]}
                compact
                selected={filter === f}
                onPress={() => setFilter(f)}
              />
            ))}
          </View>
        ) : null}

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="serif" size={19} color={colors.ink70} center>
              {savedPlaces.length === 0
                ? 'Nothing saved yet. Tap "Save for later" on a place you like.'
                : 'Nothing in this filter yet.'}
            </Text>
            <PillButton label="Find somewhere" onPress={() => router.push('/explore' as Href)} />
          </View>
        ) : (
          <View style={styles.grid}>
            {items.map((p) => (
              <View key={p.id} style={styles.cell}>
                <PlaceImage coords={p.coords} photo={p.photo} height={104} radius={0} mapSize={280} />
                <View style={styles.body}>
                  <Text variant="serif" size={17} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text variant="kicker" size={9} color={colors.ink45} style={{ marginTop: 6 }}>
                    {CATEGORY_LABEL[p.category]} · {p.area}
                  </Text>
                </View>
                <View
                  style={StyleSheet.absoluteFill}
                  onStartShouldSetResponder={() => true}
                  onResponderRelease={() => router.push(`/place/${p.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  empty: { alignItems: 'center', gap: 18, paddingVertical: 48, paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    overflow: 'hidden',
  },
  body: { padding: 13 },
});
