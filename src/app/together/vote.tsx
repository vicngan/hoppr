import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Screen, Text, Kicker, Card, PillButton, MeterBar } from '@/components/ui';
import { colors, spacing, radius } from '@/theme/tokens';
import { useTogether, YOU_ID, TIME_SLOTS, winningSlot, type TimeSlot } from '@/core/together';

/**
 * "Where are we landing?" — the group time-slot poll. Presentation only: all
 * tallying is `together/match.ts`'s existing deterministic `TIME_SLOTS` /
 * `winningSlot`, and the vote action is `together/store.ts`'s existing
 * `voteSlot` (which, keyless, also settles the bots' votes). This screen adds
 * no new voting logic — it's a real UI over real state.
 */
export default function VoteScreen() {
  const router = useRouter();
  const hop = useTogether((s) => s.hop);
  const voteSlot = useTogether((s) => s.voteSlot);
  const lockSlot = useTogether((s) => s.lockSlot);

  const voters = hop?.members.length ?? 0;
  const leaderId = hop ? winningSlot(hop) : null;
  const yourVote = hop
    ? TIME_SLOTS.find((s) => hop.slotVotes[s.id]?.includes(YOU_ID))?.id ?? null
    : null;
  const totalVotes = hop
    ? TIME_SLOTS.reduce((sum, s) => sum + (hop.slotVotes[s.id]?.length ?? 0), 0)
    : 0;
  // A "clear" winner: at least everyone but you has weighed in, and someone leads.
  const canLock = !!hop && !!leaderId && totalVotes >= Math.max(1, voters - 1);

  const onLockIn = () => {
    lockSlot();
    router.push('/chat');
  };

  if (!hop) {
    return (
      <>
        <AppHeader variant="sub" title="Vote" onBack={() => router.back()} />
        <Screen>
          <Text variant="body" size={14} color={colors.ink55}>
            No active hop to vote on right now.
          </Text>
        </Screen>
      </>
    );
  }

  return (
    <>
      <AppHeader variant="sub" title="Vote" onBack={() => router.back()} />
      <Screen>
        <Kicker accent style={{ marginBottom: 9 }}>
          Where are we landing?
        </Kicker>
        <Text variant="display" size={26} style={{ marginBottom: spacing.lg }}>
          {hop.title}
        </Text>

        {TIME_SLOTS.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            hop={hop}
            voters={voters}
            isLeader={slot.id === leaderId}
            isYours={slot.id === yourVote}
            onVote={() => voteSlot(slot.id)}
          />
        ))}

        <PillButton
          label={canLock ? 'Lock in the winner' : 'Waiting on more votes…'}
          variant="solid"
          style={{ marginTop: spacing.md, opacity: canLock ? 1 : 0.5 }}
          onPress={canLock ? onLockIn : undefined}
        />
      </Screen>
    </>
  );
}

function SlotCard({
  slot,
  hop,
  voters,
  isLeader,
  isYours,
  onVote,
}: {
  slot: TimeSlot;
  hop: NonNullable<ReturnType<typeof useTogether.getState>['hop']>;
  voters: number;
  isLeader: boolean;
  isYours: boolean;
  onVote: () => void;
}) {
  const voterIds = useMemo(() => hop.slotVotes[slot.id] ?? [], [hop.slotVotes, slot.id]);
  const count = voterIds.length;
  const fraction = voters > 0 ? count / voters : 0;
  const votingMembers = useMemo(
    () => voterIds.map((id) => hop.members.find((m) => m.id === id)).filter(Boolean),
    [voterIds, hop.members],
  );

  return (
    <Card accent={isLeader} style={styles.card}>
      <View style={styles.headRow}>
        <View>
          <Text variant="serif" size={19}>
            {slot.day}
          </Text>
          <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 2 }}>
            {slot.time}
          </Text>
        </View>
        {isLeader ? (
          <Kicker accent size={10}>
            Leading
          </Kicker>
        ) : null}
      </View>

      <MeterBar value={fraction} style={{ marginVertical: spacing.sm }} />

      <View style={styles.footRow}>
        <View style={styles.avatarStack}>
          {votingMembers.slice(0, 5).map((m, i) => (
            <View key={m!.id} style={[styles.avatar, i > 0 && { marginLeft: -8 }]}>
              <Text size={13}>{m!.emoji}</Text>
            </View>
          ))}
          <Text variant="body" size={12} color={colors.ink45} style={{ marginLeft: 8 }}>
            {count} {count === 1 ? 'vote' : 'votes'}
          </Text>
        </View>

        <PillButton
          label={isYours ? '✓ You voted' : 'Vote for this'}
          compact
          variant="outline"
          selected={isYours}
          onPress={onVote}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  footRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    borderWidth: 1.5,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
