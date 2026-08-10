import { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Kicker, PillButton } from '@/components/ui';
import { PlaceCard } from '@/components/PlaceCard';
import { LocationPill } from '@/components/LocationPill';
import { LocationPicker } from '@/components/LocationPicker';
import { colors, spacing } from '@/theme/tokens';
import { useRanked, buildRows, filterRanked } from '@/core/discovery';

const FILTERS = ['For you', 'Coffee', 'Study', 'Light drink', 'Photo spots', 'Open now'];

/**
 * The browsable feed. Rows are built live from the engine ranking, so answering
 * questions in Ask visibly reorders and re-labels everything here.
 */
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState('For you');
  const [pickerOpen, setPickerOpen] = useState(false);
  const { ranked, learned, precise, locationStatus } = useRanked();

  const filtered = useMemo(() => filterRanked(ranked, filter), [ranked, filter]);
  const rows = useMemo(() => buildRows(ranked, learned), [ranked, learned]);
  const filtering = filter !== 'For you';

  const subtitle = !learned
    ? 'Answer a few questions in Ask and these reorder around you'
    : locationStatus === 'granted' && precise
      ? `${ranked.length} places, nearest and best-fit first`
      : `${ranked.length} places, sorted by how well they fit you today`;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + spacing.xl, paddingBottom: spacing.xxxl }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="display" size={32}>
          Discover
        </Text>
        <View style={{ marginTop: 10, alignSelf: 'flex-start' }}>
          <LocationPill onPress={() => setPickerOpen(true)} />
        </View>
        <Text variant="body" size={13} color={colors.ink50} style={{ marginTop: 8 }}>
          {subtitle}
        </Text>
      </View>

      <LocationPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <PillButton
          label="Surprise me"
          icon="✦"
          variant="ink"
          compact
          onPress={() => {
            const pick = ranked[Math.floor(Math.random() * Math.min(5, ranked.length))];
            if (pick) router.push(`/place/${pick.place.id}`);
          }}
        />
        {FILTERS.map((f) => (
          <PillButton key={f} label={f} variant="outline" compact selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      {filtering ? (
        <View style={styles.rows}>
          <View>
            <View style={styles.rowHead}>
              <Text variant="serif" size={21} style={{ flex: 1 }}>
                {filter}
              </Text>
              <Kicker size={10} color={colors.ink45}>
                {filtered.length} places
              </Kicker>
            </View>
            {filtered.length === 0 ? (
              <Text variant="body" size={13} color={colors.ink50} style={styles.rowNote}>
                Nothing here yet — try another filter.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowScroll}>
                {filtered.map((rp) => (
                  <PlaceCard key={rp.place.id} rp={rp} />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.key}>
              <View style={styles.rowHead}>
                <Text variant="serif" size={21} style={{ flex: 1 }}>
                  {row.title}
                </Text>
                <Kicker accent size={10} style={styles.seeAll}>
                  See all
                </Kicker>
              </View>
              <Text variant="body" size={12} color={colors.ink50} style={styles.rowNote}>
                {row.note}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowScroll}>
                {row.items.map((rp) => (
                  <PlaceCard key={rp.place.id} rp={rp} />
                ))}
              </ScrollView>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.xl, paddingBottom: 14 },
  filters: { gap: 7, paddingHorizontal: spacing.xl, paddingBottom: 18 },
  rows: { gap: 28, paddingTop: 20 },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
    paddingHorizontal: spacing.xl,
    paddingBottom: 4,
  },
  seeAll: { letterSpacing: 0.6 },
  rowNote: { paddingHorizontal: spacing.xl, paddingBottom: 14 },
  rowScroll: { gap: 12, paddingHorizontal: spacing.xl },
});
