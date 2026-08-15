import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing } from '@/theme/tokens';
import { usePlace } from '@/core/places-store';
import { useMenu, useMenuStore } from '@/core/menu/store';
import { recommendDish } from '@/core/menu/recommend';
import { useTaste } from '@/core/taste/store';
import { usePlanStore } from '@/core/together/plan-store';

/** Step 7 of 8 — 2 pre-order suggestions ("good for the table"). Both footer
 * actions advance the same way; ordering isn't wired to a real POS this pass. */
export default function PlanPreorderScreen() {
  const router = useRouter();
  const fromPlace = usePlanStore((s) => s.fromPlace);
  const setPreorder = usePlanStore((s) => s.setPreorder);
  const place = usePlace(fromPlace ?? undefined);
  const menu = useMenu(fromPlace ?? '');
  const prefs = useMenuStore((s) => s.prefs);
  const taste = useTaste((s) => s.profile);

  const primary = place ? recommendDish(menu, taste, prefs, place.category) : null;
  const suggestions = primary ? [primary.item, ...primary.alternatives.map((a) => a.item)].slice(0, 2) : [];

  const advance = (itemIds: string[]) => {
    setPreorder({ itemIds });
    router.push('/together/plan/ticket');
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="sub" title="Plan together" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 7 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: 8 }}>
          Good for the table.
        </Text>
        <Text variant="serif" size={16} color={colors.ink80} style={{ marginBottom: spacing.lg }}>
          A head start on the order — decide there if you&apos;d rather wait.
        </Text>

        {suggestions.length > 0
          ? suggestions.map((item) => (
              <Card key={item.id} style={{ marginBottom: spacing.md }}>
                <View style={styles.row}>
                  <Text variant="bodyMedium" size={16}>
                    {item.name}
                  </Text>
                  {item.price != null ? (
                    <Text variant="kicker" size={12} color={colors.accent}>
                      ${item.price.toFixed(2)}
                    </Text>
                  ) : null}
                </View>
                {item.description ? (
                  <Text variant="body" size={13} color={colors.ink72} style={{ marginTop: 4 }}>
                    {item.description}
                  </Text>
                ) : null}
              </Card>
            ))
          : (
            <Card style={{ marginBottom: spacing.md }}>
              <Text variant="bodyMedium" size={15} style={{ marginBottom: 4 }}>
                Something to share
              </Text>
              <Text variant="body" size={13} color={colors.ink72}>
                A good starter and something everyone can pick at — easy default for a table this size.
              </Text>
            </Card>
          )}

        <PillButton
          label="Decide there"
          variant="outline"
          style={{ marginTop: spacing.sm }}
          onPress={() => advance([])}
        />
        <PillButton
          label="Order for the table"
          variant="solid"
          style={{ marginTop: spacing.sm }}
          onPress={() => advance(suggestions.map((s) => s.id))}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
