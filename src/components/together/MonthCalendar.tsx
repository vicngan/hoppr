import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { ChevronBackIcon, ChevronForwardIcon } from '@/theme/icons';
import { colors, radius, spacing } from '@/theme/tokens';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_AHEAD = 2;

type Props = {
  /** ISO date, e.g. '2026-08-20' */
  value: string | null;
  onChange: (iso: string) => void;
};

const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Full month-grid date picker (decision: replaces the old 3-chip date row).
 * Navigable across the current month plus the next two — no further back
 * or forward, since a hop is always a near-term plan.
 */
export function MonthCalendar({ value, onChange }: Props) {
  const today = startOfDay(new Date());
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + MONTHS_AHEAD, 1);
  const [cursor, setCursor] = useState(firstOfThisMonth);

  const canGoBack = cursor.getTime() > firstOfThisMonth.getTime();
  const canGoForward = cursor.getTime() < maxMonth.getTime();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <View>
      <View style={styles.nav}>
        <Pressable
          onPress={() => canGoBack && setCursor(new Date(year, month - 1, 1))}
          hitSlop={8}
          style={{ opacity: canGoBack ? 1 : 0.25 }}>
          <ChevronBackIcon size={18} color={colors.ink} />
        </Pressable>
        <Text variant="bodyMedium" size={14} color={colors.ink}>
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          onPress={() => canGoForward && setCursor(new Date(year, month + 1, 1))}
          hitSlop={8}
          style={{ opacity: canGoForward ? 1 : 0.25 }}>
          <ChevronForwardIcon size={18} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((w, i) => (
          <Text key={i} variant="kicker" size={9} color={colors.ink40} style={styles.cell}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const iso = toIso(d);
          const past = d.getTime() < today.getTime();
          const selected = value === iso;
          return (
            <Pressable
              key={i}
              disabled={past}
              onPress={() => onChange(iso)}
              style={[styles.cell, styles.dayCell, selected && styles.dayCellOn, past && styles.dayCellPast]}>
              <Text
                variant="bodyMedium"
                size={13}
                color={selected ? colors.onDark : past ? colors.ink25 : colors.ink}>
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  dayCell: { borderRadius: radius.pill },
  dayCellOn: { backgroundColor: colors.accent },
  dayCellPast: { opacity: 0.4 },
});
