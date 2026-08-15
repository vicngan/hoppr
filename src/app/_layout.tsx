import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAppFonts } from '@/theme/fonts';
import { colors } from '@/theme/tokens';
import { queryClient } from '@/core/query';
import { GlobalTabBar } from '@/components/GlobalTabBar';
import { useLocationStore } from '@/core/location-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const locationHydrated = useLocationStore((s) => s.hydrated);
  const pathname = usePathname();
  const showTabBar = !pathname.startsWith('/onboarding');

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (locationHydrated) useLocationStore.getState().initLocation();
  }, [locationHydrated]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {/* Navigator fills the space above a single persistent tab bar, so the
              five tabs stay visible on every screen — tabs and pushed stack
              routes alike. */}
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.paper },
                animation: 'slide_from_right',
              }}>
              <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="place/[id]" />
              <Stack.Screen name="category/[id]" />
              <Stack.Screen name="menu/[id]" />
              <Stack.Screen name="rate/[id]" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="hop/lobby" />
              <Stack.Screen name="hop/answer" />
              <Stack.Screen name="hop/swipe" />
              <Stack.Screen name="hop/pick" />
              <Stack.Screen name="hop/plan" />
              <Stack.Screen name="hop/join" options={{ animation: 'slide_from_bottom' }} />
            </Stack>
          </View>
          {showTabBar ? <GlobalTabBar /> : null}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
