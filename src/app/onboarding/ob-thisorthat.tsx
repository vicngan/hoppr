import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboarding } from '@/core/onboarding/store';

const PAIRS: { key: string; a: { id: string; label: string }; b: { id: string; label: string } }[] = [
  { key: 'venue', a: { id: 'patio', label: 'Patio' }, b: { id: 'basement', label: 'Basement' } },
  { key: 'music', a: { id: 'dj', label: 'DJ set' }, b: { id: 'band', label: 'Live band' } },
  {
    key: 'entry',
    a: { id: 'reservation', label: 'Reservation' },
    b: { id: 'walk-in', label: 'Walk right in' },
  },
];

/** "STEP 6 · GUT CHECK" — three quick forced-choice pairs, no overthinking. */
export default function ObThisOrThatScreen() {
  const router = useRouter();
  const thisOrThat = useOnboarding((s) => s.thisOrThat);
  const setField = useOnboarding((s) => s.setField);

  const pick = (key: string, id: string) => {
    setField('thisOrThat', { ...thisOrThat, [key]: id });
  };

  const allAnswered = PAIRS.every((p) => thisOrThat[p.key]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader
          progress={0.76}
          stepLabel="STEP 6 OF 8 · GUT CHECK"
          onBack={() => router.back()}
        />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            This or that?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            Gut reaction — don&apos;t overthink it.
          </Text>

          <View style={styles.pairs}>
            {PAIRS.map((pair) => (
              <View key={pair.key} style={styles.pairRow}>
                {[pair.a, pair.b].map((opt) => {
                  const selected = thisOrThat[pair.key] === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => pick(pair.key, opt.id)}
                      style={({ pressed }) => [
                        styles.option,
                        selected ? styles.optionSelected : styles.optionUnselected,
                        pressed && { opacity: 0.85 },
                      ]}>
                      <Text
                        variant="bodyMedium"
                        size={15}
                        color={selected ? colors.onDark : colors.ink}
                        center>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      <PillButton
        label="Continue"
        variant="solid"
        onPress={() => router.push('/onboarding/ob-dietary' as never)}
        style={!allAnswered ? styles.disabled : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: {},
  body: { paddingTop: spacing.lg },
  headline: { marginBottom: spacing.sm },
  sub: { marginBottom: spacing.xl },
  pairs: { gap: spacing.lg },
  pairRow: { flexDirection: 'row', gap: spacing.md },
  option: {
    flex: 1,
    minHeight: 64,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  optionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionUnselected: { backgroundColor: colors.card, borderColor: colors.ink14 },
  disabled: { opacity: 0.5 },
});
