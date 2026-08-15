import { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Screen, Text, PillButton, ProgressDots } from '@/components/ui';
import { AdventureSlider } from '@/components/AdventureSlider';
import { SuggestionReveal } from '@/components/ask/SuggestionReveal';
import { colors, spacing } from '@/theme/tokens';
import { useRanked } from '@/core/discovery';

type ChipsStep = {
  kind: 'chips';
  id: string;
  question: string;
  sub: string;
  options: string[];
  multi: boolean;
};

type SliderStep = {
  kind: 'slider';
  id: 'budget';
  question: string;
  sub: string;
  minLabel: string;
  maxLabel: string;
  defaultT: number;
};

type Step = ChipsStep | SliderStep;

const STEPS: Step[] = [
  {
    kind: 'chips',
    id: 'activity',
    question: 'What are you in the mood to do?',
    sub: 'Pick as many as fit — Hoppr narrows from there.',
    options: ['Food', 'Drinks', 'Coffee', 'A walk', 'Hangout', 'Live music'],
    multi: true,
  },
  {
    kind: 'chips',
    id: 'vibe',
    question: "What's tonight feeling like?",
    sub: 'Set the mood and we’ll match the spots.',
    options: ['Date night', 'Movie night', 'Party', 'Chill', 'Cozy', 'Adventurous'],
    multi: true,
  },
  {
    kind: 'slider',
    id: 'budget',
    question: "What's the budget?",
    sub: 'Drag to set how much you want to spend.',
    minLabel: '$',
    maxLabel: '$$$$',
    defaultT: 0.33,
  },
  {
    kind: 'chips',
    id: 'distance',
    question: 'How far are you willing to go?',
    sub: 'One tap is enough here.',
    options: ['Walkable', 'Nearby', 'Short drive', 'Day trip', 'Anywhere'],
    multi: false,
  },
];

const BUDGET_TIERS = ['$', '$$', '$$$', '$$$$'];

/** Snaps a raw 0..1 drag position to the nearest of the 4 budget tiers. */
function snapBudget(t: number): { t: number; label: string } {
  const idx = Math.round(t * (BUDGET_TIERS.length - 1));
  return { t: idx / (BUDGET_TIERS.length - 1), label: BUDGET_TIERS[idx] };
}

/**
 * Tap-mode question flow (ask-chips) — a 4-step quiz (activity, vibe,
 * budget, distance) ending in a single-pick SuggestionReveal popup rather
 * than a swipeable deck. Budget is a drag slider snapping to 4 tiers
 * ($/$$/$$$/$$$$); the rest (including distance) are chip picks. The
 * Tinder-style swipe deck lives only in Together's group plan matching now
 * (see together/plan/matches.tsx) — swiping between candidates makes sense
 * for a group deciding together, not a solo "what's my one pick" flow.
 * Answers are ephemeral per-session local state — a session filter, not
 * persisted onboarding taste data — same judgment call as before.
 */
export default function AskChipsScreen() {
  const router = useRouter();
  const { ranked } = useRanked();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [sliderT, setSliderT] = useState<Record<string, number>>({});
  const [revealVisible, setRevealVisible] = useState(false);

  const step = STEPS[stepIndex];
  const selected = step.kind === 'chips' ? answers[step.id] ?? [] : [];
  const isLast = stepIndex === STEPS.length - 1;

  const toggle = (opt: string) => {
    if (step.kind !== 'chips') return;
    setAnswers((a) => {
      const cur = a[step.id] ?? [];
      if (step.multi) {
        return { ...a, [step.id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
      }
      return { ...a, [step.id]: cur.includes(opt) ? [] : [opt] };
    });
  };

  const goNext = () => {
    if (isLast) {
      setRevealVisible(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home' as Href);
    }
  };

  const candidates = useMemo(() => ranked.slice(0, 5), [ranked]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <AppHeader variant="sub" title="Ask Hoppr" onBack={goBack} />
      <Screen padTop={false} scroll={false} contentStyle={styles.content}>
        <View style={styles.anchor}>
          <ProgressDots count={STEPS.length} active={stepIndex + 1} style={styles.dots} />

          <Text variant="display" size={30} style={styles.title}>
            {step.question}
          </Text>
          <Text variant="body" size={14} color={colors.ink50} style={styles.sub}>
            {step.sub}
          </Text>
        </View>

        {step.kind === 'chips' ? (
          <View style={styles.pills}>
            {step.options.map((opt) => (
              <PillButton key={opt} label={opt} selected={selected.includes(opt)} onPress={() => toggle(opt)} />
            ))}
          </View>
        ) : (
          <SliderQuestion step={step} t={sliderT[step.id] ?? step.defaultT} onChange={(t) => setSliderT((s) => ({ ...s, [step.id]: t }))} />
        )}

        <View style={styles.spacer} />

        {stepIndex === 0 ? (
          <Pressable onPress={() => router.push('/ask/chat' as Href)} style={styles.typeLink}>
            <Text variant="bodyMedium" size={13} color={colors.ink50}>
              Rather just talk?{' '}
              <Text variant="bodyMedium" size={13} color={colors.accent}>
                Type it instead →
              </Text>
            </Text>
          </Pressable>
        ) : null}

        <PillButton
          label={isLast ? 'Show me picks' : 'Next'}
          variant="solid"
          style={styles.next}
          onPress={goNext}
        />
      </Screen>

      <SuggestionReveal visible={revealVisible} onClose={() => setRevealVisible(false)} candidates={candidates} />
    </View>
  );
}

function SliderQuestion({ step, t, onChange }: { step: SliderStep; t: number; onChange: (t: number) => void }) {
  const { t: snapT } = snapBudget(t);

  return (
    <View>
      <View style={styles.sliderWrap}>
        <AdventureSlider value={snapT} onChange={onChange} />
        <View style={styles.sliderLabels}>
          <Text variant="body" size={11} color={colors.ink45}>
            {step.minLabel}
          </Text>
          <Text variant="body" size={11} color={colors.ink45}>
            {step.maxLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  anchor: { marginTop: 110 },
  dots: { marginBottom: spacing.xxxl },
  title: { marginBottom: spacing.sm },
  sub: { marginBottom: spacing.xxl },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sliderWrap: {},
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  spacer: { flex: 1 },
  typeLink: { alignItems: 'center', marginBottom: spacing.lg },
  next: { alignSelf: 'stretch' },
});
