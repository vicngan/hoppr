import { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { useTaste } from '@/core/taste/store';
import { useLibrary } from '@/core/library/store';
import { useOnboarding } from '@/core/onboarding/store';
import { useUnits, type DistanceUnit } from '@/core/units-store';
import { useLocationStore } from '@/core/location-store';
import { useSession } from '@/core/session';
import { supabase } from '@/core/supabase';

/**
 * Settings — Profile's gear icon per SPEC.md §8's dead-CTA disposition (a
 * real tap target). Profile/units/location sections are real, persisted
 * preferences (onboarding/store.ts, units-store.ts, location-store.ts);
 * Notifications stays a stub (no push infra exists) and Sign out only
 * appears when a backend session actually exists.
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
        <Kicker style={{ marginBottom: 10 }}>Profile</Kicker>
        <ProfileSection />

        <Kicker style={{ marginTop: spacing.xxl, marginBottom: 10 }}>Distance units</Kicker>
        <UnitsSection />

        <Kicker style={{ marginTop: spacing.xxl, marginBottom: 10 }}>Location</Kicker>
        <LocationSection />

        <Kicker style={{ marginTop: spacing.xxl, marginBottom: 10 }}>Notifications</Kicker>
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

function ProfileSection() {
  const name = useOnboarding((s) => s.name);
  const photoUri = useOnboarding((s) => s.photoUri);
  const setField = useOnboarding((s) => s.setField);
  const [draftName, setDraftName] = useState(name);

  const changePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Hoppr needs photo library access to set a profile photo.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled || !res.assets?.[0]?.uri) return;
    setField('photoUri', res.assets[0].uri);
  };

  return (
    <View style={styles.profileRow}>
      <Pressable onPress={changePhoto} style={styles.avatarWrap}>
        {photoUri && photoUri !== 'placeholder' ? (
          <Image source={{ uri: photoUri }} style={styles.avatarImg} />
        ) : (
          <LinearGradient
            colors={[colors.avatarGradientFrom, colors.avatarGradientTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarImg}
          />
        )}
        <View style={styles.avatarEditBadge}>
          <Text variant="kicker" size={8} color={colors.onDark}>
            EDIT
          </Text>
        </View>
      </Pressable>
      <TextInput
        value={draftName}
        onChangeText={(v) => {
          setDraftName(v);
          setField('name', v);
        }}
        placeholder="Your name"
        placeholderTextColor={colors.ink40}
        style={styles.nameInput}
      />
    </View>
  );
}

function UnitsSection() {
  const unit = useUnits((s) => s.unit);
  const setUnit = useUnits((s) => s.setUnit);
  const options: { id: DistanceUnit; label: string }[] = [
    { id: 'mi', label: 'Miles' },
    { id: 'km', label: 'Kilometers' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((o) => (
        <PillButton key={o.id} label={o.label} selected={unit === o.id} onPress={() => setUnit(o.id)} />
      ))}
    </View>
  );
}

function LocationSection() {
  const label = useLocationStore((s) => s.label);
  const status = useLocationStore((s) => s.status);
  const savedLocations = useLocationStore((s) => s.savedLocations);
  const mode = useLocationStore((s) => s.mode);
  const useCurrentLocation = useLocationStore((s) => s.useCurrentLocation);
  const addSavedLocation = useLocationStore((s) => s.addSavedLocation);
  const removeSavedLocation = useLocationStore((s) => s.removeSavedLocation);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const addLocation = async () => {
    const address = query.trim();
    if (!address) return;
    setSearching(true);
    try {
      const [hit] = await Location.geocodeAsync(address);
      if (!hit) {
        Alert.alert('No match', `Couldn't find "${address}" — try a more specific address or city.`);
        return;
      }
      addSavedLocation(address, { lat: hit.latitude, lng: hit.longitude });
      setQuery('');
    } catch {
      Alert.alert(
        'Search unavailable',
        'Location search needs a native device (it isn’t available in this preview).',
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text variant="body" size={14}>
            {label}
          </Text>
          <Text variant="kicker" size={9} color={colors.ink45} style={{ marginTop: 2 }}>
            {mode === 'current' ? 'CURRENT LOCATION' : 'SAVED LOCATION'}
          </Text>
        </View>
        {mode !== 'current' ? (
          <Pressable onPress={() => useCurrentLocation()} hitSlop={8}>
            <Text variant="kicker" size={10} color={colors.accent}>
              USE CURRENT
            </Text>
          </Pressable>
        ) : status === 'pending' ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : null}
      </View>

      {savedLocations.map((loc) => {
        const active = typeof mode !== 'string' && mode.savedId === loc.id;
        return (
          <View key={loc.id} style={styles.row}>
            <Pressable
              onPress={() => useLocationStore.getState().selectSaved(loc.id)}
              style={{ flex: 1 }}>
              <Text variant="body" size={14} color={active ? colors.accent : colors.ink}>
                {loc.label}
              </Text>
            </Pressable>
            <Pressable onPress={() => removeSavedLocation(loc.id)} hitSlop={8}>
              <Text variant="kicker" size={10} color={colors.ink45}>
                REMOVE
              </Text>
            </Pressable>
          </View>
        );
      })}

      <View style={styles.addLocationRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Add a city or address"
          placeholderTextColor={colors.ink40}
          style={styles.locationInput}
          returnKeyType="done"
          onSubmitEditing={addLocation}
        />
        <Pressable
          onPress={addLocation}
          disabled={searching}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}>
          {searching ? (
            <ActivityIndicator size="small" color={colors.onDark} />
          ) : (
            <Text variant="bodyMedium" size={13} color={colors.onDark}>
              Add
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink10,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.sm },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  nameInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink16,
    paddingVertical: 8,
  },
  addLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  locationInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink14,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
});
