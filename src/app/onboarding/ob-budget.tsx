import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ChoiceRow } from '@/components/onboarding/ChoiceRow';
import { useOnboarding } from '@/core/onboarding/store';

const OPTIONS = [
  { id: 'cheap', label: '$ Keep it cheap' },
  { id: 'comfortable', label: '$$ A comfortable night' },
  { id: 'splurge', label: '$$$ Treat myself' },
];

export default function ObBudgetScreen() {
  const router = useRouter();
  const budget = useOnboarding((s) => s.budget);
  const setField = useOnboarding((s) => s.setField);

  const choose = (id: string) => {
    setField('budget', id);
    router.push('/onboarding/ob-crew' as never);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader progress={0.42} stepLabel="STEP 3 OF 8" onBack={() => router.back()} />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            What&apos;s your usual budget?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            We&apos;ll weight suggestions accordingly.
          </Text>

          <View style={styles.list}>
            {OPTIONS.map((opt) => (
              <ChoiceRow
                key={opt.id}
                label={opt.label}
                selected={budget === opt.id}
                onPress={() => choose(opt.id)}
              />
            ))}
          </View>
        </View>
      </View>

      <PillButton
        label="Continue"
        variant="solid"
        onPress={() => router.push('/onboarding/ob-crew' as never)}
        style={!budget ? styles.disabled : undefined}
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
