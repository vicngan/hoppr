import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Kicker, Card, PillButton } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { useTaste } from '@/core/taste/store';
import { engine } from '@/core/engine';
import { usePlaces } from '@/core/places-repo';
import { useUserLocation } from '@/core/location';
import { CATEGORY_LABEL } from '@/core/places';
import { fmtDistance, useNextQuestion } from '@/core/discovery';
import type { Question, QOption } from '@/core/questions';

type Msg = { from: 'hoppr' | 'you'; text: string };

// Filler words that recur across option labels ("want to…", "need to…") — ignored
// so free text keys on the distinctive word ("disappear"), not the shared verb.
const STOP = new Set([
  'need',
  'want',
  'really',
  'around',
  'good',
  'honestly',
  'either',
  'keeping',
  'somewhere',
  'proper',
  'until',
  'tops',
]);

/** Best-effort map of free text → one of the question's options (keyless, no NLP). */
function matchOption(question: Question, text: string): QOption | null {
  const lc = text.toLowerCase();
  // Prefer an exact option-id hit (most distinctive) before fuzzy word matches.
  for (const o of question.options) {
    if (o.id.length > 2 && lc.includes(o.id)) return o;
  }
  for (const o of question.options) {
    const words = o.label
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !STOP.has(w));
    if (words.some((w) => lc.includes(w))) return o;
  }
  return null;
}

/**
 * Conversational discovery — the same engine + taste brain as Ask, framed as a
 * thread. Tapping a reply (or typing something Hoppr can read) teaches the
 * profile and pulls up the next question; when the bank is spent, Hoppr lands on
 * your current top pick.
 */
export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const profile = useTaste((s) => s.profile);
  const answer = useTaste((s) => s.answer);
  const reset = useTaste((s) => s.reset);

  const { coords } = useUserLocation();
  const { places } = usePlaces(coords);

  const { question } = useNextQuestion(places, coords);
  const askedIds = useMemo(() => profile.answers.map((a) => a.questionId), [profile.answers]);
  const top = question
    ? null
    : engine.rankPlaces({ profile, places, userCoords: coords, askedIds })[0];

  const [thread, setThread] = useState<Msg[]>([
    { from: 'hoppr', text: 'Alright — talk to me. I’ll figure out where you should go.' },
  ]);
  const [input, setInput] = useState('');

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [thread.length, question?.id]);

  /** Commit an answer: record the exchange in the thread and teach the profile. */
  const commit = (q: Question, opt: QOption, saidText?: string) => {
    setThread((t) => [
      ...t,
      { from: 'hoppr', text: q.prompt },
      { from: 'you', text: saidText ?? opt.label },
    ]);
    answer(q, opt);
    setInput('');
  };

  const send = () => {
    const text = input.trim();
    if (!text || !question) return;
    const opt = matchOption(question, text);
    if (opt) {
      commit(question, opt, text);
    } else {
      // No confident read — keep the question, nudge toward the chips.
      setThread((t) => [
        ...t,
        { from: 'you', text },
        { from: 'hoppr', text: 'Not sure I caught that — tap one below and I’ll learn from it.' },
      ]);
      setInput('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" size={15}>
            Hoppr
          </Text>
          <Text variant="kicker" size={10} color={colors.ink45}>
            thinking with you
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.thread}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {thread.map((m, i) => (
          <View
            key={i}
            style={[styles.bubble, m.from === 'you' ? styles.you : styles.hoppr]}>
            <Text variant="body" size={14} color={m.from === 'you' ? colors.onDark : colors.ink}>
              {m.text}
            </Text>
          </View>
        ))}

        {/* Live current question, or the final pick once the bank is spent. */}
        {question ? (
          <View style={[styles.bubble, styles.hoppr]}>
            <Text variant="body" size={14} color={colors.ink}>
              {question.prompt}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.bubble, styles.hoppr]}>
              <Text variant="body" size={14} color={colors.ink}>
                Here’s where I’d point you right now.
              </Text>
            </View>
            {top ? (
              <Card accent style={styles.result} onPress={() => router.push(`/place/${top.place.id}`)}>
                <Kicker accent style={{ marginBottom: 9 }}>
                  {top.match}% match
                </Kicker>
                <Text variant="serif" size={22}>
                  {top.place.name}
                </Text>
                <Text variant="kicker" size={10} color={colors.ink45} style={{ marginVertical: 8 }}>
                  {[CATEGORY_LABEL[top.place.category], top.place.area, fmtDistance(top.distanceMi)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text variant="body" size={13} color={colors.ink72}>
                  {top.reason}
                </Text>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Composer: quick-reply chips + a free-text line, or the wrap-up actions. */}
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {question ? (
          <>
            <View style={styles.replies}>
              {question.options.map((opt) => (
                <PillButton key={opt.id} label={opt.label} compact onPress={() => commit(question, opt)} />
              ))}
            </View>
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="…or tell me in your own words"
                placeholderTextColor={colors.ink40}
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={send}
              />
              <Pressable
                onPress={send}
                style={({ pressed }) => [styles.send, { opacity: pressed || !input.trim() ? 0.5 : 1 }]}>
                <Text variant="bodyMedium" size={13} color={colors.onDark}>
                  Send
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.replies}>
            <PillButton
              label="See all in Discover"
              variant="solid"
              style={{ flex: 1 }}
              onPress={() => router.replace('/(tabs)/discover')}
            />
            <PillButton label="Start fresh" onPress={reset} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink12,
  },
  thread: { gap: 10, padding: spacing.xl },
  bubble: { maxWidth: '84%', borderRadius: radius.lg, paddingVertical: 11, paddingHorizontal: 14 },
  hoppr: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.ink12 },
  you: { alignSelf: 'flex-end', backgroundColor: colors.ink },
  result: { alignSelf: 'stretch', marginTop: 4 },
  composer: {
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
    backgroundColor: colors.paper,
    gap: 10,
  },
  replies: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink12,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  send: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
