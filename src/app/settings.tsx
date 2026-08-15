import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing } from '@/theme/tokens';
import { useTaste } from '@/core/taste/store';
import { useLibrary } from '@/core/library/store';
import { useSession } from '@/core/session';
import { supabase } from '@/core/supabase';

/**
 * Minimal settings stub — Profile's gear icon per SPEC.md §8's dead-CTA
 * disposition (a real tap target, not a dead one), not a full settings
 * surface. Sign-out only appears when a backend session actually exists
 * (`useSession().backendReady`); the app otherwise runs entirely on local
 * stores, so "sign out" would have nothing to sign out of.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { session, backendReady } = useSession();
  const reset = useTaste((s) => s.reset);
  const clearLibrary = useLibrary((s) => s.clear);

  return (
    <>
      <AppHeader variant="sub" title="Settings" onBack={() => router.back()} />
      <Screen>
        <Kicker style={{ marginBottom: 10 }}>Notifications</Kicker>
        <View style={styles.row}>
          <Text variant="body" size={14}>
            Push notifications
          </Text>
          <Text variant="kicker" size={10} color={colors.ink45}>
            Coming soon
          </Text>
        </View>
        <View style={styles.row}>
          <Text variant="body" size={14}>
            Weekly digest
          </Text>
          <Text variant="kicker" size={10} color={colors.ink45}>
            Coming soon
          </Text>
        </View>

        <Kicker style={{ marginTop: spacing.xxl, marginBottom: 10 }}>Account</Kicker>
        {backendReady && session ? (
          <PillButton
            label="Sign out"
            onPress={() => supabase?.auth.signOut()}
            style={{ borderColor: colors.ink20 }}
          />
        ) : (
          <Text variant="serif" size={15} color={colors.ink70}>
            You&apos;re not signed in to an account — Hoppr is running on this
            device&apos;s local profile.
          </Text>
        )}

        <PillButton
          label="Forget what you know about me"
          style={{ marginTop: spacing.xxl, borderColor: colors.ink20 }}
          onPress={() => {
            reset();
            clearLibrary();
          }}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink10,
  },
});
