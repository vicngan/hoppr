import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { useNotifications, type Notification } from '@/core/notifications/store';

const KIND_EMOJI: Record<Notification['kind'], string> = {
  invite: '🐇',
  vote: '🗳️',
  plan: '📍',
  chat: '💬',
  system: '✦',
};

/**
 * "Nudges" — reached via Home's bell icon. Grouped Tonight/Earlier cards with
 * real inline actions, backed by a new minimal `core/notifications/store.ts`
 * (no notifications domain existed before this screen).
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const items = useNotifications((s) => s.items);
  const read = useNotifications((s) => s.read);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);

  const tonight = items.filter((n) => n.bucket === 'tonight');
  const earlier = items.filter((n) => n.bucket === 'earlier');
  const hasUnread = items.some((n) => !read[n.id]);

  const onAction = (n: Notification) => {
    markRead(n.id);
    if (n.action) router.push(n.action.href as Href);
  };

  return (
    <>
      <AppHeader variant="sub" title="Nudges" onBack={() => router.back()} />
      <Screen>
        <View style={styles.topRow}>
          <Text variant="display" size={26}>
            Nudges
          </Text>
          <PillButton
            label="Mark all read"
            compact
            variant="outline"
            style={{ opacity: hasUnread ? 1 : 0.4 }}
            onPress={hasUnread ? markAllRead : undefined}
          />
        </View>

        {items.length === 0 ? (
          <Text variant="body" size={14} color={colors.ink55} style={{ marginTop: spacing.lg }}>
            Nothing yet — nudges land here when friends invite you or a plan
            needs you.
          </Text>
        ) : (
          <>
            {tonight.length > 0 ? (
              <Section title="Tonight" items={tonight} read={read} onOpen={markRead} onAction={onAction} />
            ) : null}
            {earlier.length > 0 ? (
              <Section title="Earlier" items={earlier} read={read} onOpen={markRead} onAction={onAction} />
            ) : null}
          </>
        )}
      </Screen>
    </>
  );
}

function Section({
  title,
  items,
  read,
  onOpen,
  onAction,
}: {
  title: string;
  items: Notification[];
  read: Record<string, true>;
  onOpen: (id: string) => void;
  onAction: (n: Notification) => void;
}) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Kicker style={{ marginBottom: 10 }}>{title}</Kicker>
      {items.map((n) => {
        const isRead = !!read[n.id];
        // The design reserves a solid dark card for the one "ready to act on"
        // nudge (the actionable, unread kind) — everything else is a plain
        // light card, unread state shown only by the small accent dot.
        const featured = !isRead && !!n.action;
        return (
          <Card
            key={n.id}
            style={{ marginBottom: spacing.sm, ...(featured ? styles.featuredCard : null) }}
            onPress={() => onOpen(n.id)}>
            <View style={styles.cardRow}>
              <View style={[styles.iconWrap, featured && styles.iconWrapFeatured]}>
                <Text size={18}>{KIND_EMOJI[n.kind]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" size={14} color={featured ? colors.onDark : colors.ink}>
                  {n.title}
                </Text>
                <Text
                  variant="body"
                  size={13}
                  color={featured ? 'rgba(247,242,232,0.7)' : colors.ink60}
                  style={{ marginTop: 3 }}>
                  {n.body}
                </Text>
                {n.action ? (
                  <PillButton
                    label={n.action.label}
                    compact
                    variant={featured ? 'outline' : 'solid'}
                    selected={featured}
                    style={{ marginTop: 10, alignSelf: 'flex-start' }}
                    onPress={() => onAction(n)}
                  />
                ) : null}
              </View>
              {!isRead ? <View style={styles.dot} /> : null}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  featuredCard: { backgroundColor: colors.ink, borderWidth: 0 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconWrapFeatured: { backgroundColor: colors.accent },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 4 },
});
