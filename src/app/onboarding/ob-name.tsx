import { useState } from 'react';
import { TextInput, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboarding } from '@/core/onboarding/store';

export default function ObNameScreen() {
  const router = useRouter();
  const name = useOnboarding((s) => s.name);
  const setField = useOnboarding((s) => s.setField);
  const [value, setValue] = useState(name);

  const next = () => {
    setField('name', value.trim());
    router.push('/onboarding/ob-energy' as never);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader progress={0.08} onBack={() => router.back()} />

        <View style={styles.body}>
          <Kicker accent style={styles.kicker}>
            FIRST, THE BASICS
          </Kicker>
          <Text variant="display" style={styles.headline}>
            What should we call you?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            First name is plenty.
          </Text>

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Your name"
            placeholderTextColor={colors.ink40}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={next}
            style={styles.input}
          />
        </View>
      </View>

      <PillButton
        label="Continue"
        variant="solid"
        onPress={next}
        style={value.trim().length === 0 ? styles.disabled : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: {},
  body: { paddingTop: spacing.md },
  kicker: { marginBottom: spacing.md },
  headline: { marginBottom: spacing.sm },
  sub: { marginBottom: spacing.xxl },
  input: {
    borderWidth: 1.5,
    borderColor: colors.ink14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: 17,
    color: colors.ink,
  },
  disabled: { opacity: 0.5 },
});
