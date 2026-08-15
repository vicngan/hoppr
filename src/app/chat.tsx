import { useEffect, useRef, useState } from 'react';
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
import { AppHeader } from '@/components/AppHeader';
import { Text, Kicker, Card, PillButton } from '@/components/ui';
import { ArrowRightIcon } from '@/theme/icons';
import { colors, radius, spacing, gradientPlaceholders } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { useTogether, YOU_ID, TIME_SLOTS } from '@/core/together';
import { useHopChat, selectHopMessages } from '@/core/together/chat-store';
import { findPlaceById, CATEGORY_LABEL } from '@/core/places';

/**
 * Together's group chat. Restyled onto the new tokens/AppHeader; the message
 * list is a real hop-scoped thread (`together/chat-store.ts` — see that
 * file's header comment for why it's a sibling store rather than an
 * extension of `Hop`) with a functional plain-text composer, plus a rich
 * "SHARED A PLAN" card once the hop has reached `planned`.
 */
export default function ChatScreen() {
  const router = useRouter();
  const hop = useTogether((s) => s.hop);
  const send = useHopChat((s) => s.send);
  const subscribe = useHopChat((s) => s.subscribe);
  const messages = useHopChat(selectHopMessages(hop?.id));

  const [input, setInput] = useState('');
  const [attachTapped, setAttachTapped] = useState(false);

  useEffect(() => {
    if (!hop) return;
    const unsub = subscribe(hop.id);
    return unsub;
  }, [hop?.id, subscribe]);

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length, hop?.status]);

  const onSend = () => {
    if (!hop || !input.trim()) return;
    send(hop.id, input);
    setInput('');
  };

  const place = hop?.pickId ? findPlaceById(hop.pickId) : undefined;
  const slot = hop?.slotId ? TIME_SLOTS.find((s) => s.id === hop.slotId) : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader
        variant="sub"
        title={hop?.title ?? 'Group chat'}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/together'))}
      />

      {!hop ? (
        <View style={styles.empty}>
          <Text variant="body" size={14} color={colors.ink55} center>
            No active hop right now — start one from Together to chat with the
            table.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.memberRow}>
            <View style={styles.avatarStack}>
              {hop.members.slice(0, 3).map((m, i) => (
                <View
                  key={m.id}
                  style={[
                    styles.avatarDot,
                    { backgroundColor: gradientPlaceholders[i % gradientPlaceholders.length].to, marginLeft: i === 0 ? 0 : -10 },
                  ]}
                />
              ))}
            </View>
            <Text variant="body" size={12} color={colors.ink50}>
              {hop.members.length} people
            </Text>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.thread}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {hop.status === 'planned' && place ? (
              <SharedPlanCard
                placeName={place.name}
                category={CATEGORY_LABEL[place.category]}
                area={place.area}
                slotLabel={slot ? `${slot.day} · ${slot.time}` : undefined}
                onImIn={() => router.push('/together/tickets')}
                onVote={() => router.push('/together/vote')}
              />
            ) : null}

            {messages.length === 0 ? (
              <Text variant="body" size={13} color={colors.ink45} center style={{ marginTop: spacing.lg }}>
                No messages yet — say hi to the table.
              </Text>
            ) : (
              messages.map((m) => {
                const author = hop.members.find((mem) => mem.id === m.from);
                const mine = m.from === YOU_ID;
                return (
                  <View key={m.id} style={[styles.bubble, mine ? styles.you : styles.hoppr]}>
                    {!mine ? (
                      <Text variant="kicker" size={9} color={colors.ink45} style={{ marginBottom: 3 }}>
                        {author ? `${author.emoji} ${author.name}` : 'Friend'}
                      </Text>
                    ) : null}
                    <Text variant="body" size={14} color={mine ? colors.onDark : colors.ink}>
                      {m.text}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.composer}>
            <Pressable
              onPress={() => {
                setAttachTapped(true);
                setTimeout(() => setAttachTapped(false), 1400);
              }}
              hitSlop={8}
              style={styles.attachBtn}>
              <Text size={18} color={colors.accent}>
                +
              </Text>
            </Pressable>
            {attachTapped ? (
              <View style={styles.attachToast}>
                <Text variant="kicker" size={9} color={colors.ink45}>
                  Attachments coming soon
                </Text>
              </View>
            ) : null}
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message the table…"
              placeholderTextColor={colors.ink40}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={onSend}
            />
            <Pressable
              onPress={onSend}
              style={({ pressed }) => [styles.send, { opacity: pressed || !input.trim() ? 0.5 : 1 }]}>
              <ArrowRightIcon size={16} color={colors.onDark} />
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

function SharedPlanCard({
  placeName,
  category,
  area,
  slotLabel,
  onImIn,
  onVote,
}: {
  placeName: string;
  category?: string;
  area?: string;
  slotLabel?: string;
  onImIn: () => void;
  onVote: () => void;
}) {
  return (
    <Card accent style={{ marginBottom: spacing.md }}>
      <Kicker accent style={{ marginBottom: 8 }}>
        Shared a plan
      </Kicker>
      <Text variant="serif" size={21} style={{ marginBottom: 4 }}>
        {placeName}
      </Text>
      <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 12 }}>
        {[category, area, slotLabel].filter(Boolean).join(' · ')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PillButton label="I'm in" variant="solid" compact style={{ flex: 1 }} onPress={onImIn} />
        <PillButton label="Vote" compact style={{ flex: 1 }} onPress={onVote} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  avatarStack: { flexDirection: 'row' },
  avatarDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.paper },
  thread: { gap: 10, padding: spacing.xl },
  bubble: { maxWidth: '84%', borderRadius: radius.lg, paddingVertical: 11, paddingHorizontal: 14 },
  hoppr: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.ink12 },
  you: { alignSelf: 'flex-end', backgroundColor: colors.accent },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
    backgroundColor: colors.paper,
  },
  attachBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachToast: {
    position: 'absolute',
    left: spacing.xl,
    bottom: 56,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
