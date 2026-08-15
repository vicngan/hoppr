import { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing, radius } from '@/theme/tokens';
import { usePlanStore } from '@/core/together/plan-store';

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function labelFor(daysFromNow: number): string {
  if (daysFromNow === 0) return 'Tonight';
  if (daysFromNow === 1) return 'Tomorrow';
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

const TIME_OPTIONS = ['12:30', '18:00', '19:30'];

/** Step 5 of 8 — date chips (3 options) + time chips (3 options), real color-flip select state. */
export default function PlanDatetimeScreen() {
  const router = useRouter();
  const date = usePlanStore((s) => s.date);
  const time = usePlanStore((s) => s.time);
  const setDateTime = usePlanStore((s) => s.setDateTime);

  const dateOptions = useMemo(() => [0, 1, 4].map((d) => ({ iso: isoDate(d), label: labelFor(d) })), []);

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="sub" title="Plan together" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 5 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: spacing.lg }}>
          When works?
        </Text>

        <Kicker style={{ marginBottom: spacing.sm }}>Date</Kicker>
        <View style={styles.chipRow}>
          {dateOptions.map((opt) => {
            const on = date === opt.iso;
            return (
              <Pressable
                key={opt.iso}
                onPress={() => setDateTime(opt.iso, time)}
                style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
                <Text variant="bodyMedium" size={14} color={on ? colors.onDark : colors.ink}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Kicker style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Time</Kicker>
        <View style={styles.chipRow}>
          {TIME_OPTIONS.map((t) => {
            const on = time === t;
            return (
              <Pressable
                key={t}
                onPress={() => setDateTime(date, t)}
                style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
                <Text variant="bodyMedium" size={14} color={on ? colors.onDark : colors.ink}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <PillButton
          label="Confirm"
          variant="solid"
          style={{ marginTop: spacing.xxl, opacity: date && time ? 1 : 0.4 }}
          onPress={date && time ? () => router.push('/together/plan/reserve') : undefined}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingVertical: 10, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1.5 },
  chipOff: { backgroundColor: colors.card, borderColor: colors.ink14 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
