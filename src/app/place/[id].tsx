import { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, radius, spacing, gradientPlaceholders } from '@/theme/tokens';
import { deriveSpecs, placeBadges, CATEGORY_LABEL } from '@/core/places';
import { usePlace } from '@/core/places-store';
import { useRanked, fmtDistance } from '@/core/discovery';
import { useLibrary, selectIsSaved, selectRating } from '@/core/library/store';
import { useTaste } from '@/core/taste/store';
import { useMenu, useMenuStore } from '@/core/menu/store';
import { recommendDish } from '@/core/menu/recommend';

/**
 * Cheap deterministic string hash → picks a stable gradient placeholder per
 * place id so the hero isn't always index 0 (SPEC.md §3).
 */
function hashIndex(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % mod;
}

/**
 * Static "vibe now" copy — there's no live-signal data source this pass
 * (no occupancy/noise feed), so this is placeholder copy keyed off the
 * place's own tags for a little variety, not a real live signal. Flagged
 * per SPEC.md §5.7 dead-CTA/placeholder judgment calls.
 */
function vibeChips(tags: readonly string[]): string[] {
  const chips: string[] = [];
  if (tags.includes('lively')) chips.push('Busy tonight');
  else if (tags.includes('quiet')) chips.push('Quiet right now');
  else chips.push('Steady crowd');
  if (tags.includes('group') || tags.includes('hangout')) chips.push('Chatty');
  if (tags.includes('solo') || tags.includes('study')) chips.push('Heads-down');
  return chips.slice(0, 2);
}

/**
 * Event vs. place: `src/core/places.ts` has no distinct event entity (no
 * `event` category, no ticket/date fields) — events are just places with a
 * vibe. So this special-cases the `detail-event` treatment inline rather
 * than adding a new route (see SCREEN_MAP.md's detail-event row). The
 * "live music tonight" framing is shown for lively bars only, and is a
 * visual/demo state — there's no real event calendar or ticketing pipeline.
 */
function isEventLike(category: string, tags: readonly string[]): boolean {
  return category === 'bar' && tags.includes('lively');
}

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
  const [reserveToast, setReserveToast] = useState(false);

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
        <PillButton label="Back to Explore" onPress={() => router.replace('/explore')} />
      </View>
    );
  }

  const badges = placeBadges(place);
  const meta = [CATEGORY_LABEL[place.category], place.area, fmtDistance(rp?.distanceMi ?? null)]
    .filter(Boolean)
    .join(' · ');
  const gradient = gradientPlaceholders[hashIndex(place.id, gradientPlaceholders.length)];
  const vibes = vibeChips(place.tags);
  const eventLike = isEventLike(place.category, place.tags);

  const onReserve = () => {
    setReserveToast(true);
    setTimeout(() => setReserveToast(false), 2200);
  };

  return (
    <View style={styles.root}>
      <AppHeader variant="sub" onBack={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: spacing.xxxl + 80 }}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[gradient.from, gradient.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          {eventLike ? (
            <View style={styles.eventBadge}>
              <Text variant="kicker" size={9} color={colors.onDark}>
                LIVE MUSIC TONIGHT · 8PM
              </Text>
            </View>
          ) : null}
        </LinearGradient>

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
          <Text variant="kicker" size={10} color={colors.ink50} style={{ marginBottom: 14 }}>
            {meta}
          </Text>

          {/* price / rating / distance chip row */}
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text variant="bodyMedium" size={12} color={colors.ink70}>
                {'$'.repeat(place.price)}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text variant="bodyMedium" size={12} color={colors.ink70}>
                ★ {(3.9 + place.popularity).toFixed(1)}
              </Text>
            </View>
            {rp?.distanceMi != null ? (
              <View style={styles.chip}>
                <Text variant="bodyMedium" size={12} color={colors.ink70}>
                  {fmtDistance(rp.distanceMi)}
                </Text>
              </View>
            ) : null}
            {rp ? (
              <View style={[styles.chip, styles.chipAccent]}>
                <Text variant="bodyMedium" size={12} color={colors.accent}>
                  {rp.match}% match
                </Text>
              </View>
            ) : null}
          </View>

          {/* vibe now — placeholder copy, no live-signal source this pass */}
          <View style={styles.vibeRow}>
            {vibes.map((v) => (
              <View key={v} style={styles.vibeChip}>
                <Text variant="kicker" size={9} color={colors.ink55}>
                  ● {v}
                </Text>
              </View>
            ))}
          </View>

          <Text variant="serif" size={19} style={{ marginBottom: spacing.xl }}>
            {rp?.reason ?? place.blurb}
          </Text>

          {eventLike ? (
            <Card style={{ marginBottom: spacing.lg }} onPress={() => router.push('/together/vote')}>
              <Kicker style={{ marginBottom: 8 }}>Tonight</Kicker>
              <Text variant="bodyMedium" size={14}>
                Maya, Devon +1 are going
              </Text>
              <Text variant="kicker" size={10} color={colors.accent} style={{ marginTop: 10 }}>
                See who&apos;s in →
              </Text>
            </Card>
          ) : null}

          {/* primary CTAs */}
          <View style={{ gap: 10, marginBottom: spacing.xxl }}>
            <PillButton
              label={eventLike ? 'Get tickets · $10' : 'Help me order'}
              variant="solid"
              onPress={() =>
                eventLike
                  ? onReserve()
                  : router.push(`/menu/${place.id}`)
              }
            />
            <Pressable
              onPress={() => router.push(`/together/plan/invite?fromPlace=${place.id}`)}
              style={styles.dashedCta}>
              <Text variant="bodyMedium" size={14} color={colors.ink}>
                Plan this with someone
              </Text>
            </Pressable>
          </View>

          <Kicker style={{ marginBottom: 12 }}>The specs · from visitors</Kicker>
          <View style={styles.specGrid}>
            {specs.map((s) => (
              <View key={s.label} style={styles.spec}>
                <Text variant="kicker" size={9} color={colors.ink42}>
                  {s.label}
                </Text>
                <Text variant="bodyMedium" size={13} style={{ marginTop: 7 }}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>

          {/* menu section: personalized best bet + plain items */}
          <Kicker style={{ marginTop: 26, marginBottom: 12 }}>Menu</Kicker>
          {dish ? (
            <Card accent style={{ marginBottom: 12 }} onPress={() => router.push(`/menu/${place.id}`)}>
              <Kicker accent style={{ marginBottom: 8 }}>
                Best bet for you
              </Kicker>
              <View style={styles.dishHead}>
                <Text variant="serif" size={20} style={{ flex: 1 }}>
                  {dish.item.name}
                </Text>
                {dish.item.price != null ? (
                  <Text variant="bodyMedium" size={12} style={{ fontFamily: 'JetBrainsMono_500Medium' }}>
                    ${dish.item.price.toFixed(2)}
                  </Text>
                ) : null}
              </View>
              <Text variant="body" size={13} color={colors.ink70} style={{ marginTop: 8 }}>
                {dish.reason}
              </Text>
            </Card>
          ) : (
            <Card style={{ marginBottom: 12 }} onPress={() => router.push(`/menu/${place.id}`)}>
              <Text variant="serif" size={18}>
                No menu here yet.
              </Text>
              <Text variant="body" size={13} color={colors.ink70} style={{ marginTop: 8 }}>
                Snap a photo of the menu and Hoppr will read it and pick what fits you.
              </Text>
            </Card>
          )}
          {menu.slice(0, 4).map((it) => (
            <View key={it.id} style={styles.menuRow}>
              <Text variant="bodyMedium" size={13} style={{ flex: 1 }}>
                {it.name}
              </Text>
              {it.price != null ? (
                <Text variant="bodyMedium" size={12} color={colors.ink60}>
                  ${it.price.toFixed(2)}
                </Text>
              ) : null}
            </View>
          ))}
          {menu.length > 0 ? (
            <Pressable onPress={() => router.push(`/menu/${place.id}`)} style={{ marginTop: 10 }}>
              <Text variant="kicker" size={10} color={colors.accent}>
                See the full menu →
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      {/* sticky bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => toggleSave(place)}
          hitSlop={8}
          style={[styles.bookmarkBtn, saved && styles.bookmarkBtnOn]}>
          <Text variant="bodyMedium" size={18} color={saved ? colors.onDark : colors.ink}>
            {saved ? '★' : '☆'}
          </Text>
        </Pressable>
        <Pressable onPress={onReserve} style={styles.reserveBtn}>
          <Text variant="bodyMedium" size={14} color={colors.onDark}>
            Reserve a table
          </Text>
        </Pressable>
      </View>

      {reserveToast ? (
        <View style={[styles.toast, { bottom: insets.bottom + 78 }]}>
          <Text variant="bodyMedium" size={12} color={colors.onDark}>
            {eventLike ? 'Ticketing is coming soon.' : 'Reservations are coming soon.'}
          </Text>
        </View>
      ) : null}

      {rating ? null : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { flex: 1 },
  missing: { flex: 1, gap: 16, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: colors.paper },
  hero: { height: 220, width: '100%', justifyContent: 'flex-end', padding: spacing.xl },
  eventBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,17,13,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  body: { padding: spacing.xl },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  badge: { borderWidth: 1, borderColor: colors.ink16, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 9 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink12,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipAccent: { borderColor: colors.accent, backgroundColor: 'rgba(200,67,28,0.08)' },
  vibeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  vibeChip: {
    backgroundColor: colors.fill,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dashedCta: {
    borderWidth: 1.5,
    borderColor: colors.ink20,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink08,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.ink10,
  },
  bookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtnOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  reserveBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
});
