import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { BrandMark } from '@/components/BrandMark';
import { colors, spacing, radius } from '@/theme/tokens';
import { useTogether } from '@/core/together';
import type { Hop, HopStatus } from '@/core/together';

/** Has an upcoming (not-yet-past) ticket worth surfacing on the hub. */
function hasUpcomingTicket(hop: Hop | null): boolean {
  if (!hop || hop.status !== 'planned') return false;
  if (hop.planDate) {
    const when = new Date(`${hop.planDate}T${hop.planTime ?? '23:59'}:00`);
    return when.getTime() >= Date.now() - 24 * 60 * 60 * 1000; // grace window
  }
  return true; // slot-only planned hops (code-invite path) have no date to compare — assume upcoming
}

/** Route the resume button to the screen for the hop's current status. */
type HopRoute =
  | '/together/plan/invite'
  | '/together/plan/quiz'
  | '/together/plan/matches'
  | '/together/plan/datetime'
  | '/together/plan/ticket';

export function statusRoute(status: HopStatus): HopRoute {
  switch (status) {
    case 'lobby':
      return '/together/plan/invite';
    case 'answering':
      return '/together/plan/quiz';
    case 'swiping':
      return '/together/plan/matches';
    case 'picked':
      return '/together/plan/datetime';
    case 'planned':
      return '/together/plan/ticket';
  }
}

const STATUS_LABEL: Record<HopStatus, string> = {
  lobby: 'Gathering the table',
  answering: 'Everyone answering',
  swiping: 'Swiping the shortlist',
  picked: 'A place cleared the table',
  planned: 'Time locked in',
};

/**
 * The Together hub. No active hop → the intro + start / join. Active hop →
 * a resume card that routes to wherever the hop currently is.
 */
export default function TogetherScreen() {
  const router = useRouter();
  const hydrated = useTogether((s) => s.hydrated);
  const hop = useTogether((s) => s.hop);
  const leaveHop = useTogether((s) => s.leaveHop);

  if (!hydrated) return <Screen>{null}</Screen>;

  if (hop) return <ResumeHub hop={hop} onLeave={leaveHop} />;

  return (
    <>
      <AppHeader variant="root" />
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <BrandMark size={22} style={styles.titleMark} />
          <Text variant="display" size={30}>
            Decide as a group.
          </Text>
        </View>
      </View>
      <Screen padTop={false} contentStyle={styles.introContent}>
      <View style={styles.introCenter}>
      <Text variant="serif" size={19} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
        Invite friends, everyone answers a few questions privately, then swipe to
        a place that clears the whole table.
      </Text>

      <PillButton
        label="Plan with friends"
        variant="outline"
        style={{ marginBottom: spacing.lg }}
        onPress={() => router.push('/together/plan/invite')}
      />

      {hasUpcomingTicket(hop) ? <TicketsEntryCard onPress={() => router.push('/together/tickets')} /> : null}

      <Card style={{ marginBottom: spacing.lg }}>
        <Kicker style={{ marginBottom: 10 }}>How a hop works</Kicker>
        {[
          'Start a hop and invite the table',
          'Everyone answers privately — no account needed to join',
          'Swipe the shortlist; Hoppr matches the overlap',
          'Lock a place and a time that actually works',
        ].map((line, i) => (
          <View key={line} style={styles.step}>
            <Text variant="kicker" size={10} color={colors.accent} style={styles.num}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Text variant="body" size={14} color={colors.ink72} style={{ flex: 1 }}>
              {line}
            </Text>
          </View>
        ))}
      </Card>

      <PillButton
        label="Join a hop"
        variant="outline"
        onPress={() => router.push('/together/plan/join')}
      />
      </View>
      </Screen>
    </>
  );
}

function TicketsEntryCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ticketsCard, pressed && { opacity: 0.9 }]}>
      <View style={{ flex: 1 }}>
        <Kicker style={{ marginBottom: 4 }}>Your tickets</Kicker>
        <Text variant="body" size={13} color={colors.ink55}>
          See what you&apos;ve got planned, past and upcoming.
        </Text>
      </View>
      <Text variant="kicker" size={11} color={colors.accent}>
        Open →
      </Text>
    </Pressable>
  );
}

function ResumeHub({ hop, onLeave }: { hop: Hop; onLeave: () => void }) {
  const router = useRouter();
  return (
    <>
      <AppHeader variant="root" />
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <BrandMark size={22} style={styles.titleMark} />
          <Text variant="display" size={30}>
            {hop.title}
          </Text>
        </View>
      </View>
      <Screen padTop={false}>

      {hasUpcomingTicket(hop) ? <TicketsEntryCard onPress={() => router.push('/together/tickets')} /> : null}

      <Card accent style={{ marginBottom: spacing.lg }}>
        <View style={styles.avatarRow}>
          {hop.members.map((m) => (
            <View key={m.id} style={styles.avatar}>
              <Text variant="body" size={18}>
                {m.emoji}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="body" size={13} color={colors.ink55} style={{ marginBottom: spacing.md }}>
          {hop.members.map((m) => m.name).join(', ')}
        </Text>
        <Kicker accent style={{ marginBottom: 4 }}>
          {STATUS_LABEL[hop.status]}
        </Kicker>
        <Text variant="kicker" size={10} color={colors.ink40}>
          {hop.code}
        </Text>

        <PillButton
          label="Continue"
          variant="solid"
          style={{ marginTop: spacing.lg }}
          onPress={() => router.push(statusRoute(hop.status))}
        />
      </Card>

      <Pressable onPress={onLeave} style={styles.leave}>
        <Text variant="bodyMedium" size={13} color={colors.ink55}>
          Leave hop
        </Text>
      </Pressable>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  introContent: { flexGrow: 1 },
  introCenter: { flex: 1, justifyContent: 'center' },
  titleBlock: { paddingHorizontal: spacing.xl, paddingBottom: 12, backgroundColor: colors.paper },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleMark: { marginRight: 8 },
  ticketsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 7 },
  num: { width: 20, paddingTop: 3 },
  avatarRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leave: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink25,
    paddingBottom: 3,
  },
});
