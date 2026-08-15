import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing, radius } from '@/theme/tokens';
import { usePlanStore } from '@/core/together/plan-store';

const JOIN_DELAY_MS = 1400;

/**
 * Step 2 of 8. Waiting room while friends "join" — bots respond instantly
 * (see together/bots.ts), so this just simulates the beat with a short
 * delay before auto-advancing. Branch per the frozen entry contract:
 * fromPlace set → datetime.tsx directly; blank path → quiz.tsx first.
 */
export default function PlanWaitingScreen() {
  const router = useRouter();
  const invitees = usePlanStore((s) => s.invitees);
  const fromPlace = usePlanStore((s) => s.fromPlace);
  const [joined, setJoined] = useState<string[]>([]);

  useEffect(() => {
    const timers = invitees.map((inv, i) =>
      setTimeout(() => setJoined((prev) => [...prev, inv.id]), 250 + i * 220),
    );
    const advance = setTimeout(() => {
      router.replace(fromPlace ? '/together/plan/datetime' : '/together/plan/quiz');
    }, JOIN_DELAY_MS + invitees.length * 220);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(advance);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="sub" title="Plan together" onBack={() => router.back()} />
      <View style={[styles.body, styles.center]}>
        <Kicker accent center style={{ marginBottom: 10 }}>
          Step 2 of 8
        </Kicker>
        <Text variant="display" size={26} center style={{ marginBottom: spacing.lg }}>
          Rounding up the table…
        </Text>

        {invitees.map((inv) => {
          const isIn = joined.includes(inv.id);
          return (
            <View key={inv.id} style={[styles.row, isIn && styles.rowIn]}>
              <Text variant="bodyMedium" size={15}>
                {inv.name}
              </Text>
              <Text variant="kicker" size={10} color={isIn ? colors.accent : colors.ink40}>
                {isIn ? 'JOINED' : 'INVITING…'}
              </Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, paddingTop: spacing.xxxl },
  center: { alignItems: 'center' },
  row: {
    width: '100%',
    maxWidth: 340,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink12,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  rowIn: { borderColor: colors.accent, borderWidth: 1.5 },
});
