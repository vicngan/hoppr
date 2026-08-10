import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter, type Href } from 'expo-router';
import { colors, radius } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';
import { useLibrary } from '@/core/library/store';
import { usePlacesStore } from '@/core/places-store';
import { useTogether } from '@/core/together';

/**
 * A persistent bottom nav rendered once at the root, *below* the navigator, so
 * the five tabs stay visible on every screen — including the pushed stack
 * routes (place / menu / rate / chat / hop) that would otherwise cover the tab
 * navigator's own bar. Active state is derived from the path, and taps route
 * via the router (which pops back to the tabs from a deep screen).
 */
type TabDef = { name: string; label: string; href: Href };
const TABS: TabDef[] = [
  { name: 'ask', label: 'Ask', href: '/ask' },
  { name: 'discover', label: 'Discover', href: '/discover' },
  { name: 'together', label: 'Together', href: '/together' },
  { name: 'list', label: 'Your list', href: '/list' },
  { name: 'you', label: 'You', href: '/you' },
];

/** Map the current path's first segment to the tab it belongs to. */
function activeTab(pathname: string): string {
  const seg = pathname.split('/')[1] || 'ask';
  if (seg === 'hop') return 'together'; // the whole hop flow lives under Together
  return TABS.some((t) => t.name === seg) ? seg : '';
}

export function GlobalTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const active = activeTab(pathname);

  // Live counts from the persisted stores — hidden when zero so tabs stay clean.
  const placesCount = usePlacesStore((s) => Object.keys(s.byId).length);
  const savedCount = useLibrary((s) => Object.keys(s.saved).length);
  const hopMembers = useTogether((s) => s.hop?.members.length ?? 0);

  const countFor = (name: string): string | undefined => {
    switch (name) {
      case 'discover':
        return placesCount > 0 ? String(placesCount) : undefined;
      case 'list':
        return savedCount > 0 ? String(savedCount) : undefined;
      case 'together':
        return hopMembers > 0 ? String(hopMembers) : undefined;
      default:
        return undefined;
    }
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => {
        const focused = tab.name === active;
        const count = countFor(tab.name);
        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              if (!focused) router.navigate(tab.href);
            }}
            style={styles.item}>
            <View style={[styles.pill, focused && styles.pillActive]}>
              <Text variant="bodyMedium" size={11} color={colors.ink}>
                {tab.label}
              </Text>
              {count ? (
                <Text variant="kicker" size={9} color={colors.ink45} style={styles.count}>
                  {count}
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
