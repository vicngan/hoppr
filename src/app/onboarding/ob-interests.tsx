import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ChoicePill } from '@/components/onboarding/ChoicePill';
import { useOnboarding } from '@/core/onboarding/store';

const OPTIONS = [
  { id: 'live-music', label: 'Live music' },
  { id: 'cocktail-bars', label: 'Cocktail bars' },
  { id: 'trivia-games', label: 'Trivia & games' },
  { id: 'dancing', label: 'Dancing' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'dive-bars', label: 'Dive bars' },
  { id: 'galleries', label: 'Galleries' },
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'late-night-eats', label: 'Late-night eats' },
];

export default function ObInterestsScreen() {
  const router = useRouter();
  const interests = useOnboarding((s) => s.interests);
  const setField = useOnboarding((s) => s.setField);

  const toggle = (id: string) => {
    setField(
      'interests',
      interests.includes(id) ? interests.filter((i) => i !== id) : [...interests, id],
    );
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader progress={0.3} stepLabel="STEP 2 OF 8" onBack={() => router.back()} />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            What are you into?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            Pick as many as fit.
          </Text>

          <View style={styles.wrap}>
            {OPTIONS.map((opt) => (
              <ChoicePill
                key={opt.id}
                label={opt.label}
                selected={interests.includes(opt.id)}
                onPress={() => toggle(opt.id)}
              />
            ))}
          </View>
        </View>
      </View>

      <PillButton
        label={`Continue${interests.length ? ` · ${interests.length} picked` : ''}`}
        variant="solid"
        onPress={() => router.push('/onboarding/ob-budget' as never)}
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
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
