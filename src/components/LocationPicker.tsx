import { Modal, Pressable, View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Kicker } from '@/components/ui';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useLocationStore } from '@/core/location-store';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Dropdown opened from the Discover header's location pill: "use current
 * location" plus a saved-locations section (empty for now — add/edit ships
 * in a later slice).
 */
export function LocationPicker({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const mode = useLocationStore((s) => s.mode);
  const status = useLocationStore((s) => s.status);
  const savedLocations = useLocationStore((s) => s.savedLocations);

  if (!visible) return null;

  const isCurrent = mode === 'current';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop} />
      </Pressable>
      <Animated.View
        entering={FadeInDown.duration(220)}
        style={[styles.sheet, { top: insets.top + 64 }]}
        pointerEvents="box-none">
        <View style={styles.card}>
          <Row
            icon={status === 'pending' && isCurrent ? undefined : '◎'}
            label="Use current location"
            selected={isCurrent}
            loading={status === 'pending' && isCurrent}
            onPress={async () => {
              await useLocationStore.getState().useCurrentLocation();
              onClose();
            }}
          />

          <View style={styles.divider} />

          <Kicker style={styles.sectionLabel}>Saved</Kicker>

          {savedLocations.length === 0 ? (
            <Text variant="body" size={13} color={colors.ink45} style={styles.empty}>
              No saved places yet
            </Text>
          ) : (
            savedLocations.map((loc) => (
              <Row
                key={loc.id}
                label={loc.label}
                selected={typeof mode !== 'string' && mode.savedId === loc.id}
                onPress={() => {
                  useLocationStore.getState().selectSaved(loc.id);
                  onClose();
                }}
              />
            ))
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

function Row({
  icon,
  label,
  selected,
  loading,
  onPress,
}: {
  icon?: string;
  label: string;
  selected?: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, selected && styles.rowSelected, { opacity: pressed ? 0.7 : 1 }]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.accent} style={styles.rowIcon} />
      ) : icon ? (
        <Text variant="bodyMedium" size={15} color={selected ? colors.accent : colors.ink45} style={styles.rowIcon}>
          {icon}
        </Text>
      ) : (
        <View style={styles.rowIcon} />
      )}
      <Text variant="bodyMedium" size={14} color={selected ? colors.ink : colors.ink72}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,17,13,0.25)' },
  sheet: { position: 'absolute', left: spacing.xl, right: spacing.xl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink16,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginHorizontal: spacing.sm,
  },
  rowSelected: { backgroundColor: colors.fill },
  rowIcon: { width: 18, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.ink10, marginVertical: spacing.sm, marginHorizontal: spacing.lg },
  sectionLabel: { paddingHorizontal: spacing.lg, paddingBottom: 6 },
  empty: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
});
