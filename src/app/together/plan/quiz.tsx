import { useState, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton, ProgressDots } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { ChoicePill } from '@/components/onboarding/ChoicePill';
import { ChoiceRow } from '@/components/onboarding/ChoiceRow';
import { spacing } from '@/theme/tokens';
import { useTogether, YOU_ID } from '@/core/together';
import { usePlanStore } from '@/core/together/plan-store';
import type { HopFoodAnswers } from '@/core/together/types';
import { useUserLocation } from '@/core/location';
import { usePlaces } from '@/core/places-repo';

type MultiQuestion = {
  kind: 'multi';
  id: 'cuisines' | 'dietary';
  kicker: string;
  prompt: string;
  options: { id: string; label: string; values: string[] }[];
};
type SingleQuestion = {
  kind: 'single';
  id: 'vibe' | 'price' | 'adventurous' | 'distance';
  kicker: string;
  prompt: string;
  options: { id: string; label: string; sub?: string }[];
};

const QUESTIONS: (MultiQuestion | SingleQuestion)[] = [
  {
    kind: 'multi',
    id: 'cuisines',
    kicker: 'Cuisine',
    prompt: 'What sounds good tonight?',
    options: [
      { id: 'coffee', label: 'Coffee & cafe', values: ['coffee', 'cafe', 'tea'] },
      { id: 'bakery', label: 'Bakery & sweets', values: ['bakery'] },
      { id: 'american', label: 'American & diner', values: ['american', 'diner', 'breakfast'] },
      { id: 'new-american', label: 'New American', values: ['new american', 'small plates'] },
      { id: 'mediterranean', label: 'Mediterranean', values: ['mediterranean'] },
      { id: 'bar', label: 'Cocktails & bar food', values: ['cocktails', 'bar food'] },
    ],
  },
  {
    kind: 'single',
    id: 'vibe',
    kicker: 'Vibe',
    prompt: "What's the mood?",
    options: [
      { id: 'lively', label: 'Lively & social', sub: 'Buzzy, a little loud, good for a table' },
      { id: 'cozy', label: 'Cozy & relaxed', sub: 'Comfortable, warm light, easy to linger' },
      { id: 'quiet', label: 'Quiet & intimate', sub: 'Low key, easy to actually hear each other' },
    ],
  },
  {
    kind: 'multi',
    id: 'dietary',
    kicker: 'Dietary',
    prompt: 'Any restrictions to plan around?',
    options: [
      { id: 'veg', label: 'Vegetarian', values: ['veg'] },
      { id: 'vegan', label: 'Vegan', values: ['vegan'] },
      { id: 'gf', label: 'Gluten-free', values: ['gf'] },
      { id: 'dairy_free', label: 'Dairy-free', values: ['dairy_free'] },
    ],
  },
  {
    kind: 'single',
    id: 'price',
    kicker: 'Budget',
    prompt: 'What price range works?',
    options: [
      { id: '1', label: '$ · Keep it cheap' },
      { id: '2', label: '$$ · Reasonable' },
      { id: '3', label: '$$$ · A nice night out' },
      { id: '4', label: '$$$$ · Let’s splurge' },
    ],
  },
  {
    kind: 'single',
    id: 'adventurous',
    kicker: 'Taste',
    prompt: 'Adventurous or familiar?',
    options: [
      { id: 'adventurous', label: 'Adventurous', sub: 'Surprise me with somewhere new' },
      { id: 'familiar', label: 'Familiar', sub: 'Something I already know I’ll like' },
    ],
  },
  {
    kind: 'single',
    id: 'distance',
    kicker: 'Distance',
    prompt: 'How far are you willing to go?',
    options: [
      { id: 'close', label: 'Close by', sub: 'Nothing more than a short walk' },
      { id: 'nearby', label: 'A bit of a trip is fine', sub: 'Anywhere in town' },
      { id: 'anywhere', label: 'Anywhere', sub: "I don't mind the distance" },
    ],
  },
];

/**
 * Unified 6 food questions — reached from `invite.tsx`'s "Continue" (host)
 * or `join.tsx`'s demo/code join (joiner). Center-vertical, one question
 * per step, "Next" disabled until answered (multi-select questions treat an
 * empty pick as a valid "no preference" answer). If a real hop already
 * exists (the joiner path — see `join.tsx`), answers write straight into it
 * via `answerFoodQuestions`; otherwise (the host path) they stay in
 * `plan-store` until `commitToHop` replays them at the end of the wizard.
 */
export default function PlanQuizScreen() {
  const router = useRouter();
  const hop = useTogether((s) => s.hop);
  const answerFoodQuestions = useTogether((s) => s.answerFoodQuestions);
  const finishAnswering = useTogether((s) => s.finishAnswering);
  const setHopAnswers = usePlanStore((s) => s.setHopAnswers);
  const { coords } = useUserLocation();
  const { places } = usePlaces(coords);

  const [step, setStep] = useState(0);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [vibe, setVibe] = useState<string | null>(null);
  const [dietary, setDietary] = useState<string[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [adventurous, setAdventurous] = useState<HopFoodAnswers['adventurous'] | null>(null);
  const [distance, setDistance] = useState<HopFoodAnswers['distance'] | null>(null);

  const question = QUESTIONS[step];
  const isLiveHop = !!hop;

  const toggleMulti = (values: string[], current: string[], set: (v: string[]) => void) => {
    const has = current.some((v) => values.includes(v));
    set(has ? current.filter((v) => !values.includes(v)) : [...current, ...values]);
  };

  const canAdvance =
    question.kind === 'multi' ||
    (question.id === 'vibe' && vibe != null) ||
    (question.id === 'price' && price != null) ||
    (question.id === 'adventurous' && adventurous != null) ||
    (question.id === 'distance' && distance != null);

  const finish = () => {
    const answers: HopFoodAnswers = {
      cuisines,
      vibe: vibe ?? 'lively',
      dietary,
      price: (price ?? 2) as HopFoodAnswers['price'],
      adventurous: adventurous ?? 'familiar',
      distance: distance ?? 'nearby',
    };
    if (isLiveHop) {
      answerFoodQuestions(YOU_ID, answers);
      finishAnswering(places, coords);
    } else {
      setHopAnswers(answers);
    }
    router.push('/together/plan/matches');
  };

  const next = () => {
    if (step + 1 >= QUESTIONS.length) finish();
    else setStep(step + 1);
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="wizard" onBack={() => router.back()} />
      <View style={[styles.body, styles.center]}>
        <Kicker accent center style={{ marginBottom: 10 }}>
          Question {step + 1} of {QUESTIONS.length}
        </Kicker>
        <Text variant="kicker" center style={{ marginBottom: 12 }}>
          {question.kicker}
        </Text>
        <Text variant="display" size={26} center style={{ marginBottom: spacing.xxl }}>
          {question.prompt}
        </Text>

        <View style={styles.options}>
          {question.kind === 'multi' && question.id === 'cuisines'
            ? question.options.map((opt) => (
                <ChoicePillWrap key={opt.id}>
                  <ChoicePill
                    label={opt.label}
                    selected={opt.values.some((v) => cuisines.includes(v))}
                    onPress={() => toggleMulti(opt.values, cuisines, setCuisines)}
                  />
                </ChoicePillWrap>
              ))
            : null}
          {question.kind === 'multi' && question.id === 'dietary'
            ? question.options.map((opt) => (
                <ChoicePillWrap key={opt.id}>
                  <ChoicePill
                    label={opt.label}
                    selected={opt.values.some((v) => dietary.includes(v))}
                    onPress={() => toggleMulti(opt.values, dietary, setDietary)}
                  />
                </ChoicePillWrap>
              ))
            : null}
          {question.kind === 'single' && question.id === 'vibe'
            ? question.options.map((opt) => (
                <ChoiceRow key={opt.id} label={opt.label} sub={opt.sub} selected={vibe === opt.id} onPress={() => setVibe(opt.id)} />
              ))
            : null}
          {question.kind === 'single' && question.id === 'price'
            ? question.options.map((opt) => (
                <ChoiceRow
                  key={opt.id}
                  label={opt.label}
                  selected={price === Number(opt.id)}
                  onPress={() => setPrice(Number(opt.id))}
                />
              ))
            : null}
          {question.kind === 'single' && question.id === 'adventurous'
            ? question.options.map((opt) => (
                <ChoiceRow
                  key={opt.id}
                  label={opt.label}
                  sub={opt.sub}
                  selected={adventurous === opt.id}
                  onPress={() => setAdventurous(opt.id as HopFoodAnswers['adventurous'])}
                />
              ))
            : null}
          {question.kind === 'single' && question.id === 'distance'
            ? question.options.map((opt) => (
                <ChoiceRow
                  key={opt.id}
                  label={opt.label}
                  sub={opt.sub}
                  selected={distance === opt.id}
                  onPress={() => setDistance(opt.id as HopFoodAnswers['distance'])}
                />
              ))
            : null}
        </View>

        <PillButton
          label={step + 1 >= QUESTIONS.length ? "That's everyone — let's swipe" : 'Next'}
          variant="solid"
          style={{ width: '100%', maxWidth: 340, opacity: canAdvance ? 1 : 0.4 }}
          onPress={canAdvance ? next : undefined}
        />

        <View style={{ marginTop: spacing.lg }}>
          <ProgressDots count={QUESTIONS.length} active={step} />
        </View>
      </View>
    </Screen>
  );
}

function ChoicePillWrap({ children }: { children: ReactNode }) {
  return <View style={{ marginBottom: 8 }}>{children}</View>;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, paddingTop: spacing.xxl },
  center: { alignItems: 'center' },
  options: { width: '100%', maxWidth: 340, gap: 9, marginBottom: spacing.xxl },
});
