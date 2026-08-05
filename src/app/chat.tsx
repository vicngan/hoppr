import { View, StyleSheet } from 'react-native';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { colors, radius, spacing } from '@/theme/tokens';

type Msg = { from: 'hoppr' | 'you'; text: string };
const THREAD: Msg[] = [
  { from: 'hoppr', text: "Okay, talk to me. What's the afternoon actually for?" },
  { from: 'you', text: 'Somewhere I can read for a couple hours.' },
  { from: 'hoppr', text: 'Quiet, then. Do you want coffee within reach or is a proper cafe worth a short walk?' },
];

/** Conversational discovery. Slice 1 makes this a live, learning thread. */
export default function ChatScreen() {
  return (
    <Screen scroll contentStyle={{ paddingTop: 60 }}>
      <View style={styles.header}>
        <BackButton />
        <Text variant="bodyMedium" size={15}>
          Hoppr
        </Text>
        <Text variant="kicker" size={11} color={colors.ink45}>
          thinking with you
        </Text>
      </View>

      <View style={styles.thread}>
        {THREAD.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              m.from === 'you' ? styles.you : styles.hoppr,
            ]}>
            <Text variant="body" size={14} color={m.from === 'you' ? colors.onDark : colors.ink}>
              {m.text}
            </Text>
          </View>
        ))}

        <Card accent style={styles.result}>
          <Kicker accent style={{ marginBottom: 9 }}>
            Top of five
          </Kicker>
          <Text variant="serif" size={22}>
            Otterbein Coffee
          </Text>
          <Text variant="kicker" size={10} color={colors.ink45} style={{ marginVertical: 8 }}>
            Cafe · Kerrytown · 0.4 mi
          </Text>
          <Text variant="body" size={13} color={colors.ink72}>
            Quiet until noon, outlets everywhere, and nobody rushes you.
          </Text>
        </Card>
      </View>

      <View style={styles.replies}>
        {['Within reach', 'Worth the walk', 'Surprise me'].map((r) => (
          <PillButton key={r} label={r} compact onPress={() => {}} />
        ))}
      </View>
      <Text variant="body" size={11} color={colors.ink40} style={{ marginTop: 10 }}>
        or type it yourself
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  thread: { gap: 12, paddingVertical: 18 },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 14 },
  hoppr: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.ink12 },
  you: { alignSelf: 'flex-end', backgroundColor: colors.ink },
  result: { alignSelf: 'flex-start', maxWidth: '92%', marginTop: 4 },
  replies: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: spacing.sm },
});
