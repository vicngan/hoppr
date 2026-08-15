import { useMemo, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Screen, Text, PillButton } from '@/components/ui';
import { SuggestionReveal } from '@/components/ask/SuggestionReveal';
import { ArrowRightIcon } from '@/theme/icons';
import { colors, radius, spacing } from '@/theme/tokens';
import { useRanked } from '@/core/discovery';

type Turn = { from: 'hoppr' | 'you'; text: string };

const SCRIPT: Turn[] = [
  { from: 'hoppr', text: 'Hey! What kind of night are you after tonight?' },
];
const FOLLOW_UP: Turn = { from: 'hoppr', text: 'Got it — chill or lively, and who’s coming along?' };

/**
 * Type-mode mood input (ask-chat). Pre-scripted 2-turn conversation per the
 * package brief — not a live model call. Distinct from `src/app/chat.tsx`
 * (Together's group chat) — do not conflate.
 */
export default function AskChatScreen() {
  const router = useRouter();
  const { ranked } = useRanked();
  const [turns, setTurns] = useState<Turn[]>(SCRIPT);
  const [draft, setDraft] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [revealVisible, setRevealVisible] = useState(false);
  const candidates = useMemo(() => ranked.slice(0, 5), [ranked]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setTurns((t) => [...t, { from: 'you', text }]);
    if (turnCount === 0) {
      setTimeout(() => setTurns((t) => [...t, FOLLOW_UP]), 250);
    }
    setTurnCount((c) => c + 1);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <AppHeader
          variant="sub"
          title="Ask Hoppr"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/home' as Href))}
        />
        <Screen contentStyle={styles.content} padTop={false}>
          <View style={styles.thread}>
            {turns.map((t, i) => (
              <View
                key={i}
                style={[styles.bubble, t.from === 'you' ? styles.bubbleYou : styles.bubbleHoppr]}>
                <Text variant="body" size={14} color={t.from === 'you' ? colors.onDark : colors.ink}>
                  {t.text}
                </Text>
              </View>
            ))}
          </View>

          {turnCount >= 2 ? (
            <PillButton label="Show me picks" variant="solid" style={styles.next} onPress={() => setRevealVisible(true)} />
          ) : null}
        </Screen>

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type your answer…"
            placeholderTextColor={colors.ink40}
            style={styles.input}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable onPress={send} style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.8 }]}>
            <ArrowRightIcon size={17} color={colors.onDark} />
          </Pressable>
        </View>
      </View>

      <SuggestionReveal visible={revealVisible} onClose={() => setRevealVisible(false)} candidates={candidates} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  thread: { gap: spacing.md, marginBottom: spacing.xl },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleHoppr: { backgroundColor: colors.fill, alignSelf: 'flex-start' },
  bubbleYou: { backgroundColor: colors.accent, alignSelf: 'flex-end' },
  next: { alignSelf: 'stretch', marginTop: spacing.md },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.ink10,
    backgroundColor: colors.paper,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink14,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
