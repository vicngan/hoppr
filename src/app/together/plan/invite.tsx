import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WizardScreen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, spacing, radius } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { BOTS } from '@/core/together';
import { usePlace } from '@/core/places-store';
import { CATEGORY_LABEL } from '@/core/places';
import { usePlanStore } from '@/core/together/plan-store';

/**
 * Plan-Together wizard, step 1 of 8 — the sole host-start entry point (the
 * "Join a hop" button on the Together hub goes to `join.tsx` instead, never
 * here). `?fromPlace=<id>` boosts that place into the swipe candidate pool
 * later (see `matches.tsx`) but no longer skips any step — every entry
 * (blank or prefilled) goes through the same invite → questions → swipe →
 * datetime → results pipeline.
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
  const code = usePlanStore((s) => s.code);

  const [contact, setContact] = useState('');

  useMemo(() => {
    setFromPlace(fromPlaceId ?? null);
    // only on mount / param change — setFromPlace is a stable zustand setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromPlaceId]);

  const invitedIds = new Set(invitees.map((i) => i.id));
  const contactInvitees = invitees.filter((i) => i.source === 'contact');

  const toggleBot = (bot: (typeof BOTS)[number]) => {
    if (invitedIds.has(bot.id)) removeInvitee(bot.id);
    else addInvitee({ id: bot.id, name: bot.name, source: 'bot' });
  };

  const sendContactInvite = () => {
    const value = contact.trim();
    if (!value) return;
    addInvitee({ id: `contact_${value.toLowerCase()}`, name: value, source: 'contact' });
    setContact('');
  };

  return (
    <WizardScreen
      header={
        <AppHeader
          variant="wizard"
          onBack={() => router.back()}
          stepLabel="Step 1 of 8"
          heading="Invite the table."
        />
      }
      footer={
        <PillButton
          label={invitees.length < 1 ? 'Add at least one friend' : 'Continue'}
          variant="solid"
          style={{ opacity: invitees.length < 1 ? 0.4 : 1 }}
          onPress={invitees.length < 1 ? undefined : () => router.push('/together/plan/quiz')}
        />
      }
      contentStyle={styles.body}>
        <Text variant="serif" size={17} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
          By email or phone, with a shareable code, or a few Hoppr friends — everyone
          answers privately, then you swipe together.
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

        <Card style={{ marginBottom: spacing.lg }}>
          <Kicker style={{ marginBottom: 10 }}>Invite by email or phone</Kicker>
          <View style={styles.contactRow}>
            <TextInput
              value={contact}
              onChangeText={setContact}
              placeholder="name@email.com or a phone number"
              placeholderTextColor={colors.ink40}
              style={styles.contactInput}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={sendContactInvite}
            />
            <Pressable
              onPress={sendContactInvite}
              style={({ pressed }) => [styles.sendBtn, pressed && { opacity: 0.85 }]}>
              <Text variant="bodyMedium" size={13} color={colors.onDark}>
                Send
              </Text>
            </Pressable>
          </View>

          {contactInvitees.length > 0 ? (
            <View style={{ marginTop: spacing.md, gap: 8 }}>
              {contactInvitees.map((inv) => (
                <View key={inv.id} style={styles.contactChip}>
                  <Text variant="body" size={13} color={colors.ink80} numberOfLines={1} style={{ flex: 1 }}>
                    {inv.name}
                  </Text>
                  <Pressable onPress={() => removeInvitee(inv.id)} hitSlop={8}>
                    <Text variant="kicker" size={10} color={colors.ink45}>
                      REMOVE
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.divider} />

          <Kicker style={{ marginBottom: 8 }}>Or share a code</Kicker>
          <View style={styles.codeRow}>
            <Text variant="kicker" size={16} color={colors.accent}>
              {code}
            </Text>
            <Text variant="body" size={11} color={colors.ink45}>
              no account needed to join
            </Text>
          </View>
        </Card>

        <View style={styles.friendsHead}>
          <Kicker>Or add a Hoppr friend</Kicker>
          <Pressable hitSlop={8}>
            <Kicker accent size={10} style={{ letterSpacing: 0.6 }}>
              Search for more
            </Kicker>
          </Pressable>
        </View>
        <View style={styles.friendsGrid}>
          {BOTS.map((bot) => {
            const on = invitedIds.has(bot.id);
            return (
              <Pressable
                key={bot.id}
                onPress={() => toggleBot(bot)}
                style={({ pressed }) => [styles.friendTile, { opacity: pressed ? 0.9 : 1 }]}>
                <View style={[styles.friendPhoto, on ? styles.friendPhotoOn : styles.friendPhotoOff]}>
                  <Text variant="body" size={26}>
                    {bot.emoji}
                  </Text>
                  {on ? (
                    <View style={styles.friendCheck}>
                      <Text variant="kicker" size={9} color={colors.onDark}>
                        IN
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="bodyMedium" size={12} color={colors.ink} numberOfLines={1} style={{ marginTop: 6 }}>
                  {bot.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
    </WizardScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink16,
    paddingVertical: 8,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.panel,
  },
  divider: { height: 1, backgroundColor: colors.ink10, marginVertical: spacing.md },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  friendsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  friendsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  friendTile: { width: '22%', alignItems: 'center' },
  friendPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendPhotoOff: { backgroundColor: colors.card, borderColor: colors.ink14 },
  friendPhotoOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  friendCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
});
