import { type ReactNode } from 'react';
import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { CloseIcon } from '@/theme/icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { CATEGORY_LABEL, type Place } from '@/core/places';

type Props = {
  place: Place | null;
  onClose: () => void;
  /** extra content under the built-in location/hours/price/blurb block, e.g. why-it-matched copy */
  children?: ReactNode;
};

/**
 * Swipe-card "tell me more" popup — a modal over the current deck position,
 * not a navigation away from it (SwipeStack keeps its own index state, so
 * closing this just reveals the same card underneath).
 */
export function DetailPopup({ place, onClose, children }: Props) {
  return (
    <Modal visible={!!place} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {place ? (
            <>
              <PlaceImage coords={place.coords} photo={place.photo} width="100%" height={180} mapSize={600} />
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <CloseIcon size={16} color={colors.ink} />
              </Pressable>
              <View style={styles.body}>
                <Text variant="serif" size={22} style={{ marginBottom: 4 }}>
                  {place.name}
                </Text>
                <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 12 }}>
                  {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
                </Text>

                <View style={styles.statRow}>
                  <Stat label="Hours" value={place.hoursLabel ?? '—'} />
                  <Stat label="Price" value={'$'.repeat(place.price)} />
                </View>

                <Text variant="body" size={14} color={colors.ink72} style={{ marginTop: spacing.md }}>
                  {place.blurb}
                </Text>

                {children}
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="kicker" size={9} color={colors.ink45}>
        {label.toUpperCase()}
      </Text>
      <Text variant="bodyMedium" size={13} color={colors.ink} style={{ marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(20,17,13,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(247,242,232,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: spacing.lg },
  statRow: { flexDirection: 'row', gap: spacing.xl },
});
