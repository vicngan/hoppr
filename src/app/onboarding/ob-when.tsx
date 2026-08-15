import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ChoiceRow } from '@/components/onboarding/ChoiceRow';
import { useOnboarding } from '@/core/onboarding/store';

const OPTIONS = [
  { id: 'weeknights', label: 'Weeknights, low-key' },
  { id: 'weekends', label: 'Weekends are the move' },
  { id: 'spontaneous', label: 'Totally spontaneous' },
];

export default function ObWhenScreen() {
  const router = useRouter();
  const when = useOnboarding((s) => s.when);
  const setField = useOnboarding((s) => s.setField);

  const choose = (id: string) => {
    setField('when', id);
    router.push('/onboarding/ob-thisorthat' as never);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader progress={0.64} stepLabel="STEP 5 OF 8" onBack={() => router.back()} />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            When do you usually go out?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            Pick what&apos;s most common.
          </Text>

          <View style={styles.list}>
            {OPTIONS.map((opt) => (
              <ChoiceRow
                key={opt.id}
                label={opt.label}
                selected={when === opt.id}
                onPress={() => choose(opt.id)}
              />
            ))}
          </View>
        </View>
      </View>

      <PillButton
        label="Continue"
        variant="solid"
        onPress={() => router.push('/onboarding/ob-thisorthat' as never)}
        style={!when ? styles.disabled : undefined}
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
  list: { gap: spacing.md },
  disabled: { opacity: 0.5 },
});
