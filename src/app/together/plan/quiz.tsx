import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton, ProgressDots } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { spacing } from '@/theme/tokens';
import { TAGS, type Tag } from '@/core/taste/tags';
import { usePlanStore } from '@/core/together/plan-store';

const T = TAGS;

type QuizOption = { id: string; label: string; tags: Tag[] };
type QuizQuestion = { id: string; kicker: string; prompt: string; options: QuizOption[] };

/** 3 quick-pick questions for the blank-path wizard entry. Real tag deltas
 * feed matches.tsx's real match.ts scoring — not cosmetic. */
const QUESTIONS: QuizQuestion[] = [
  {
    id: 'mood',
    kicker: 'Tonight',
    prompt: "What's the mood?",
    options: [
      { id: 'lively', label: 'Lively', tags: [T.lively, T.group] },
      { id: 'chill', label: 'Chill', tags: [T.comfy, T.moody] },
      { id: 'focused', label: 'Focused', tags: [T.quiet, T.study] },
    ],
  },
  {
    id: 'budget',
    kicker: 'Budget',
    prompt: 'How are we spending?',
    options: [
      { id: 'cheap', label: 'Keep it cheap', tags: [T.cheap] },
      { id: 'middle', label: "Doesn't matter", tags: [] },
      { id: 'splurge', label: "Let's splurge", tags: [T.splurge] },
    ],
  },
  {
    id: 'nighttype',
    kicker: 'Night type',
    prompt: 'What kind of night?',
    options: [
      { id: 'food', label: 'Food first', tags: [T.food] },
      { id: 'drinks', label: 'Drinks', tags: [T.drinks] },
      { id: 'coffee', label: 'Coffee & talk', tags: [T.coffee, T.lingering] },
    ],
  },
];

export default function PlanQuizScreen() {
  const router = useRouter();
  const setQuizTags = usePlanStore((s) => s.setQuizTags);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Tag[]>([]);

  const question = QUESTIONS[step];

  const choose = (opt: QuizOption) => {
    const nextTags = [...picked, ...opt.tags];
    const next = step + 1;
    if (next >= QUESTIONS.length) {
      setQuizTags(nextTags);
      router.push('/together/plan/matches');
    } else {
      setPicked(nextTags);
      setStep(next);
    }
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="sub" title="Plan together" onBack={() => router.back()} />
      <View style={[styles.body, styles.center]}>
        <Kicker accent center style={{ marginBottom: 10 }}>
          Step 3 of 8
        </Kicker>
        <Text variant="kicker" center style={{ marginBottom: 12 }}>
          {question.kicker}
        </Text>
        <Text variant="display" size={26} center style={{ marginBottom: spacing.xxl }}>
          {question.prompt}
        </Text>

        <View style={styles.options}>
          {question.options.map((opt) => (
            <PillButton key={opt.id} label={opt.label} onPress={() => choose(opt)} />
          ))}
        </View>

        <ProgressDots count={QUESTIONS.length} active={step} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, paddingTop: spacing.xxl },
  center: { alignItems: 'center' },
  options: { width: '100%', maxWidth: 340, gap: 9, marginBottom: spacing.xxl },
});
