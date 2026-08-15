import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Text, Card, Kicker } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { SuggestionReveal } from '@/components/ask/SuggestionReveal';
import { TogetherIcon, DiceIcon, GemIcon } from '@/theme/icons';
import { colors, radius, spacing } from '@/theme/tokens';
import { useRanked, fmtDistance } from '@/core/discovery';
import { isHiddenGem } from '@/core/places';
import { useLibrary } from '@/core/library/store';
import { useOnboarding } from '@/core/onboarding/store';
import { computeStreak } from '@/core/library/streak';

/**
 * Home tab root (replaces `(tabs)/ask.tsx`). Dark hero CTA into the Ask flow
 * and Deck, a hidden-gems rail, a "live now" spotlight, and a friends teaser
 * into Together.
 *
 * Open items (see report):
 *  - "Live now" / "Your friends are going" have no backing data source in
 *    `core/` (no events store, no cross-user activity feed) — rendered as a
 *    static teaser card per SPEC.md §8's "no error/loading/empty states"
 *    guidance being silent here; these route to real screens (`/place/[id]`,
 *    `/together/vote`) so the taps are real even though the card content is
 *    illustrative placeholder text, not live data.
 *
 * Streak and display name are read from the same sources `profile.tsx` uses
 * (`library/store.ts`'s rating timestamps via the shared `computeStreak`,
 * and `onboarding/store.ts`'s `name`) so both screens agree.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { ranked, loading } = useRanked();
  const ratings = useLibrary((s) => s.ratings);
  const name = useOnboarding((s) => s.name);
  const [surpriseVisible, setSurpriseVisible] = useState(false);

  const gems = useMemo(() => ranked.filter((r) => isHiddenGem(r.place)).slice(0, 6), [ranked]);
  const spotlight = ranked[0];
  const surprisePicks = useMemo(() => ranked.slice(0, 5), [ranked]);
  const streak = useMemo(
    () => computeStreak(Object.values(ratings).map((r) => r.at)),
    [ratings],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <AppHeader
        variant="root"
        showProfileDot
        showBell
        onBellPress={() => router.push('/notifications' as Href)}
        streak={streak > 0 ? streak : undefined}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Kicker color={colors.onDark} style={styles.heroKicker}>
            {name ? `Good evening, ${name}` : 'Good evening'}
          </Kicker>
          <Text variant="display" size={28} color={colors.onDark} style={styles.heroTitle}>
            What should I do tonight?
          </Text>
          <View style={styles.heroRow}>
            <Pressable
              onPress={() => router.push('/ask/chips' as Href)}
              style={({ pressed }) => [styles.askCta, pressed && { opacity: 0.85 }]}>
              <Text variant="bodyMedium" size={15} color={colors.onDark}>
                Ask Hoppr
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSurpriseVisible(true)}
              hitSlop={8}
              style={({ pressed }) => [styles.diceBtn, pressed && { opacity: 0.7 }]}>
              <DiceIcon size={20} color={colors.onDark} />
            </Pressable>
          </View>
        </View>

        {/* Hidden gems rail */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionHeadTitle}>
              <GemIcon size={16} color={colors.accent} />
              <Text variant="serif" size={20}>
                Hidden gems for you
              </Text>
            </View>
            <Pressable onPress={() => router.push('/gems' as Href)} hitSlop={8}>
              <Text variant="bodyMedium" size={13} color={colors.accent}>
                See all
              </Text>
            </Pressable>
          </View>
          {!loading && gems.length === 0 ? (
            <Text variant="body" size={13} color={colors.ink45}>
              Answer a few questions and gems will start turning up here.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {gems.map((r, i) => (
                <Pressable
                  key={r.place.id}
                  onPress={() => router.push(`/place/${r.place.id}`)}
                  style={styles.gemCard}>
                  <PlaceImage
                    coords={r.place.coords}
                    photo={r.place.photo}
                    width="100%"
                    height={110}
                    radius={radius.lg}>
                    <View style={styles.gemBadge}>
                      <Text variant="kicker" size={9} color={colors.onDark}>
                        {r.match}% match
                      </Text>
                    </View>
                  </PlaceImage>
                  <Text variant="bodyMedium" size={14} style={{ marginTop: 8 }} numberOfLines={1}>
                    {r.place.name}
                  </Text>
                  <Text variant="kicker" size={9} color={colors.ink45}>
                    {r.place.area} · {fmtDistance(r.distanceMi)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Live now */}
        {spotlight ? (
          <View style={styles.section}>
            <Text variant="serif" size={20} style={{ marginBottom: spacing.md }}>
              Live now
            </Text>
            <Card onPress={() => router.push(`/place/${spotlight.place.id}`)} padded={false} style={styles.liveCard}>
              <PlaceImage
                coords={spotlight.place.coords}
                photo={spotlight.place.photo}
                width="100%"
                height={140}
                radius={0}
              />
              <View style={{ padding: spacing.lg }}>
                <Kicker accent style={{ marginBottom: 6 }}>
                  Happening tonight
                </Kicker>
                <Text variant="serif" size={18}>
                  {spotlight.place.name}
                </Text>
                <Text variant="body" size={13} color={colors.ink60} style={{ marginTop: 4 }}>
                  {spotlight.place.blurb}
                </Text>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Friends going */}
        <View style={styles.section}>
          <Text variant="serif" size={20} style={{ marginBottom: spacing.md }}>
            Your friends are going
          </Text>
          <Card onPress={() => router.push('/together/vote' as Href)} style={styles.friendsCard}>
            <View style={styles.friendsIconWrap}>
              <TogetherIcon size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" size={15}>
                A group is voting on tonight&apos;s plan
              </Text>
              <Text variant="body" size={12} color={colors.ink45} style={{ marginTop: 2 }}>
                Tap to see what&apos;s in the running.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <SuggestionReveal
        visible={surpriseVisible}
        onClose={() => setSurpriseVisible(false)}
        candidates={surprisePicks}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  hero: {
    backgroundColor: colors.ink,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radius.sheet,
    padding: spacing.xl,
  },
  heroKicker: { marginBottom: spacing.sm, opacity: 0.7 },
  heroTitle: { marginBottom: spacing.xl },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  askCta: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  diceBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(247,242,232,0.2)',
    backgroundColor: 'rgba(247,242,232,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionHeadTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  railContent: { gap: spacing.md, paddingRight: spacing.xl },
  gemCard: { width: 150 },
  gemBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,17,13,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    margin: 8,
  },
  liveCard: { overflow: 'hidden' },
  friendsCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  friendsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
