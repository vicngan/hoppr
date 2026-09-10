import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton, StripePlaceholder } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { BrandMark } from '@/components/BrandMark';
import { PlaceImage } from '@/components/PlaceImage';
import { TicketsBody } from '@/components/together/TicketsBody';
import { colors, spacing, radius } from '@/theme/tokens';
import { TogetherIcon, ArrowRightIcon } from '@/theme/icons';
import { useTogether } from '@/core/together';
import type { Hop, HopStatus } from '@/core/together';
import { usePlace } from '@/core/places-store';
import { CATEGORY_LABEL } from '@/core/places';

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

  if (hop?.status === 'planned') return <TicketsTab />;

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

/** Together tab once the active hop has a reservation — the Tickets list replaces the resume card entirely. */
function TicketsTab() {
  const router = useRouter();
  return (
    <>
      <AppHeader variant="root" />
      <View style={styles.titleBlock}>
        <View style={styles.ticketsTitleRow}>
          <View style={styles.titleRow}>
            <BrandMark size={22} style={styles.titleMark} />
            <Text variant="display" size={30}>
              Your tickets
            </Text>
          </View>
          <Pressable onPress={() => router.push('/together/plan/invite')} style={styles.startAnotherBtn}>
            <Text variant="bodyMedium" size={12} color={colors.accent}>
              Start another hop
            </Text>
          </Pressable>
        </View>
      </View>
      <Screen padTop={false}>
        <TicketsBody onPlan={() => router.push('/together/plan/invite')} />
      </Screen>
    </>
  );
}

/**
 * Together tab while a hop is active but not yet planned — a single ticket-
 * styled card (matches `TicketsBody`'s `TicketCard`) that resumes wherever
 * the hop's wizard step currently is, instead of the old standalone hub UI.
 */
function ResumeHub({ hop, onLeave }: { hop: Hop; onLeave: () => void }) {
  const router = useRouter();
  const picked = usePlace(hop.pickId ?? undefined);
  const continueTo = () => router.push(statusRoute(hop.status));

  return (
    <>
      <AppHeader variant="root" />
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <BrandMark size={22} style={styles.titleMark} />
          <Text variant="display" size={30}>
            Your tickets
          </Text>
        </View>
      </View>
      <Screen padTop={false}>
        <Card padded={false} accent onPress={continueTo} style={{ marginBottom: spacing.lg }}>
          {picked ? (
            <PlaceImage coords={picked.coords} photo={picked.photo} width="100%" height={150} mapSize={700} />
          ) : (
            <StripePlaceholder width="100%" height={150} radius={0}>
              <View style={styles.progressBanner}>
                <TogetherIcon size={22} color={colors.ink55} />
              </View>
            </StripePlaceholder>
          )}
          <View style={{ padding: spacing.md }}>
            <Kicker accent style={{ marginBottom: 4 }}>
              {STATUS_LABEL[hop.status]}
            </Kicker>
            <Text variant="serif" size={20} style={{ marginBottom: 4 }}>
              {picked ? picked.name : hop.title}
            </Text>
            <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 10 }}>
              {picked
                ? [CATEGORY_LABEL[picked.category], picked.area].filter(Boolean).join(' · ')
                : hop.code}
            </Text>
            <Text variant="body" size={12} color={colors.ink55} style={{ marginBottom: spacing.md }}>
              {hop.members.map((m) => m.name).join(', ')}
            </Text>

            <View style={styles.continueRow}>
              <Text variant="bodyMedium" size={13} color={colors.accent}>
                Continue
              </Text>
              <ArrowRightIcon size={14} color={colors.accent} />
            </View>
          </View>
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
  ticketsTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startAnotherBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
  },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 7 },
  num: { width: 20, paddingTop: 3 },
  progressBanner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  continueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  leave: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink25,
    paddingBottom: 3,
  },
});
