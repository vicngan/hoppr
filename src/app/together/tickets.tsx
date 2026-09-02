import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { TicketsBody } from '@/components/together/TicketsBody';
import { spacing } from '@/theme/tokens';

/**
 * Standalone Tickets route — reached by pushing from chat.tsx's "I'm in"
 * confirmation. The Together tab (`together/index.tsx`) shows the same
 * `TicketsBody` inline once the active hop has a reservation; this route
 * stays for entry points that push to it directly rather than living on
 * the tab.
 */
export default function TicketsScreen() {
  const router = useRouter();

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="sub" title="Your tickets" onBack={() => router.back()} />
      <View style={styles.body}>
        <TicketsBody onPlan={() => router.push('/together/plan/invite')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
});
