import { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { usePlace } from '@/core/places-store';
import { useMenu, useMenuStore } from '@/core/menu/store';
import { recommendDish } from '@/core/menu/recommend';
import { groupBySection } from '@/core/menu/util';
import { useTaste } from '@/core/taste/store';
import { usePlanStore } from '@/core/together/plan-store';

const ALL = 'All';

/**
 * Step 7 of 8 — the group's menu. Recommended-for-the-table dishes up top
 * (real `recommendDish` scoring, no order-ahead pipeline this pass), the
 * full restaurant menu with prices below, filterable by section. Single
 * "Let's go!" CTA advances straight to the ticket.
 */
export default function PlanMenuScreen() {
  const router = useRouter();
  const fromPlace = usePlanStore((s) => s.fromPlace);
  const setPreorder = usePlanStore((s) => s.setPreorder);
  const place = usePlace(fromPlace ?? undefined);
  const menu = useMenu(fromPlace ?? '');
  const prefs = useMenuStore((s) => s.prefs);
  const taste = useTaste((s) => s.profile);

  const [section, setSection] = useState(ALL);

  const primary = place ? recommendDish(menu, taste, prefs, place.category) : null;
  const recommended = primary ? [primary.item, ...primary.alternatives.map((a) => a.item)].slice(0, 3) : [];

  const sections = useMemo(() => groupBySection(menu), [menu]);
  const sectionNames = [ALL, ...sections.map(([name]) => name).filter(Boolean)];
  const visibleSections = section === ALL ? sections : sections.filter(([name]) => name === section);

  const letsGo = () => {
    setPreorder({ itemIds: recommended.map((i) => i.id) });
    router.push('/together/plan/ticket');
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="wizard" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 7 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: 8 }}>
          {place ? `${place.name} menu` : 'The menu'}
        </Text>
        <Text variant="serif" size={16} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
          Here&apos;s what fits the table, and everything else on the menu.
        </Text>

        {recommended.length > 0 ? (
          <>
            <Kicker style={{ marginBottom: spacing.sm }}>Good for the table</Kicker>
            {recommended.map((item, i) => (
              <Card key={item.id} accent={i === 0} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <Text variant="bodyMedium" size={15} style={{ flex: 1 }}>
                    {item.name}
                  </Text>
                  {item.price != null ? (
                    <Text variant="bodyMedium" size={13} style={styles.price} color={i === 0 ? colors.accent : colors.ink60}>
                      ${item.price.toFixed(2)}
                    </Text>
                  ) : null}
                </View>
                {i === 0 && primary ? (
                  <Text variant="body" size={12} color={colors.ink72} style={{ marginTop: 4 }}>
                    {primary.reason}
                  </Text>
                ) : null}
              </Card>
            ))}
          </>
        ) : null}

        {sectionNames.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
            contentContainerStyle={styles.pillRow}>
            {sectionNames.map((name) => (
              <PillButton key={name} label={name} compact selected={section === name} onPress={() => setSection(name)} />
            ))}
          </ScrollView>
        ) : null}

        <View style={{ marginTop: spacing.md }}>
          <Kicker style={{ marginBottom: 12 }}>The full menu · {menu.length} items</Kicker>
          {visibleSections.map(([name, items]) => (
            <View key={name} style={{ marginBottom: 18 }}>
              {name ? (
                <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 8 }}>
                  {name}
                </Text>
              ) : null}
              {items.map((item) => (
                <View key={item.id} style={styles.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" size={14}>
                      {item.name}
                    </Text>
                    {item.description ? (
                      <Text variant="body" size={11} color={colors.ink50} style={{ marginTop: 3 }}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  {item.price != null ? (
                    <Text variant="bodyMedium" size={12} color={colors.ink60} style={styles.price}>
                      ${item.price.toFixed(2)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
          {menu.length === 0 ? (
            <Text variant="body" size={13} color={colors.ink55}>
              No menu on file yet for this spot.
            </Text>
          ) : null}
        </View>

        <PillButton label="Let's go!" variant="solid" style={{ marginTop: spacing.lg }} onPress={letsGo} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pillRow: { gap: 8, paddingRight: spacing.xl },
  price: { fontFamily: fonts.monoMedium },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink08,
  },
});
