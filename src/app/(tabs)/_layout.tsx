import { Tabs } from 'expo-router';
import { TabBar, type TabBarComponentProps } from '@/components/TabBar';

/**
 * The five-tab shell: Ask · Discover · Together · Your list · You.
 * Ask is first, so the app opens on the mascot discovery screen.
 */
export default function TabsLayout() {
  return (
    <Tabs
      // Expo Router's BottomTabBarProps is a superset of what TabBar reads.
      tabBar={(props) => <TabBar {...(props as unknown as TabBarComponentProps)} />}
      screenOptions={{ headerShown: false, animation: 'shift' }}>
      <Tabs.Screen name="ask" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="together" />
      <Tabs.Screen name="list" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
