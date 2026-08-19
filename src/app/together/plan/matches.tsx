import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { PlaceImage } from '@/components/PlaceImage';
import { SwipeStack } from '@/components/together/SwipeStack';
import { DetailPopup } from '@/components/together/DetailPopup';
import { colors, spacing } from '@/theme/tokens';
import { PLACES, CATEGORY_LABEL, type Place } from '@/core/places';
import { useTaste } from '@/core/taste/store';
import { applyWeightDeltas } from '@/core/taste/profile';
import { BOTS, botMember, groupShortlist, foodAnswerDeltas, YOU_ID, useTogether } from '@/core/together';
import type { HopMember } from '@/core/together';
import { usePlanStore } from '@/core/together/plan-store';
import { useUserLocation } from '@/core/location';

/**
 * Step 3 of 8 — the redesigned swipe deck. 4-6 candidates, swipe or the
 * like/pass buttons, tap the card body to preview more (`DetailPopup`)
 * without losing your place in the deck. Dual-mode: a real hop (joiner path)
 * swipes against `hop.shortlist` via `together.swipe`; the host's wizard-
 * local path swipes against `plan-store`'s own `candidateIds`/`swipes`.
 */
export default function PlanMatchesScreen() {
  const router = useRouter();
  const taste = useTaste((s) => s.profile);
  const { coords } = useUserLocation();

  const hop = useTogether((s) => s.hop);
  const swipeReal = useTogether((s) => s.swipe);
  const finishSwiping = useTogether((s) => s.finishSwiping);

  const hopAnswers = usePlanStore((s) => s.hopAnswers);
  const invitees = usePlanStore((s) => s.invitees);
  const fromPlace = usePlanStore((s) => s.fromPlace);
  const candidateIds = usePlanStore((s) => s.candidateIds);
  const setCandidateIds = usePlanStore((s) => s.setCandidateIds);
  const setSwipe = usePlanStore((s) => s.setSwipe);

  const [detail, setDetail] = useState<Place | null>(null);
  const [swipedCount, setSwipedCount] = useState(0);

  const isLiveHop = !!hop;

  // Host path only: build the candidate pool once (real hop path already has
  // hop.shortlist, built by finishAnswering in quiz.tsx).
  const localCandidates = useMemo(() => {
    if (isLiveHop) return [];
    if (candidateIds.length > 0) return candidateIds;
    const you: HopMember = {
      id: YOU_ID,
      name: 'You',
      kind: 'you',
      emoji: '🐇',
      answered: true,
      profile: hopAnswers ? applyWeightDeltas(taste, foodAnswerDeltas(hopAnswers)) : taste,
      swipes: {},
      swipedDone: false,
    };
    const friends: HopMember[] = invitees
      .filter((i) => i.source === 'bot')
      .map((i) => BOTS.find((b) => b.id === i.id))
      .filter((b): b is (typeof BOTS)[number] => !!b)
      .map(botMember);
    const ids = groupShortlist([you, ...friends], PLACES, coords, {
      foodAnswers: hopAnswers,
      boostPlaceId: fromPlace,
    });
    setCandidateIds(ids);
    return ids;
    // only rebuild if the inputs that define the pool change — not on every swipe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveHop, candidateIds.length]);

  const ids = isLiveHop ? hop!.shortlist : localCandidates;
  const candidates = ids.map((id) => PLACES.find((p) => p.id === id)).filter((p): p is Place => !!p);
  const total = candidates.length;

  const recordSwipe = (place: Place, liked: boolean) => {
    if (isLiveHop) swipeReal(place.id, liked);
    else setSwipe(place.id, liked);
    setSwipedCount((c) => c + 1);
  };

  const finishDeck = () => {
    if (isLiveHop) {
      finishSwiping(PLACES);
      router.push('/together/plan/datetime');
    } else {
      router.push('/together/plan/datetime');
    }
  };

  const done = swipedCount >= total && total > 0;

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="wizard" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 3 of 8
        </Kicker>
        <Text variant="display" size={26} style={{ marginBottom: 8 }}>
          A few spots that fit.
        </Text>
        <Text variant="serif" size={16} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
          Scored against your answers and the table&apos;s known tastes. Swipe through
          all of them — tap a card to see more.
        </Text>

        {!done ? (
          <SwipeStack
            items={candidates}
            keyOf={(p) => p.id}
            onLike={(p) => recordSwipe(p, true)}
            onPass={(p) => recordSwipe(p, false)}
            onCardPress={(p) => setDetail(p)}
            height={440}
            emptyState={
              <>
                <Text variant="serif" size={20} center>
                  That&apos;s everyone for now
                </Text>
                <Text variant="body" size={13} color={colors.ink50} center style={{ marginTop: 8 }}>
                  Keep going to see what the table picked.
                </Text>
              </>
            }
            renderCard={(place) => (
              <>
                <PlaceImage coords={place.coords} photo={place.photo} width="100%" height={200} mapSize={600} />
                <View style={{ padding: spacing.lg }}>
                  <Text variant="serif" size={22} style={{ marginBottom: 4 }}>
                    {place.name}
                  </Text>
                  <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 8 }}>
                    {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text variant="body" size={12} color={colors.ink55}>
                      {place.hoursLabel ?? '—'}
                    </Text>
                    <Text variant="body" size={12} color={colors.ink55}>
                      {'$'.repeat(place.price)}
                    </Text>
                  </View>
                  <Text variant="body" size={13} color={colors.ink72} numberOfLines={2} style={{ marginTop: 8 }}>
                    {place.blurb}
                  </Text>
                </View>
              </>
            )}
          />
        ) : (
          <View style={styles.doneBlock}>
            <Text variant="serif" size={20} center style={{ marginBottom: 8 }}>
              That&apos;s the whole deck.
            </Text>
            <Text variant="body" size={13} color={colors.ink55} center style={{ marginBottom: spacing.xl }}>
              Next up: pick a date and time that works.
            </Text>
            <PillButton label="Continue" variant="solid" onPress={finishDeck} />
          </View>
        )}
      </View>

      <DetailPopup place={detail} onClose={() => setDetail(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  metaRow: { flexDirection: 'row', gap: spacing.md },
  doneBlock: { alignItems: 'center', paddingVertical: spacing.xxxl },
});
