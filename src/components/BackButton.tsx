import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';

/**
 * The back affordance from the design — a bare "←" for inline headers, or a
 * circular paper chip (`floating`) for overlaying a photo hero.
 */
export function BackButton({ floating, style }: { floating?: boolean; style?: ViewStyle }) {
  const router = useRouter();
  const onPress = () => (router.canGoBack() ? router.back() : router.replace('/explore'));
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={[floating ? styles.floating : styles.inline, style]}>
      <Text variant="body" size={floating ? 17 : 18} color={colors.ink}>
        ←
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  floating: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(247,242,232,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
