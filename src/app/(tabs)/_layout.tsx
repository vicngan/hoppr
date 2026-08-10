import { Tabs } from 'expo-router';

/**
 * The five-tab shell: Ask · Discover · Together · Your list · You.
 * Ask is first, so the app opens on the mascot discovery screen.
 *
 * The visible bottom nav is `GlobalTabBar`, rendered once at the root so it
 * persists across pushed stack routes too; this navigator hides its own bar to
 * avoid a duplicate.
 */
export default function TabsLayout() {
  return (
    <Tabs tabBar={() => null} screenOptions={{ headerShown: false, animation: 'shift' }}>
      <Tabs.Screen name="ask" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="together" />
      <Tabs.Screen name="list" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
