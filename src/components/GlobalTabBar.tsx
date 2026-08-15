import { type ReactElement } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter, type Href } from 'expo-router';
import { colors, radius } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';
import { useLibrary } from '@/core/library/store';
import { usePlacesStore } from '@/core/places-store';
import { useTogether } from '@/core/together';
import { HomeIcon, ExploreIcon, SavedIcon, TogetherIcon, type IconProps } from '@/theme/icons';

/**
 * A persistent bottom nav rendered once at the root, *below* the navigator, so
 * the five tabs stay visible on every screen — including the pushed stack
 * routes (place / menu / rate / chat / hop) that would otherwise cover the tab
 * navigator's own bar. Active state is derived from the path, and taps route
 * via the router (which pops back to the tabs from a deep screen).
 */
type TabDef = {
  name: string;
  label: string;
  href: Href;
  Icon: (props: IconProps) => ReactElement;
};
const TABS: TabDef[] = [
  { name: 'home', label: 'Home', href: '/home' as Href, Icon: HomeIcon },
  { name: 'explore', label: 'Explore', href: '/explore' as Href, Icon: ExploreIcon },
  { name: 'saved', label: 'Saved', href: '/saved' as Href, Icon: SavedIcon },
  { name: 'together', label: 'Together', href: '/together' as Href, Icon: TogetherIcon },
];

/** Map the current path's first segment to the tab it belongs to. */
function activeTab(pathname: string): string {
  const seg = pathname.split('/')[1] || 'home';
  // the whole hop flow and the plan-together wizard live under Together
  if (seg === 'hop') return 'together';
  if (seg === 'together' && pathname.startsWith('/together/plan')) return 'together';
  if (seg === 'profile') return 'profile';
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
      case 'explore':
        return placesCount > 0 ? String(placesCount) : undefined;
      case 'saved':
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
        const iconColor = focused ? colors.accent : colors.ink40;
        return (
          <Pressable
            key={tab.name}
            onPress={() => {
              if (!focused) router.navigate(tab.href);
            }}
            style={({ pressed }) => [styles.item, pressed && { transform: [{ scale: 0.86 }] }]}>
            <View style={styles.pill}>
              <View style={styles.iconWrap}>
                <tab.Icon size={22} color={iconColor} filled={tab.name === 'saved' && focused} />
                {count ? <View style={styles.badge} /> : null}
              </View>
              <Text
                variant="bodyMedium"
                size={11}
                color={iconColor}
                style={focused ? styles.labelActive : styles.labelInactive}>
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
      <Pressable
        key="profile"
        onPress={() => {
          if (active !== 'profile') router.navigate('/profile' as Href);
        }}
        style={({ pressed }) => [styles.item, pressed && { transform: [{ scale: 0.86 }] }]}>
        <View style={styles.pill}>
          <View style={[styles.profileRing, active === 'profile' && styles.profileRingActive]}>
            <LinearGradient
              colors={[colors.avatarGradientFrom, colors.avatarGradientTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileDot}
            />
          </View>
          <Text
            variant="bodyMedium"
            size={11}
            color={active === 'profile' ? colors.accent : colors.ink40}
            style={active === 'profile' ? styles.labelActive : styles.labelInactive}>
            Profile
          </Text>
        </View>
      </Pressable>
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
  iconWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  labelActive: { fontWeight: '600' },
  labelInactive: { fontWeight: '500' },
  profileRing: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileRingActive: {
    borderColor: colors.accent,
  },
  profileDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
