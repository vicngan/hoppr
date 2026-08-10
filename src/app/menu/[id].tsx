import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { usePlace } from '@/core/places-store';
import { useTaste } from '@/core/taste/store';
import { useMenu, useMenuStore } from '@/core/menu/store';
import { recommendDish } from '@/core/menu/recommend';
import { DIETARY_LABEL, type Dietary, type MenuItem } from '@/core/menu/types';
import { aiAvailable, aiExtractMenu } from '@/core/ai/client';

const DIETS: Dietary[] = ['veg', 'vegan', 'gf'];

/**
 * The "Order this" menu chooser. Shows the taste-matched pick + alternatives,
 * the full menu, dietary toggles, and the photo→extract / manual add flow.
 */
export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = usePlace(id);
  const profile = useTaste((s) => s.profile);
  const items = useMenu(id ?? '');
  const prefs = useMenuStore((s) => s.prefs);
  const setDiet = useMenuStore((s) => s.setDiet);
  const setNoAlcohol = useMenuStore((s) => s.setNoAlcohol);
  const addItems = useMenuStore((s) => s.addItems);

  const [busy, setBusy] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [mName, setMName] = useState('');
  const [mPrice, setMPrice] = useState('');

  const pick = useMemo(
    () => (place ? recommendDish(items, profile, prefs, place.category) : null),
    [items, profile, prefs, place],
  );

  const sections = useMemo(() => groupBySection(items), [items]);

  if (!place) {
    return (
      <Screen contentStyle={{ paddingTop: 60 }}>
        <BackButton style={{ marginBottom: 18 }} />
        <Text variant="serif" size={20}>
          That place wandered off.
        </Text>
      </Screen>
    );
  }

  async function capture(from: 'camera' | 'library') {
    try {
      const perm =
        from === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', `Hoppr needs ${from} access to read a menu.`);
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { base64: true, quality: 0.5 };
      const res =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.[0]?.base64) return;

      if (!aiAvailable()) {
        Alert.alert(
          'Reading menus needs the AI backend',
          'Connect Supabase + an Anthropic key to auto-extract from a photo. For now you can add items by hand.',
          [{ text: 'Add by hand', onPress: () => setShowManual(true) }, { text: 'OK' }],
        );
        return;
      }

      setBusy(true);
      const asset = res.assets[0];
      const extracted = await aiExtractMenu(asset.base64!, asset.mimeType ?? 'image/jpeg');
      if (extracted.length === 0) {
        Alert.alert('Nothing found', "Couldn't read items from that photo — try a clearer shot.");
      } else {
        addItems(place!.id, extracted);
        Alert.alert('Added', `Pulled ${extracted.length} item${extracted.length === 1 ? '' : 's'} off the menu.`);
      }
    } catch (e) {
      Alert.alert('Something went wrong', String(e));
    } finally {
      setBusy(false);
    }
  }

  function snap() {
    Alert.alert('Add the menu', 'Snap a photo or pick one from your library.', [
      { text: 'Take a photo', onPress: () => capture('camera') },
      { text: 'Choose photo', onPress: () => capture('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function addManual() {
    const name = mName.trim();
    if (!name) return;
    const price = parseFloat(mPrice.replace(/[^0-9.]/g, ''));
    const item: MenuItem = {
      id: `manual-${Date.now()}`,
      name,
      price: Number.isFinite(price) ? price : null,
      tags: [],
      dietary: [],
      source: 'manual',
    };
    addItems(place!.id, [item]);
    setMName('');
    setMPrice('');
  }

  return (
    <Screen contentStyle={{ paddingTop: 60 }}>
      <BackButton style={{ marginBottom: 18 }} />
      <Kicker style={{ marginBottom: 10 }}>{place.name} · menu</Kicker>
      <Text variant="display" size={28} style={{ marginBottom: 18 }}>
        What should you get?
      </Text>

      {/* dietary prefs */}
      <View style={styles.prefs}>
        {DIETS.map((d) => (
          <PillButton
            key={d}
            label={DIETARY_LABEL[d]}
            compact
            selected={prefs.diet === d}
            onPress={() => setDiet(prefs.diet === d ? null : d)}
          />
        ))}
        <PillButton
          label="No alcohol"
          compact
          selected={prefs.noAlcohol}
          onPress={() => setNoAlcohol(!prefs.noAlcohol)}
        />
      </View>

      {/* the pick */}
      {pick ? (
        <Card accent style={{ marginBottom: spacing.lg }}>
          <Kicker accent style={{ marginBottom: 10 }}>
            Hoppr's pick for you
          </Kicker>
          <View style={styles.dishHead}>
            <Text variant="serif" size={24} style={{ flex: 1 }}>
              {pick.item.name}
            </Text>
            {pick.item.price != null ? (
              <Text variant="bodyMedium" size={13} style={styles.price}>
                ${pick.item.price.toFixed(2)}
              </Text>
            ) : null}
          </View>
          <Text variant="body" size={13} color={colors.ink72} style={{ marginTop: 9 }}>
            {pick.reason}
          </Text>

          {pick.alternatives.length > 0 && (
            <View style={styles.alts}>
              {pick.alternatives.map((a) => (
                <View key={a.item.id} style={styles.altRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" size={13}>
                      {a.item.name}
                    </Text>
                    <Text variant="body" size={11} color={colors.ink50} style={{ marginTop: 2 }}>
                      {a.note}
                    </Text>
                  </View>
                  {a.item.price != null ? (
                    <Text variant="bodyMedium" size={11} color={colors.ink60} style={styles.price}>
                      ${a.item.price.toFixed(2)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Card>
      ) : (
        <Card style={{ marginBottom: spacing.lg }}>
          <Text variant="serif" size={18}>
            No menu here yet.
          </Text>
          <Text variant="body" size={13} color={colors.ink70} style={{ marginTop: 8 }}>
            Add one below and Hoppr will pick what fits your taste.
          </Text>
        </Card>
      )}

      {/* capture / add */}
      <PillButton
        label={busy ? 'Reading the menu…' : '📷  Snap the menu'}
        variant="solid"
        onPress={snap}
      />
      {busy ? <ActivityIndicator style={{ marginTop: 12 }} color={colors.accent} /> : null}

      <Pressable onPress={() => setShowManual((v) => !v)} style={styles.manualToggle}>
        <Text variant="bodyMedium" size={13} color={colors.ink55}>
          {showManual ? 'Hide manual add' : 'Add an item by hand'}
        </Text>
      </Pressable>

      {showManual && (
        <View style={styles.manualRow}>
          <TextInput
            value={mName}
            onChangeText={setMName}
            placeholder="Dish name"
            placeholderTextColor={colors.ink40}
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            value={mPrice}
            onChangeText={setMPrice}
            placeholder="$"
            placeholderTextColor={colors.ink40}
            keyboardType="decimal-pad"
            style={[styles.input, { width: 70 }]}
          />
          <PillButton label="Add" compact variant="solid" onPress={addManual} />
        </View>
      )}

      {/* full menu */}
      {sections.length > 0 && (
        <View style={{ marginTop: spacing.xxl }}>
          <Kicker style={{ marginBottom: 12 }}>The full menu · {items.length} items</Kicker>
          {sections.map(([section, list]) => (
            <View key={section} style={{ marginBottom: 18 }}>
              {section ? (
                <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 8 }}>
                  {section}
                </Text>
              ) : null}
              {list.map((it) => (
                <View key={it.id} style={styles.menuRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" size={14}>
                      {it.name}
                    </Text>
                    {it.description ? (
                      <Text variant="body" size={11} color={colors.ink50} style={{ marginTop: 3 }}>
                        {it.description}
                      </Text>
                    ) : null}
                  </View>
                  {it.price != null ? (
                    <Text variant="bodyMedium" size={12} color={colors.ink60} style={styles.price}>
                      ${it.price.toFixed(2)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function groupBySection(items: MenuItem[]): [string, MenuItem[]][] {
  const map = new Map<string, MenuItem[]>();
  for (const it of items) {
    const key = it.section ?? '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(it);
  }
  return [...map.entries()];
}

const styles = StyleSheet.create({
  prefs: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: spacing.xl },
  dishHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  price: { fontFamily: fonts.monoMedium },
  alts: {
    borderTopWidth: 1,
    borderTopColor: colors.ink10,
    marginTop: 16,
    paddingTop: 14,
    gap: 11,
  },
  altRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  manualToggle: { marginTop: 16, alignSelf: 'flex-start' },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  input: {
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink08,
  },
});
