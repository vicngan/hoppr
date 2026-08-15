import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, spacing, radius } from '@/theme/tokens';
import { BOTS } from '@/core/together';
import { usePlace } from '@/core/places-store';
import { CATEGORY_LABEL } from '@/core/places';
import { usePlanStore } from '@/core/together/plan-store';

/**
 * Plan-Together wizard, step 1 of 8. Entry contract (SPEC.md §4, frozen):
 * `?fromPlace=<id>` prefills a place-context card and skips quiz+matches
 * later in the flow; no param is the blank path from Explore.
 */
export default function PlanInviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fromPlace?: string }>();
  const fromPlaceId = typeof params.fromPlace === 'string' ? params.fromPlace : undefined;

  const fromPlace = usePlace(fromPlaceId);
  const invitees = usePlanStore((s) => s.invitees);
  const addInvitee = usePlanStore((s) => s.addInvitee);
  const removeInvitee = usePlanStore((s) => s.removeInvitee);
  const setFromPlace = usePlanStore((s) => s.setFromPlace);

  useMemo(() => {
    setFromPlace(fromPlaceId ?? null);
    // only on mount / param change — setFromPlace is a stable zustand setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromPlaceId]);

  const invitedIds = new Set(invitees.map((i) => i.id));

  const toggle = (bot: (typeof BOTS)[number]) => {
    if (invitedIds.has(bot.id)) removeInvitee(bot.id);
    else addInvitee({ id: bot.id, name: bot.name, source: 'bot' });
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="sub" title="Plan together" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 1 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: 8 }}>
          Who&apos;s coming?
        </Text>
        <Text variant="serif" size={17} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
          Invite a few friends — they&apos;ll join in instantly.
        </Text>

        {fromPlace ? (
          <Card padded={false} style={{ marginBottom: spacing.lg }}>
            <PlaceImage coords={fromPlace.coords} photo={fromPlace.photo} width="100%" height={120} mapSize={600} />
            <View style={{ padding: spacing.md }}>
              <Kicker style={{ marginBottom: 4 }}>Planning for</Kicker>
              <Text variant="serif" size={19}>
                {fromPlace.name}
              </Text>
              <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 2 }}>
                {[CATEGORY_LABEL[fromPlace.category], fromPlace.area].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </Card>
        ) : null}

        {BOTS.map((bot) => {
          const on = invitedIds.has(bot.id);
          return (
            <Pressable
              key={bot.id}
              onPress={() => toggle(bot)}
              style={({ pressed }) => [styles.row, on ? styles.rowOn : styles.rowOff, { opacity: pressed ? 0.9 : 1 }]}>
              <View style={styles.avatar}>
                <Text variant="body" size={18}>
                  {bot.emoji}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" size={15} color={on ? colors.onDark : colors.ink}>
                  {bot.name}
                </Text>
                <Text variant="body" size={12} color={on ? colors.onDark : colors.ink55}>
                  {bot.blurb}
                </Text>
              </View>
              <View style={[styles.toggle, on && styles.toggleOn]}>
                <Text variant="kicker" size={9} color={on ? colors.accent : colors.ink45}>
                  {on ? 'IN' : 'ADD'}
                </Text>
              </View>
            </Pressable>
          );
        })}

        <PillButton
          label={invitees.length < 1 ? 'Add at least one friend' : 'Send invites'}
          variant="solid"
          style={{ marginTop: spacing.lg, opacity: invitees.length < 1 ? 0.4 : 1 }}
          onPress={invitees.length < 1 ? undefined : () => router.push('/together/plan/waiting')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  rowOff: { backgroundColor: colors.card, borderColor: colors.ink14 },
  rowOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  toggleOn: { backgroundColor: colors.card },
});
