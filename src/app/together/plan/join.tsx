import { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { useTogether } from '@/core/together';

/**
 * Joiner-only entry point (the Together hub's "Join a hop" button) — the
 * counterpart to `invite.tsx`'s host-start path. A real code join needs a
 * connected backend (surfaced below); the demo hop drops you into an
 * already-in-progress hop and routes into the same unified questions screen
 * a host would land on after `invite.tsx`'s "Continue".
 */
export default function PlanJoinScreen() {
  const router = useRouter();
  const simulateJoin = useTogether((s) => s.simulateJoin);
  const joinHop = useTogether((s) => s.joinHop);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const demo = () => {
    simulateJoin(name.trim() || 'You');
    router.replace('/together/plan/quiz');
  };

  const joinReal = async () => {
    setNote(null);
    try {
      await joinHop(code.trim(), name.trim() || 'You');
      router.replace('/together/plan/quiz');
    } catch {
      setNote('Joining a live hop needs a connected backend. Try the demo hop below — no account needed.');
    }
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="wizard" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          No account needed
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: 8 }}>
          Join a hop.
        </Text>
        <Text variant="serif" size={17} color={colors.ink80} style={{ marginBottom: spacing.xxl }}>
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
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
