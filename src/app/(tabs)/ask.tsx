import { useMemo } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton, Kicker, ProgressDots, Card } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { useTaste } from '@/core/taste/store';
import { engine } from '@/core/engine';
import { useNextQuestion } from '@/core/discovery';
import { QUESTIONS } from '@/core/questions';
import { PLACES } from '@/core/places';
import { DEFAULT_CENTER } from '@/core/location';

/**
 * The opening screen. Runs the discovery question flow: each answer teaches the
 * taste profile (persisted), and the engine serves the next most useful
 * question. When the bank is exhausted it reveals the current top pick.
 */
export default function AskScreen() {
  const router = useRouter();
  const profile = useTaste((s) => s.profile);
  const answer = useTaste((s) => s.answer);
  const reset = useTaste((s) => s.reset);

  const { question, answeredCount } = useNextQuestion(PLACES, null);
  const askedIds = useMemo(() => profile.answers.map((a) => a.questionId), [profile.answers]);

  // exhausted the bank → show the current best pick
  if (!question) {
    const top = engine.rankPlaces({
      profile,
      places: PLACES,
      userCoords: DEFAULT_CENTER,
      askedIds,
    })[0];
    return (
      <Screen contentStyle={styles.center}>
        <Image source={require('@/assets/brand/hoppr-mark.png')} style={styles.mark} resizeMode="contain" />
        <Kicker center accent style={styles.kicker}>
          That's plenty for now
        </Kicker>
        <Text variant="display" center style={styles.q}>
          I've got a read on you.
        </Text>
        <Text variant="body" center color={colors.ink50} style={styles.sub}>
          Here's the one at the top of your list today.
        </Text>

        {top && (
          <Card accent style={styles.result} onPress={() => router.push(`/place/${top.place.id}`)}>
            <Kicker accent style={{ marginBottom: 9 }}>
              Top of {PLACES.length}
            </Kicker>
            <Text variant="serif" size={22}>
              {top.place.name}
            </Text>
            <Text variant="kicker" size={10} color={colors.ink45} style={{ marginVertical: 8 }}>
              {top.match}% match · {top.place.area}
            </Text>
            <Text variant="body" size={13} color={colors.ink72}>
              {top.reason}
            </Text>
          </Card>
        )}

        <PillButton
          label="See all in Discover"
          variant="solid"
          style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
          onPress={() => router.push('/(tabs)/discover')}
        />
        <Pressable onPress={reset} style={styles.talk}>
          <Text variant="bodyMedium" size={13} color={colors.ink55}>
            Start fresh
          </Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.center}>
      <Image source={require('@/assets/brand/hoppr-mark.png')} style={styles.mark} resizeMode="contain" />

      <Kicker center style={styles.kicker}>
        {question.kicker}
      </Kicker>
      <Text variant="display" center style={styles.q}>
        {question.prompt}
      </Text>
      {question.sub ? (
        <Text variant="body" center color={colors.ink50} style={styles.sub}>
          {question.sub}
        </Text>
      ) : (
        <View style={{ height: spacing.md }} />
      )}

      <View style={styles.options}>
        {question.options.map((opt) => (
          <PillButton key={opt.id} label={opt.label} onPress={() => answer(question, opt)} />
        ))}
      </View>

      <ProgressDots count={QUESTIONS.length} active={Math.min(answeredCount, QUESTIONS.length)} />

      <Pressable onPress={() => router.push('/chat')} style={styles.talk}>
        <Text variant="bodyMedium" size={13} color={colors.ink55}>
          Rather talk it out
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  mark: { width: 120, height: 92, marginBottom: 14 },
  kicker: { marginBottom: 14 },
  q: { marginBottom: 10, paddingHorizontal: 8 },
  sub: { marginBottom: spacing.xxl },
  options: { width: '100%', maxWidth: 340, gap: 9, marginBottom: spacing.xxl },
  result: { alignSelf: 'stretch', marginBottom: spacing.sm },
  talk: {
    marginTop: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink25,
    paddingBottom: 3,
  },
});
