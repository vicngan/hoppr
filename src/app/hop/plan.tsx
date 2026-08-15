import { useEffect } from 'react';
import { View, StyleSheet, Pressable, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, spacing, radius } from '@/theme/tokens';
import { useTogether, TIME_SLOTS, winningSlot, YOU_ID } from '@/core/together';
import { usePlace } from '@/core/places-store';
import { CATEGORY_LABEL } from '@/core/places';

/**
 * The light plan — vote a time, lock it, then a share card the host can send.
 * Bots auto-vote keyless, so the tally is always live.
 */
export default function PlanScreen() {
  const router = useRouter();
  const hydrated = useTogether((s) => s.hydrated);
  const hop = useTogether((s) => s.hop);
  const voteSlot = useTogether((s) => s.voteSlot);
  const lockSlot = useTogether((s) => s.lockSlot);
  const leaveHop = useTogether((s) => s.leaveHop);

  const pick = usePlace(hop?.pickId ?? undefined);

  useEffect(() => {
    if (hydrated && !hop) router.replace('/together');
  }, [hydrated, hop, router]);

  if (!hydrated || !hop) return <Screen>{null}</Screen>;

  const planned = hop.status === 'planned';
  const wonId = planned ? hop.slotId : winningSlot(hop);
  const wonSlot = TIME_SLOTS.find((s) => s.id === wonId);
  const youVoted = TIME_SLOTS.some((s) => (hop.slotVotes[s.id] ?? []).includes(YOU_ID));

  const nameFor = (id: string) => hop.members.find((m) => m.id === id)?.name ?? id;
  const coming = hop.members.map((m) => m.name).join(', ');

  const doShare = async () => {
    const when = wonSlot ? `${wonSlot.day} at ${wonSlot.time}` : 'a time TBD';
    const where = pick ? pick.name : 'somewhere good';
    try {
      await Share.share({
        message: `${hop.title}: ${where}, ${when}. Coming: ${coming}. — via Hoppr`,
      });
    } catch {
      // best-effort — nothing to do if the sheet is dismissed
    }
  };

  const startAnother = () => {
    leaveHop();
    router.replace('/together');
  };

  if (planned) {
    return (
      <Screen>
        <Kicker accent center style={{ marginBottom: 10 }}>
          Locked in
        </Kicker>
        <Text variant="display" size={30} center style={{ marginBottom: spacing.lg }}>
          It&apos;s a plan.
        </Text>

        <Card accent padded={false} style={{ marginBottom: spacing.lg }}>
          {pick ? (
            <PlaceImage coords={pick.coords} photo={pick.photo} width="100%" height={180} mapSize={800} />
          ) : null}
          <View style={styles.shareBody}>
            <Kicker style={{ marginBottom: 6 }}>{hop.title}</Kicker>
            <Text variant="serif" size={24} style={{ marginBottom: 4 }}>
              {pick ? pick.name : 'Somewhere good'}
            </Text>
            {pick ? (
              <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 12 }}>
                {[CATEGORY_LABEL[pick.category], pick.area].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            <View style={styles.shareLine}>
              <Text variant="kicker" size={10} color={colors.accent} style={styles.shareLabel}>
                When
              </Text>
              <Text variant="bodyMedium" size={15}>
                {wonSlot ? `${wonSlot.day} · ${wonSlot.time}` : 'To be decided'}
              </Text>
            </View>
            <View style={styles.shareLine}>
              <Text variant="kicker" size={10} color={colors.accent} style={styles.shareLabel}>
                Coming
              </Text>
              <Text variant="body" size={14} color={colors.ink72} style={{ flex: 1 }}>
                {coming}
              </Text>
            </View>
          </View>
        </Card>

        <PillButton label="Share" variant="solid" onPress={doShare} />
        <Pressable onPress={startAnother} style={styles.subtle}>
          <Text variant="bodyMedium" size={13} color={colors.ink55}>
            Start another hop
          </Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Kicker accent style={{ marginBottom: 10 }}>
        The light plan
      </Kicker>
      <Text variant="display" size={30} style={{ marginBottom: 8 }}>
        When works?
      </Text>
      <Text variant="serif" size={18} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
        Vote a time. The table&apos;s votes land as you go.
      </Text>

      {pick ? (
        <Text variant="body" size={13} color={colors.ink55} style={{ marginBottom: spacing.lg }}>
          For {pick.name}.
        </Text>
      ) : null}

      {TIME_SLOTS.map((slot) => {
        const votes = hop.slotVotes[slot.id] ?? [];
        const mine = votes.includes(YOU_ID);
        return (
          <Pressable
            key={slot.id}
            onPress={() => voteSlot(slot.id)}
            style={({ pressed }) => [styles.slot, mine && styles.slotOn, { opacity: pressed ? 0.9 : 1 }]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" size={16}>
                {slot.day} · {slot.time}
              </Text>
              {votes.length > 0 ? (
                <Text variant="body" size={12} color={colors.ink55} style={{ marginTop: 3 }}>
                  {votes.map(nameFor).join(', ')}
                </Text>
              ) : (
                <Text variant="body" size={12} color={colors.ink40} style={{ marginTop: 3 }}>
                  No votes yet
                </Text>
              )}
            </View>
            <View style={[styles.count, mine && styles.countOn]}>
              <Text variant="kicker" size={11} color={mine ? colors.onDark : colors.ink45}>
                {votes.length}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <PillButton
        label={wonSlot ? `Lock in ${wonSlot.day} ${wonSlot.time}` : 'Lock it in'}
        variant="solid"
        style={{ marginTop: spacing.lg, opacity: youVoted ? 1 : 0.4 }}
        onPress={youVoted ? lockSlot : undefined}
      />
      {!youVoted ? (
        <Text variant="body" size={12} color={colors.ink45} center style={{ marginTop: spacing.sm }}>
          Cast your vote to lock a time.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink12,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  slotOn: { borderColor: colors.accent, borderWidth: 1.5 },
  count: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  shareBody: { padding: 18 },
  shareLine: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  shareLabel: { width: 48 },
  subtle: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink25,
    paddingBottom: 3,
  },
});
