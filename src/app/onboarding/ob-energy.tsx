import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ChoiceTile } from '@/components/onboarding/ChoiceTile';
import { useOnboarding } from '@/core/onboarding/store';

const OPTIONS = [
  { id: 'chill', label: 'Chill' },
  { id: 'loud', label: 'Loud & late' },
  { id: 'artsy', label: 'Artsy' },
  { id: 'active', label: 'Active' },
  { id: 'foodie', label: 'Foodie' },
  { id: 'exploring', label: 'Just exploring' },
];

export default function ObEnergyScreen() {
  const router = useRouter();
  const energy = useOnboarding((s) => s.energy);
  const setField = useOnboarding((s) => s.setField);

  const toggle = (id: string) => {
    setField('energy', energy.includes(id) ? energy.filter((e) => e !== id) : [...energy, id]);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader progress={0.18} stepLabel="STEP 1 OF 8" onBack={() => router.back()} />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            What&apos;s your kind of night?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            Pick as many as fit.
          </Text>

          <View style={styles.grid}>
            {OPTIONS.map((opt) => (
              <ChoiceTile
                key={opt.id}
                label={opt.label}
                selected={energy.includes(opt.id)}
                onPress={() => toggle(opt.id)}
              />
            ))}
          </View>
        </View>
      </View>

      <PillButton
        label={`Continue${energy.length ? ` · ${energy.length} picked` : ''}`}
        variant="solid"
        onPress={() => router.push('/onboarding/ob-interests' as never)}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
