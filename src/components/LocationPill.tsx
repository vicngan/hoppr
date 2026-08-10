import { PillButton } from '@/components/ui';
import { useLocationStore } from '@/core/location-store';

/** The "Ann Arbor, MI ▾" trigger pill that opens the location picker. */
export function LocationPill({ onPress }: { onPress: () => void }) {
  const label = useLocationStore((s) => s.label);
  return <PillButton label={`${label} ▾`} icon="📍" variant="outline" compact onPress={onPress} />;
}
