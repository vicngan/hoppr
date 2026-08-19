import { useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { Text } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';

const ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 3;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'] as const;

type Props = {
  /** 24h "HH:MM", e.g. '19:30' */
  value: string | null;
  onChange: (hhmm: string) => void;
};

function to24h(hour12: number, minute: string, period: 'AM' | 'PM'): string {
  let h = hour12 % 12;
  if (period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

function from24h(hhmm: string | null): { hour12: number; minute: string; period: 'AM' | 'PM' } {
  if (!hhmm) return { hour12: 7, minute: '00', period: 'PM' };
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minute = MINUTES.includes(mStr) ? mStr : '00';
  return { hour12, minute, period };
}

/**
 * Native-style scrolling wheel time picker (hour / minute / AM-PM columns),
 * built on `ScrollView` + `snapToInterval` rather than a custom pan-gesture
 * wheel — cheap, no new gesture code, matches the iOS reference closely
 * enough for a snap-to-select interaction.
 */
export function WheelTimePicker({ value, onChange }: Props) {
  const initial = from24h(value);
  return (
    <View style={styles.row}>
      <WheelColumn
        items={HOURS.map(String)}
        initial={String(initial.hour12)}
        onSettle={(v) => onChange(to24h(Number(v), initial.minute, initial.period))}
      />
      <Text variant="display" size={20} style={styles.colon}>
        :
      </Text>
      <WheelColumn
        items={MINUTES}
        initial={initial.minute}
        onSettle={(v) => onChange(to24h(initial.hour12, v, initial.period))}
      />
      <WheelColumn
        items={[...PERIODS]}
        initial={initial.period}
        onSettle={(v) => onChange(to24h(initial.hour12, initial.minute, v as 'AM' | 'PM'))}
      />
    </View>
  );
}

function WheelColumn({
  items,
  initial,
  onSettle,
}: {
  items: string[];
  initial: string;
  onSettle: (value: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const startIndex = Math.max(0, items.indexOf(initial));
  const [index, setIndex] = useState(startIndex);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    setIndex(clamped);
    onSettle(items[clamped]);
  };

  return (
    <View style={[styles.column, { height: ITEM_HEIGHT * VISIBLE_ROWS }]}>
      <View style={styles.selectionBand} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        contentOffset={{ x: 0, y: startIndex * ITEM_HEIGHT }}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onMomentumEnd}>
        {items.map((label, i) => (
          <View key={label} style={styles.item}>
            <Text
              variant="bodyMedium"
              size={16}
              color={i === index ? colors.ink : colors.ink40}>
              {label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  colon: { marginHorizontal: 2 },
  column: { width: 64, overflow: 'hidden' },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  selectionBand: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: radius.sm,
    backgroundColor: colors.panel,
  },
});
