import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';

/**
 * Minimal structural shape of the props Expo Router's `Tabs` passes to a custom
 * `tabBar` (a subset of react-navigation's BottomTabBarProps). Typed locally so
 * we don't depend on the vendored package's deep import path.
 */
type TabRoute = { key: string; name: string };
export type TabBarComponentProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
};

/** Static per-tab metadata (label + optional count) mirroring the design nav. */
const META: Record<string, { label: string; count?: string }> = {
  ask: { label: 'Ask' },
  discover: { label: 'Discover', count: '41' },
  together: { label: 'Together', count: '4' },
  list: { label: 'Your list', count: '12' },
  you: { label: 'You' },
};

/**
 * Custom bottom nav reproducing the design: cream panel, hairline top border,
 * each item a label over a small mono count, active item on a rounded fill.
 */
export function TabBar({ state, navigation }: TabBarComponentProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {state.routes.map((route, index) => {
        const meta = META[route.name] ?? { label: route.name };
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <View style={[styles.pill, focused && styles.pillActive]}>
              <Text variant="bodyMedium" size={11} color={colors.ink}>
                {meta.label}
              </Text>
              {meta.count ? (
                <Text variant="kicker" size={9} color={colors.ink45} style={styles.count}>
                  {meta.count}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.ink12,
    backgroundColor: colors.panel,
  },
  item: { flex: 1 },
  pill: {
    flex: 1,
    minHeight: 46,
    margin: 2,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  pillActive: { backgroundColor: '#e5dbc8' },
  count: { letterSpacing: 0.5, opacity: 0.9 },
});
