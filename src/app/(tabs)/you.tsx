import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, MeterBar, PillButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { useTaste } from '@/core/taste/store';
import { confidentTraits } from '@/core/taste/profile';
import { TAG_LABELS } from '@/core/taste/tags';

/** Taste profile — "You, so far" — rendered live from what you've answered. */
export default function YouScreen() {
  const router = useRouter();
  const profile = useTaste((s) => s.profile);
  const reset = useTaste((s) => s.reset);

  const traits = useMemo(() => confidentTraits(profile).slice(0, 6), [profile]);
  const answers = profile.answers.length;
  const learned = answers > 0;

  const topThree = traits.slice(0, 3).map(([t]) => TAG_LABELS[t].toLowerCase());
  const summary = learned
    ? `So far: ${topThree.join(', ')}. The more you answer, the sharper this gets.`
    : 'Answer a few questions in Ask and this fills in — Hoppr learns what you actually like.';

  return (
    <Screen>
      <View style={styles.head}>
        <View style={styles.avatar} />
        <View>
          <Text variant="bodyMedium" size={14}>
            You
          </Text>
          <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 4 }}>
            {answers} {answers === 1 ? 'answer' : 'answers'}
          </Text>
        </View>
      </View>

      {learned && (
        <View style={styles.learned}>
          <Kicker style={{ marginBottom: 8 }}>Learned so far</Kicker>
          <Text variant="serif" size={16}>
            You keep leaning toward {topThree[0]}
            {topThree[1] ? ` and ${topThree[1]}` : ''}.
          </Text>
        </View>
      )}

      <Kicker style={{ marginBottom: 10 }}>
        {answers} {answers === 1 ? 'question' : 'questions'} answered
      </Kicker>
      <Text variant="display" size={30} style={{ marginBottom: 12 }}>
        You, so far
      </Text>
      <Text variant="serif" size={18} color={colors.ink80} style={{ marginBottom: spacing.xxl }}>
        {summary}
      </Text>

      {traits.length > 0 ? (
        <>
          <Kicker style={{ marginBottom: 14 }}>What we're fairly sure of</Kicker>
          <View style={{ gap: 14 }}>
            {traits.map(([tag, weight]) => (
              <View key={tag}>
                <View style={styles.traitHead}>
                  <Text variant="bodyMedium" size={13}>
                    {TAG_LABELS[tag]}
                  </Text>
                  <Text variant="kicker" size={10} color={colors.ink45}>
                    {Math.round(weight * 100)}%
                  </Text>
                </View>
                <MeterBar value={weight} height={4} />
              </View>
            ))}
          </View>
        </>
      ) : null}

      <PillButton
        label={learned ? 'Answer a few more questions' : 'Start answering'}
        variant={learned ? 'outline' : 'solid'}
        style={{ marginTop: spacing.xxl }}
        onPress={() => router.push('/(tabs)/ask')}
      />

      {learned && (
        <PillButton
          label="Forget what you know about me"
          style={{ marginTop: spacing.md, borderColor: colors.ink20 }}
          onPress={reset}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
  avatar: { width: 34, height: 34, borderRadius: 18, backgroundColor: '#ddd4c2' },
  learned: { backgroundColor: '#e7dfd0', borderRadius: radius.lg, padding: 16, marginBottom: 26 },
  traitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 },
});
