import { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { AppHeader } from '@/components/AppHeader';
import { BrandMark } from '@/components/BrandMark';
import { colors, radius, spacing } from '@/theme/tokens';
import { useTaste } from '@/core/taste/store';
import { useLibrary } from '@/core/library/store';
import { useOnboarding } from '@/core/onboarding/store';
import { useLocationStore } from '@/core/location-store';
import { usePlacesStore } from '@/core/places-store';
import { confidentTraits } from '@/core/taste/profile';
import { TAG_LABELS } from '@/core/taste/tags';
import { CATEGORY_LABEL, type Place } from '@/core/places';
import { computeStreak, computeMaxStreak, computeStreakDays } from '@/core/library/streak';
import { StreakStrip } from '@/components/StreakStrip';
import { TagCloud } from '@/components/TagCloud';
import { SettingsIcon } from '@/theme/icons';

/**
 * Head row shows real name (`onboarding/store.ts`), real avatar photo (same
 * store's `photoUri`, from `ob-photo`), and real location (`location-store.ts`'s
 * `label` — reverse-geocoded city/region, e.g. "Ann Arbor, MI"). No
 * account-creation timestamp exists anywhere in the codebase (no `createdAt`
 * on any store, no backend row when running local-only), so "join date" from
 * the design is omitted rather than faked — flagging this as an open item;
 * it'd need a real field added to `onboarding/store.ts` (set once in
 * `markComplete`) to implement honestly.
 */

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useTaste((s) => s.profile);
  const reset = useTaste((s) => s.reset);
  const clearLibrary = useLibrary((s) => s.clear);
  const saved = useLibrary((s) => s.saved);
  const ratings = useLibrary((s) => s.ratings);
  const name = useOnboarding((s) => s.name);
  const photoUri = useOnboarding((s) => s.photoUri);
  const locationLabel = useLocationStore((s) => s.label);
  const byId = usePlacesStore((s) => s.byId);

  const savedCount = Object.keys(saved).length;
  const ratedIds = useMemo(
    () => Object.keys(ratings).sort((a, b) => ratings[b].at - ratings[a].at),
    [ratings],
  );
  const beenCount = ratedIds.length;
  const beenPlaces = ratedIds.map((id) => byId[id]).filter(Boolean) as Place[];

  const ratingTimestamps = useMemo(() => Object.values(ratings).map((r) => r.at), [ratings]);
  const streak = useMemo(() => computeStreak(ratingTimestamps), [ratingTimestamps]);
  const maxStreak = useMemo(() => computeMaxStreak(ratingTimestamps), [ratingTimestamps]);
  const streakDays = useMemo(() => computeStreakDays(ratingTimestamps), [ratingTimestamps]);

  const traits = useMemo(() => confidentTraits(profile).slice(0, 8), [profile]);
  const learned = profile.answers.length > 0;

  const displayName = name || 'You';

  return (
    <>
      <AppHeader
        variant="root"
        right={
          <Pressable
            onPress={() => router.push('/settings' as Href)}
            hitSlop={8}
            style={({ pressed }) => [styles.settingsBtn, pressed && { opacity: 0.6 }]}>
            <SettingsIcon size={16} color={colors.ink} />
          </Pressable>
        }
      />
      <View style={styles.headBlock}>
        <View style={styles.head}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImg} />
          ) : (
            <LinearGradient
              colors={[colors.avatarGradientFrom, colors.avatarGradientTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarImg}
            />
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <BrandMark size={18} style={styles.nameMark} />
              <Text variant="display" size={24}>
                {displayName}
              </Text>
            </View>
            <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 4 }}>
              {locationLabel}
            </Text>
            <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 2 }}>
              {savedCount} saved · {beenCount} been · {profile.answers.length} learned
            </Text>
          </View>
        </View>
      </View>

      <Screen padTop={false}>
        <View style={styles.streakStatsRow}>
          <View style={styles.streakStatTile}>
            <Text variant="display" size={22}>
              {streak}
            </Text>
            <Kicker style={{ marginTop: 4 }}>Night streak</Kicker>
          </View>
          <View style={styles.streakStatTile}>
            <Text variant="display" size={22}>
              {maxStreak}
            </Text>
            <Kicker style={{ marginTop: 4 }}>Max streak</Kicker>
          </View>
        </View>

        <Kicker style={{ marginBottom: spacing.sm }}>Daily streak</Kicker>
        <View style={{ marginBottom: spacing.xl }}>
          <StreakStrip days={streakDays} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text variant="display" size={22}>
              {beenCount}
            </Text>
            <Kicker style={{ marginTop: 4 }}>Been</Kicker>
          </View>
          <View style={styles.statTile}>
            <Text variant="display" size={22}>
              {savedCount}
            </Text>
            <Kicker style={{ marginTop: 4 }}>Saved</Kicker>
          </View>
          {/* No persistent friends/contacts data model exists anywhere in
              `src/core` (grepped for friend|contact) — `together/store.ts`'s
              "friends" are per-hop simulated bots (`kind: 'you' | 'friend'`),
              not a standing contacts list. 0 is a real, honest count of a
              feature that doesn't exist yet, not a fake number — flagging as
              an open item for whenever a real contacts/friends store lands. */}
          <View style={styles.statTile}>
            <Text variant="display" size={22}>
              0
            </Text>
            <Kicker style={{ marginTop: 4 }}>Friends</Kicker>
          </View>
        </View>

        {beenPlaces.length > 0 ? (
          <>
            <View style={styles.sectionHead}>
              <Text variant="serif" size={19}>
                Where you&apos;ve been
              </Text>
              <Text variant="bodyMedium" size={12} color={colors.accent}>
                Full recap
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.xl }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {beenPlaces.map((p) => (
                  <View key={p.id} style={styles.railCell}>
                    <PlaceImage coords={p.coords} photo={p.photo} height={84} radius={0} mapSize={220} />
                    <View style={{ padding: 10 }}>
                      <Text variant="serif" size={14} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text variant="kicker" size={8} color={colors.ink45} style={{ marginTop: 4 }}>
                        {CATEGORY_LABEL[p.category]}
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
            </ScrollView>
          </>
        ) : null}

        <Kicker style={{ marginBottom: 12, marginTop: spacing.md }}>Your likes</Kicker>
        {traits.length > 0 ? (
          <View style={styles.likesBox}>
            <TagCloud traits={traits} labels={TAG_LABELS} />
          </View>
        ) : (
          <Text variant="serif" size={16} color={colors.ink70} style={{ marginBottom: spacing.lg }}>
            Answer a few questions in Ask and this fills in.
          </Text>
        )}

        {(learned || savedCount > 0 || beenCount > 0) && (
          <PillButton
            label="Forget what you know about me"
            style={{ marginTop: spacing.xxl, borderColor: colors.ink20 }}
            onPress={() => {
              reset();
              clearLibrary();
            }}
          />
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  headBlock: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, backgroundColor: colors.paper },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  nameMark: { marginRight: 6 },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.ink14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakStatsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  streakStatTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingVertical: 16,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: spacing.xl,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingVertical: 16,
  },
  railCell: {
    width: 140,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    overflow: 'hidden',
  },
  likesBox: {
    backgroundColor: colors.panel,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
});
