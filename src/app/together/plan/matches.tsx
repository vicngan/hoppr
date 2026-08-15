import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { PlaceImage } from '@/components/PlaceImage';
import { SwipeStack } from '@/components/together/SwipeStack';
import { colors, spacing } from '@/theme/tokens';
import { PLACES, CATEGORY_LABEL } from '@/core/places';
import { TAG_LABELS } from '@/core/taste/tags';
import { useTaste } from '@/core/taste/store';
import { applyWeightDeltas } from '@/core/taste/profile';
import { BOTS, botMember, groupFit } from '@/core/together';
import type { HopMember } from '@/core/together';
import { usePlanStore } from '@/core/together/plan-store';

const CANDIDATE_COUNT = 4;

/**
 * Step 4 of 8, blank-path only. Real match.ts scoring (groupFit — avg taste
 * fit + min-veto penalty) over you + invited bot friends, nudged by the
 * quiz's tag picks. No fabricated copy: the "why" line names the actual
 * shared tags driving the score.
 */
export default function PlanMatchesScreen() {
  const router = useRouter();
  const taste = useTaste((s) => s.profile);
  const quizTags = usePlanStore((s) => s.quizTags);
  const invitees = usePlanStore((s) => s.invitees);
  const setFromPlace = usePlanStore((s) => s.setFromPlace);

  const ranked = useMemo(() => {
    // A local nudge of *your* profile by the quiz picks — never written back
    // to `taste/store.ts` (same rule as a hop's private answers).
    const deltas = Object.fromEntries(quizTags.map((t) => [t, 0.3])) as Partial<
      Record<(typeof quizTags)[number], number>
    >;
    const youProfile = applyWeightDeltas(taste, deltas);
    const you: HopMember = {
      id: 'you',
      name: 'You',
      kind: 'you',
      emoji: '🐇',
      answered: true,
      profile: youProfile,
      swipes: {},
      swipedDone: false,
    };
    const friends: HopMember[] = invitees
      .filter((i) => i.source === 'bot')
      .map((i) => BOTS.find((b) => b.id === i.id))
      .filter((b): b is (typeof BOTS)[number] => !!b)
      .map(botMember);
    const members = [you, ...friends];

    return PLACES.map((place) => {
      const score = groupFit(members, place.tags);
      const sharedTags = place.tags.filter((t) => (youProfile.weights[t] ?? 0) > 0.15);
      return { place, score, sharedTags };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, CANDIDATE_COUNT);
  }, [taste, quizTags, invitees]);

  const choose = (placeId: string) => {
    setFromPlace(placeId);
    router.push('/together/plan/datetime');
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="sub" title="Plan together" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 4 of 8
        </Kicker>
        <Text variant="display" size={26} style={{ marginBottom: 8 }}>
          A few spots that fit.
        </Text>
        <Text variant="serif" size={16} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
          Scored against you and the table&apos;s known tastes. Swipe through, or tap the one you want.
        </Text>

        <SwipeStack
          items={ranked}
          keyOf={(r) => r.place.id}
          onLike={(r) => choose(r.place.id)}
          height={440}
          emptyState={
            <>
              <Text variant="serif" size={20} center>
                That&apos;s everyone for now
              </Text>
              <Text variant="body" size={13} color={colors.ink50} center style={{ marginTop: 8 }}>
                Pick a different place to see more.
              </Text>
            </>
          }
          renderCard={({ place, score, sharedTags }) => {
            const why =
              sharedTags.length > 0
                ? `Matches on ${sharedTags.slice(0, 2).map((t) => TAG_LABELS[t]?.toLowerCase() ?? t).join(' & ')}.`
                : 'A safe overall fit for the table.';
            return (
              <>
                <PlaceImage coords={place.coords} photo={place.photo} width="100%" height={220} mapSize={600} />
                <View style={{ padding: spacing.lg }}>
                  <View style={styles.row}>
                    <Text variant="serif" size={22}>
                      {place.name}
                    </Text>
                    <Text variant="kicker" size={11} color={colors.accent}>
                      {Math.round(score * 100)}%
                    </Text>
                  </View>
                  <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 4, marginBottom: 8 }}>
                    {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
                  </Text>
                  <Text variant="body" size={13} color={colors.ink72} numberOfLines={2}>
                    {why}
                  </Text>
                </View>
              </>
            );
          }}
        />

        <PillButton
          label="Pick a different place"
          variant="outline"
          style={{ marginTop: spacing.lg }}
          onPress={() => router.push('/explore')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
