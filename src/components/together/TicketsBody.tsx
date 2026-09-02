import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Kicker, Card, PillButton } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, spacing } from '@/theme/tokens';
import { CATEGORY_LABEL } from '@/core/places';
import { buildTickets, useTogether, type Ticket } from '@/core/together';

type Tab = 'upcoming' | 'past';

/**
 * Shared Upcoming/Past ticket list — the real planned hop (if any) plus
 * fabricated sample tickets from `mock-tickets.ts`, sorted by date. Used both
 * by the standalone `/together/tickets` route (pushed from chat.tsx) and by
 * the Together tab itself once the active hop has a reservation.
 */
export function TicketsBody({ onPlan }: { onPlan: () => void }) {
  const router = useRouter();
  const hop = useTogether((s) => s.hop);
  const [tab, setTab] = useState<Tab>('upcoming');

  const { upcoming, past } = buildTickets(hop);
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <View>
      <View style={styles.tabs}>
        {(['upcoming', 'past'] as Tab[]).map((t) => {
          const on = tab === t;
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, on && styles.tabOn]}>
              <Text variant="bodyMedium" size={14} color={on ? colors.accent : colors.ink45}>
                {t === 'upcoming' ? 'Upcoming' : 'Past'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {list.length > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {list.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onPress={() => router.push(`/place/${ticket.place.id}`)} />
          ))}
        </View>
      ) : (
        <EmptyState onPlan={onPlan} tab={tab} />
      )}
    </View>
  );
}

function TicketCard({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) {
  const { place } = ticket;
  return (
    <Card padded={false} onPress={onPress}>
      <PlaceImage coords={place.coords} photo={place.photo} width="100%" height={150} mapSize={700} />
      <View style={{ padding: spacing.md }}>
        <Kicker style={{ marginBottom: 4 }}>{ticket.title}</Kicker>
        <Text variant="serif" size={20} style={{ marginBottom: 4 }}>
          {place.name}
        </Text>
        <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 10 }}>
          {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
        </Text>
        <Text variant="body" size={13} color={colors.ink72}>
          {ticket.when
            ? ticket.when.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) +
              (ticket.time ? ` · ${ticket.time}` : '')
            : 'Time TBD'}
        </Text>
        <Text variant="body" size={12} color={colors.ink55} style={{ marginTop: 6 }}>
          {ticket.members.join(', ')}
        </Text>
      </View>
    </Card>
  );
}

function EmptyState({ onPlan, tab }: { onPlan: () => void; tab: Tab }) {
  return (
    <Card accent style={{ marginTop: spacing.xxl, alignItems: 'center' }}>
      <Text variant="serif" size={19} center style={{ marginBottom: 8 }}>
        {tab === 'upcoming' ? 'Nothing on the calendar yet.' : 'No past plans yet.'}
      </Text>
      <Text variant="body" size={14} color={colors.ink72} center style={{ marginBottom: spacing.lg }}>
        Plan a hop with friends — pick a place, a time, and Hoppr holds the ticket here.
      </Text>
      <PillButton label="Plan together" variant="solid" onPress={onPlan} />
    </Card>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.ink10 },
  tab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: colors.accent },
});
