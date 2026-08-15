import { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { AppHeader } from '@/components/AppHeader';
import { colors, radius, spacing } from '@/theme/tokens';
import { useTaste } from '@/core/taste/store';
import { useLibrary } from '@/core/library/store';
import { useOnboarding } from '@/core/onboarding/store';
import { useLocationStore } from '@/core/location-store';
import { usePlacesStore } from '@/core/places-store';
import { confidentTraits } from '@/core/taste/profile';
import { TAG_LABELS } from '@/core/taste/tags';
import { CATEGORY_LABEL, type Place } from '@/core/places';
import { computeStreak } from '@/core/library/streak';
import { StreakFlagIcon, SettingsIcon } from '@/theme/icons';

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

  const streak = useMemo(
    () => computeStreak(Object.values(ratings).map((r) => r.at)),
    [ratings],
  );

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
      <Screen>
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
            <Text variant="display" size={24}>
              {displayName}
            </Text>
            <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 4 }}>
              {locationLabel}
            </Text>
            <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 2 }}>
              {savedCount} saved · {beenCount} been · {profile.answers.length} learned
            </Text>
          </View>
        </View>

        <View style={styles.streakCard}>
          <Text style={styles.streakSparkle}>✦</Text>
          <View style={styles.streakIconWrap}>
            <StreakFlagIcon size={22} color={colors.onDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" size={15} color={colors.onDark}>
              {streak > 0 ? `${streak}-night streak` : 'No streak yet'}
            </Text>
            <Text variant="body" size={12} color="rgba(247,242,232,0.6)" style={{ marginTop: 2 }}>
              based on rated visits
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text variant="serif" size={26} color={colors.onDark}>
              {beenCount}
            </Text>
            <Text variant="kicker" size={9} color="rgba(247,242,232,0.5)">
              NIGHTS
            </Text>
          </View>
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

        <Kicker style={{ marginBottom: 12, marginTop: spacing.md }}>Your taste</Kicker>
        {traits.length > 0 ? (
          <View style={styles.tagWrap}>
            {traits.map(([tag]) => (
              <View key={tag} style={styles.tagPill}>
                <Text variant="bodyMedium" size={12} color={colors.ink}>
                  {TAG_LABELS[tag]}
                </Text>
              </View>
            ))}
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.xl },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.ink14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  streakSparkle: { position: 'absolute', top: -4, right: 10, fontSize: 16, color: 'rgba(200,67,28,0.6)' },
  streakIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  tagPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink14,
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
});
