import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { colors, spacing, radius } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { useTogether } from '@/core/together';
import type { Hop, HopStatus } from '@/core/together';

/** Route the resume button to the screen for the hop's current status. */
type HopRoute = '/hop/lobby' | '/hop/answer' | '/hop/swipe' | '/hop/pick' | '/hop/plan';

export function statusRoute(status: HopStatus): HopRoute {
  switch (status) {
    case 'lobby':
      return '/hop/lobby';
    case 'answering':
      return '/hop/answer';
    case 'swiping':
      return '/hop/swipe';
    case 'picked':
      return '/hop/pick';
    case 'planned':
      return '/hop/plan';
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
  const startHop = useTogether((s) => s.startHop);
  const leaveHop = useTogether((s) => s.leaveHop);

  const [naming, setNaming] = useState(false);
  const [title, setTitle] = useState('');

  if (!hydrated) return <Screen>{null}</Screen>;

  if (hop) return <ResumeHub hop={hop} onLeave={leaveHop} />;

  const start = () => {
    startHop(title);
    setTitle('');
    setNaming(false);
    router.push('/hop/lobby');
  };

  return (
    <Screen>
      <Kicker accent style={{ marginBottom: 9 }}>
        Together
      </Kicker>
      <Text variant="display" size={30} style={{ marginBottom: 8 }}>
        Decide as a group.
      </Text>
      <Text variant="serif" size={19} color={colors.ink80} style={{ marginBottom: spacing.xxl }}>
        Invite friends, everyone answers a few questions privately, then swipe to
        a place that clears the whole table.
      </Text>

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

      {naming ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Kicker style={{ marginBottom: 8 }}>Name this hop</Kicker>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Friday, somewhere good"
            placeholderTextColor={colors.ink40}
            style={styles.input}
            autoFocus
            returnKeyType="go"
            onSubmitEditing={start}
          />
          <PillButton label="Create hop" variant="solid" style={{ marginTop: spacing.md }} onPress={start} />
        </Card>
      ) : (
        <PillButton label="Start a hop" variant="solid" onPress={() => setNaming(true)} />
      )}

      <PillButton
        label="Join a hop"
        variant="outline"
        style={{ marginTop: spacing.sm }}
        onPress={() => router.push('/hop/join')}
      />
    </Screen>
  );
}

function ResumeHub({ hop, onLeave }: { hop: Hop; onLeave: () => void }) {
  const router = useRouter();
  return (
    <Screen>
      <Kicker accent style={{ marginBottom: 9 }}>
        Your hop
      </Kicker>
      <Text variant="display" size={30} style={{ marginBottom: spacing.lg }}>
        {hop.title}
      </Text>

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
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 7 },
  num: { width: 20, paddingTop: 3 },
  input: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink16,
    paddingVertical: 8,
  },
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
