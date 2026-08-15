import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton, ProgressDots } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { useTogether, hopQuestions } from '@/core/together';
import type { Question, QOption } from '@/core/questions';
import { useUserLocation } from '@/core/location';
import { usePlaces } from '@/core/places-repo';

/**
 * Your private answers. Three quick reads on tonight's mood — only you see them;
 * they refine your taste for this hop only. When you finish, the deck is built.
 */
export default function AnswerScreen() {
  const router = useRouter();
  const hydrated = useTogether((s) => s.hydrated);
  const hop = useTogether((s) => s.hop);
  const answerAsYou = useTogether((s) => s.answerAsYou);
  const finishAnswering = useTogether((s) => s.finishAnswering);

  const { coords } = useUserLocation();
  const { places } = usePlaces(coords);
  const questions = useMemo(() => hopQuestions(), []);

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (hydrated && !hop) router.replace('/together');
  }, [hydrated, hop, router]);

  if (!hydrated || !hop) return <Screen>{null}</Screen>;

  const friendsAnswering = hop.members.filter((m) => m.kind === 'friend').length;
  const question: Question | undefined = questions[step];

  const choose = (q: Question, opt: QOption) => {
    answerAsYou(q, opt);
    const next = step + 1;
    if (next >= questions.length) {
      finishAnswering(places, coords);
      router.replace('/hop/swipe');
    } else {
      setStep(next);
    }
  };

  if (!question) return <Screen>{null}</Screen>;

  return (
    <Screen contentStyle={styles.center}>
      <Kicker accent center style={{ marginBottom: 12 }}>
        Only you see this
      </Kicker>

      <Text variant="kicker" center style={{ marginBottom: 12 }}>
        {question.kicker}
      </Text>
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
          <PillButton key={opt.id} label={opt.label} onPress={() => choose(question, opt)} />
        ))}
      </View>

      <ProgressDots count={questions.length} active={step} />

      <Text variant="body" size={12} color={colors.ink45} style={{ marginTop: spacing.xxl }} center>
        {friendsAnswering} friend{friendsAnswering === 1 ? '' : 's'} answering too — privately.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  q: { marginBottom: 10, paddingHorizontal: 8 },
  sub: { marginBottom: spacing.xxl },
  options: { width: '100%', maxWidth: 340, gap: 9, marginBottom: spacing.xxl },
});
