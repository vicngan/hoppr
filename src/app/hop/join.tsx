import { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { useTogether } from '@/core/together';

/**
 * No-account join. Keyless: "Join the demo hop" drops you into a bot-hosted hop
 * mid-flight. The real code-based join needs a connected backend (surfaced).
 */
export default function JoinScreen() {
  const router = useRouter();
  const simulateJoin = useTogether((s) => s.simulateJoin);
  const joinHop = useTogether((s) => s.joinHop);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const demo = () => {
    simulateJoin(name.trim() || 'You');
    router.replace('/hop/answer');
  };

  const joinReal = async () => {
    setNote(null);
    try {
      await joinHop(code.trim(), name.trim() || 'You');
      router.replace('/hop/answer');
    } catch {
      setNote('Joining a live hop needs a connected backend. Try the demo hop below — no account needed.');
    }
  };

  return (
    <Screen>
      <Kicker accent style={{ marginBottom: 9 }}>
        No account needed
      </Kicker>
      <Text variant="display" size={30} style={{ marginBottom: 8 }}>
        Join a hop.
      </Text>
      <Text variant="serif" size={18} color={colors.ink80} style={{ marginBottom: spacing.xxl }}>
        Got a code from a friend? Drop in, answer a few questions, and swipe.
      </Text>

      <Card style={{ marginBottom: spacing.lg }}>
        <Kicker style={{ marginBottom: 8 }}>Your name</Kicker>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="What should we call you?"
          placeholderTextColor={colors.ink40}
          style={styles.input}
        />

        <Kicker style={{ marginTop: spacing.lg, marginBottom: 8 }}>Join code</Kicker>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="HOP-4KQ"
          placeholderTextColor={colors.ink40}
          autoCapitalize="characters"
          style={[styles.input, styles.mono]}
        />

        <PillButton
          label="Join with code"
          variant="outline"
          style={{ marginTop: spacing.lg }}
          onPress={joinReal}
        />
      </Card>

      {note ? (
        <Text variant="body" size={13} color={colors.accent} style={{ marginBottom: spacing.lg }}>
          {note}
        </Text>
      ) : null}

      <View style={styles.divider}>
        <Text variant="kicker" size={10} color={colors.ink40}>
          or try it now
        </Text>
      </View>

      <PillButton label="Join the demo hop" variant="solid" onPress={demo} />
      <Text variant="body" size={12} color={colors.ink45} center style={{ marginTop: spacing.sm }}>
        Drops you into a hop with two friends already answering.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink16,
    paddingVertical: 8,
  },
  mono: { fontFamily: fonts.monoMedium, letterSpacing: 1 },
  divider: { alignItems: 'center', marginBottom: spacing.lg },
});
