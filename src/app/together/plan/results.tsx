import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { WhereItsGonnaBe } from '@/components/together/WhereItsGonnaBe';
import { colors, radius, spacing } from '@/theme/tokens';
import { PLACES, CATEGORY_LABEL, type Place } from '@/core/places';
import { useTaste } from '@/core/taste/store';
import { applyWeightDeltas } from '@/core/taste/profile';
import {
  BOTS,
  botMember,
  botSwipe,
  topPickFor,
  pickTallies,
  YOU_ID,
  useTogether,
  foodAnswerDeltas,
} from '@/core/together';
import type { Hop, HopMember } from '@/core/together';
import { usePlanStore } from '@/core/together/plan-store';

/**
 * Step 5 of 8 — one card per invitee (host included) showing *their own* top
 * swiped pick, not group overlap. "Where's it gonna be?" reveals the
 * deterministic group pick + backups and hands off to `reserve.tsx`.
 */
export default function PlanResultsScreen() {
  const router = useRouter();
  const taste = useTaste((s) => s.profile);
  const hop = useTogether((s) => s.hop);

  const hopAnswers = usePlanStore((s) => s.hopAnswers);
  const invitees = usePlanStore((s) => s.invitees);
  const candidateIds = usePlanStore((s) => s.candidateIds);
  const swipes = usePlanStore((s) => s.swipes);
  const setFromPlace = usePlanStore((s) => s.setFromPlace);

  const [revealing, setRevealing] = useState(false);

  const isLiveHop = !!hop;

  const candidates = useMemo(() => {
    const ids = isLiveHop ? hop!.shortlist : candidateIds;
    return ids.map((id) => PLACES.find((p) => p.id === id)).filter((p): p is Place => !!p);
  }, [isLiveHop, hop, candidateIds]);

  const members: HopMember[] = useMemo(() => {
    if (isLiveHop) return hop!.members;

    const you: HopMember = {
      id: YOU_ID,
      name: 'You',
      kind: 'you',
      emoji: '🐇',
      answered: true,
      profile: hopAnswers ? applyWeightDeltas(taste, foodAnswerDeltas(hopAnswers)) : taste,
      swipes,
      swipedDone: true,
    };
    const friends: HopMember[] = invitees
      .filter((i) => i.source === 'bot')
      .map((i) => BOTS.find((b) => b.id === i.id))
      .filter((b): b is (typeof BOTS)[number] => !!b)
      .map((seed) => {
        const m = botMember(seed);
        const memberSwipes: Record<string, boolean> = {};
        for (const p of candidates) memberSwipes[p.id] = botSwipe(m, p);
        return { ...m, swipes: memberSwipes, swipedDone: true };
      });
    return [you, ...friends];
  }, [isLiveHop, hop, hopAnswers, taste, swipes, invitees, candidates]);

  const fakeHop = useMemo(() => ({ shortlist: candidates.map((p) => p.id), members }) as Hop, [candidates, members]);
  const tallies = useMemo(() => pickTallies(fakeHop, candidates), [fakeHop, candidates]);

  const proceed = (placeId: string) => {
    setFromPlace(placeId);
    router.push('/together/plan/reserve');
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="wizard" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 5 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: 8 }}>
          Everyone&apos;s picks.
        </Text>
        <Text variant="serif" size={16} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
          Here&apos;s what each person swiped toward.
        </Text>

        {members.map((m) => {
          const topId = topPickFor(m, candidates);
          const place = candidates.find((p) => p.id === topId);
          return (
            <View key={m.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                {place ? (
                  <>
                    <Text variant="bodyMedium" size={16} color={colors.onDark}>
                      {place.name}
                    </Text>
                    <Text variant="body" size={12} color="rgba(247,242,232,0.6)" style={{ marginTop: 2 }}>
                      {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
                    </Text>
                  </>
                ) : (
                  <Text variant="bodyMedium" size={15} color="rgba(247,242,232,0.6)">
                    Still deciding…
                  </Text>
                )}
              </View>
              <View style={styles.avatarBlock}>
                <View style={styles.avatar}>
                  <Text variant="body" size={16}>
                    {m.emoji}
                  </Text>
                </View>
                <Text variant="kicker" size={9} color="rgba(247,242,232,0.5)" style={{ marginTop: 4 }}>
                  {m.id === YOU_ID ? 'YOU' : m.name.toUpperCase()}
                </Text>
              </View>
            </View>
          );
        })}

        <PillButton
          label="Where's it gonna be?"
          variant="solid"
          style={{ marginTop: spacing.lg }}
          onPress={() => setRevealing(true)}
        />
      </View>

      <WhereItsGonnaBe
        visible={revealing}
        tallies={tallies}
        places={candidates}
        onClose={() => setRevealing(false)}
        onReserve={proceed}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  avatarBlock: { alignItems: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(247,242,232,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
