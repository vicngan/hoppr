import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Text, Kicker } from '@/components/ui';
import { PlaceCard } from '@/components/PlaceCard';
import { CategoryPills } from '@/components/explore/CategoryPills';
import { MapSheet } from '@/components/explore/MapSheet';
import { colors, radius, spacing } from '@/theme/tokens';
import { ExploreIcon, TogetherIcon, ArrowRightIcon } from '@/theme/icons';
import { useRanked, buildRows } from '@/core/discovery';
import { CATEGORY_LABEL, isHiddenGem, type PlaceCategory } from '@/core/places';

type ExploreMode = 'browse' | 'map' | 'mapExpanded';

const ALL = 'All';

/**
 * Explore tab root — replaces `(tabs)/discover.tsx`. `exploreMode` and
 * `exploreCategory` are local, ephemeral UI state (not a global store) per
 * the design's own scope: they never need to survive a navigation away from
 * this screen.
 */
export default function ExploreScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ExploreMode>('browse');
  const [category, setCategory] = useState<string>(ALL);
  const [query, setQuery] = useState('');
  const { ranked, learned } = useRanked();

  // Category list derived from the real dataset's categories (not hardcoded
  // to the design's Food/Drink/Cafe/... list, which doesn't match this data).
  const categories = useMemo(() => {
    const present = new Set(ranked.map((r) => r.place.category));
    const labels = Array.from(present).map((c) => CATEGORY_LABEL[c as PlaceCategory]);
    return [ALL, ...labels.sort()];
  }, [ranked]);

  const categoryFiltered = useMemo(() => {
    if (category === ALL) return ranked;
    return ranked.filter((r) => CATEGORY_LABEL[r.place.category] === category);
  }, [ranked, category]);

  // Real filter over local place data — name/area substring match, layered
  // on top of the category filter above.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categoryFiltered;
    return categoryFiltered.filter(
      (r) => r.place.name.toLowerCase().includes(q) || r.place.area.toLowerCase().includes(q),
    );
  }, [categoryFiltered, query]);

  const rows = useMemo(() => buildRows(searched, learned), [searched, learned]);

  if (mode !== 'browse') {
    return (
      <View style={styles.root}>
        <View style={styles.headerAbove}>
          <AppHeader
            variant="root"
            right={
              <Pressable onPress={() => setMode('browse')} style={styles.mapCloseBtn} hitSlop={8}>
                <Text variant="bodyMedium" size={12} color={colors.ink}>
                  Browse
                </Text>
              </Pressable>
            }
          />
        </View>
        <View style={styles.mapFill}>
          <MapSheet ranked={searched} expanded={mode === 'mapExpanded'} onToggle={() => setMode(mode === 'mapExpanded' ? 'map' : 'mapExpanded')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppHeader variant="root" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headBlock}>
          <Text variant="display" size={30}>
            Explore
          </Text>
          <Pressable onPress={() => setMode('map')} style={styles.mapBtn}>
            <ExploreIcon size={15} color={colors.accent} />
            <Text variant="bodyMedium" size={12} color={colors.accent}>
              Map
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search places, areas…"
            placeholderTextColor={colors.ink45}
            style={styles.search}
          />
        </View>

        <View style={{ marginBottom: 18 }}>
          <CategoryPills categories={categories} active={category} onSelect={setCategory} />
        </View>

        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.key}>
              <View style={styles.rowHead}>
                <Text variant="serif" size={21} style={{ flex: 1 }}>
                  {row.title}
                </Text>
                <Pressable onPress={() => router.push(`/category/${row.key}`)}>
                  <Kicker accent size={10} style={{ letterSpacing: 0.6 }}>
                    See all
                  </Kicker>
                </Pressable>
              </View>
              <Text variant="body" size={12} color={colors.ink50} style={styles.rowNote}>
                {row.note}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowScroll}>
                {row.items.map((rp) => (
                  <View key={rp.place.id}>
                    <PlaceCard rp={rp} />
                    {isHiddenGem(rp.place) ? (
                      <View style={styles.gemBadge}>
                        <Text variant="kicker" size={8} color={colors.onDark}>
                          GEM
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push('/together/plan/invite')}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}>
          <View style={styles.ctaIconWrap}>
            <TogetherIcon size={20} color={colors.onDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" size={15} color={colors.onDark}>
              Plan something together
            </Text>
            <Text variant="body" size={12} color="rgba(247,242,232,0.6)" style={{ marginTop: 4 }}>
              Invite someone, answer a few questions, Hoppr finds the match
            </Text>
          </View>
          <ArrowRightIcon size={16} color={colors.onDark} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  headerAbove: { zIndex: 10 },
  mapFill: { flex: 1 },
  headBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 16,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.fill,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  mapCloseBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink14,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  searchWrap: { paddingHorizontal: spacing.xl, marginBottom: 16 },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink14,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: 14,
    color: colors.ink,
  },
  rows: { gap: 28 },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
    paddingHorizontal: spacing.xl,
    paddingBottom: 4,
  },
  rowNote: { paddingHorizontal: spacing.xl, paddingBottom: 14 },
  rowScroll: { gap: 12, paddingHorizontal: spacing.xl },
  gemBadge: {
    position: 'absolute',
    left: 9,
    top: 9,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: 8,
    backgroundColor: colors.ink,
    borderRadius: radius.xxl,
    padding: spacing.lg,
  },
  ctaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
