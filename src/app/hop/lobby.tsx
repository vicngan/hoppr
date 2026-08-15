import { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { colors, spacing, radius } from '@/theme/tokens';
import { useTogether, BOTS, selectYou } from '@/core/together';

/**
 * Lobby — gather the table. Toggle seeded friends on/off, share the join code,
 * then kick off the private answers.
 */
export default function LobbyScreen() {
  const router = useRouter();
  const hydrated = useTogether((s) => s.hydrated);
  const hop = useTogether((s) => s.hop);
  const invite = useTogether((s) => s.invite);
  const uninvite = useTogether((s) => s.uninvite);
  const beginAnswers = useTogether((s) => s.beginAnswers);

  useEffect(() => {
    if (hydrated && !hop) router.replace('/together');
  }, [hydrated, hop, router]);

  if (!hydrated || !hop) return <Screen>{null}</Screen>;

  const you = selectYou(hop);
  const invited = new Set(hop.members.map((m) => m.id));
  const friendCount = hop.members.filter((m) => m.kind === 'friend').length;

  const start = () => {
    beginAnswers();
    router.replace('/hop/answer');
  };

  return (
    <Screen>
      <Kicker accent style={{ marginBottom: 9 }}>
        The table
      </Kicker>
      <Text variant="display" size={30} style={{ marginBottom: 8 }}>
        Who&apos;s coming?
      </Text>
      <Text variant="serif" size={18} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
        You&apos;re in. Add a few friends — they&apos;ll answer on their own.
      </Text>

      <Card style={styles.codeCard}>
        <View style={{ flex: 1 }}>
          <Kicker style={{ marginBottom: 4 }}>Share to join</Kicker>
          <Text variant="kicker" size={16} color={colors.accent}>
            {hop.code}
          </Text>
        </View>
        <Text variant="body" size={12} color={colors.ink45}>
          no account needed
        </Text>
      </Card>

      {you ? (
        <View style={[styles.row, styles.youRow]}>
          <View style={styles.avatar}>
            <Text variant="body" size={18}>
              {you.emoji}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" size={15}>
              {you.name} · host
            </Text>
            <Text variant="body" size={12} color={colors.ink55}>
              That&apos;s you
            </Text>
          </View>
        </View>
      ) : null}

      {BOTS.map((bot) => {
        const on = invited.has(bot.id);
        return (
          <Pressable
            key={bot.id}
            onPress={() => (on ? uninvite(bot.id) : invite(bot.id))}
            style={({ pressed }) => [styles.row, on && styles.rowOn, { opacity: pressed ? 0.9 : 1 }]}>
            <View style={[styles.avatar, on && styles.avatarOn]}>
              <Text variant="body" size={18}>
                {bot.emoji}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" size={15}>
                {bot.name}
              </Text>
              <Text variant="body" size={12} color={colors.ink55}>
                {bot.blurb}
              </Text>
            </View>
            <View style={[styles.toggle, on && styles.toggleOn]}>
              <Text variant="kicker" size={9} color={on ? colors.onDark : colors.ink45}>
                {on ? 'IN' : 'ADD'}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <PillButton
        label={friendCount < 1 ? 'Add at least one friend' : "Everyone's in — start"}
        variant="solid"
        style={{ marginTop: spacing.lg, opacity: friendCount < 1 ? 0.4 : 1 }}
        onPress={friendCount < 1 ? undefined : start}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink12,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  rowOn: { borderColor: colors.accent, borderWidth: 1.5 },
  youRow: { borderColor: colors.ink16 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOn: { backgroundColor: colors.paper },
  toggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.ink16,
    backgroundColor: colors.card,
  },
  toggleOn: { backgroundColor: colors.ink, borderColor: colors.ink },
});
