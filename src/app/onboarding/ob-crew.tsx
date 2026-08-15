import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ChoiceRow } from '@/components/onboarding/ChoiceRow';
import { useOnboarding } from '@/core/onboarding/store';

const OPTIONS = [
  { id: 'solo', label: 'Solo & happy', icon: '🧍' },
  { id: 'one-friend', label: 'One good friend', icon: '👯' },
  { id: 'crew', label: 'The whole crew', icon: '🎉' },
  { id: 'date', label: 'Date night', icon: '💕' },
];

export default function ObCrewScreen() {
  const router = useRouter();
  const crew = useOnboarding((s) => s.crew);
  const setField = useOnboarding((s) => s.setField);

  const choose = (id: string) => {
    setField('crew', id);
    router.push('/onboarding/ob-when' as never);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader progress={0.54} stepLabel="STEP 4 OF 8" onBack={() => router.back()} />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            Who&apos;s usually with you?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            Pick what&apos;s most common.
          </Text>

          <View style={styles.list}>
            {OPTIONS.map((opt) => (
              <ChoiceRow
                key={opt.id}
                label={opt.label}
                icon={<Text size={18}>{opt.icon}</Text>}
                selected={crew === opt.id}
                onPress={() => choose(opt.id)}
              />
            ))}
          </View>
        </View>
      </View>

      <PillButton
        label="Continue"
        variant="solid"
        onPress={() => router.push('/onboarding/ob-when' as never)}
        style={!crew ? styles.disabled : undefined}
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
