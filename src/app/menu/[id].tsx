import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
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
 * `menu-entry` bottom sheet: photo / browse / describe, 3 options (SCREEN_MAP
 * `menu-entry` row). Presented as a `Modal` from inside this screen rather
 * than as a separate `Stack.Screen` route — `_layout.tsx` (integration
 * owner's file) isn't touched by this package, and `menu/[id]` is already
 * registered there without the `slide_from_bottom` animation `rate/[id]` uses.
 * This reproduces that same slide-up sheet convention (paper sheet, `radius.sheet`,
 * translucent scrim) at the component level instead.
 */
function MenuEntrySheet({
  visible,
  onClose,
  onPhoto,
  onBrowse,
  onDescribe,
}: {
  visible: boolean;
  onClose: () => void;
  onPhoto: () => void;
  onBrowse: () => void;
  onDescribe: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={sheetStyles.scrim} onPress={onClose} />
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.handle} />
        <Kicker style={{ marginBottom: 6 }}>How should Hoppr help?</Kicker>
        <Text variant="display" size={22} style={{ marginBottom: 18 }}>
          Order this
        </Text>
        <Pressable style={sheetStyles.option} onPress={onPhoto}>
          <Text variant="bodyMedium" size={15}>
            📷  Snap the menu
          </Text>
          <Text variant="body" size={12} color={colors.ink50} style={{ marginTop: 3 }}>
            Hoppr reads the photo and points at what fits you
          </Text>
        </Pressable>
        <Pressable style={sheetStyles.option} onPress={onBrowse}>
          <Text variant="bodyMedium" size={15}>
            📋  Browse the menu
          </Text>
          <Text variant="body" size={12} color={colors.ink50} style={{ marginTop: 3 }}>
            See the full list and Hoppr&apos;s pick
          </Text>
        </Pressable>
        <Pressable style={[sheetStyles.option, { borderBottomWidth: 0 }]} onPress={onDescribe}>
          <Text variant="bodyMedium" size={15}>
            💬  Describe what you want
          </Text>
          <Text variant="body" size={12} color={colors.ink50} style={{ marginTop: 3 }}>
            Tell Hoppr your mood, get a pick
          </Text>
        </Pressable>
        <PillButton label="Cancel" onPress={onClose} style={{ marginTop: 10 }} />
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(20,17,13,0.4)' },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink16,
    marginBottom: 16,
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink08,
  },
});

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
  /** menu-entry sheet opens by default on arrival at this route (SCREEN_MAP). */
  const [showEntry, setShowEntry] = useState(true);
  /** menu-photo sub-state — a simulated OCR result, no real vision pipeline. */
  const [showPhotoMock, setShowPhotoMock] = useState(false);

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

  if (showPhotoMock) {
    return (
      <MenuPhotoMock
        placeName={place.name}
        pick={pick}
        onClose={() => setShowPhotoMock(false)}
      />
    );
  }

  return (
    <Screen contentStyle={{ paddingTop: 60 }}>
      <MenuEntrySheet
        visible={showEntry}
        onClose={() => setShowEntry(false)}
        onPhoto={() => {
          setShowEntry(false);
          setShowPhotoMock(true);
        }}
        onBrowse={() => setShowEntry(false)}
        onDescribe={() => {
          setShowEntry(false);
          setShowManual(true);
        }}
      />
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
            Hoppr&apos;s pick for you
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

type DishPickLike = ReturnType<typeof recommendDish>;

/**
 * `menu-photo` sub-state: a static "scanned menu" mock visual. There's no
 * real vision pipeline for this pass (see `aiExtractMenu` above, which is
 * the actual OCR path when the AI backend is configured) — this is a
 * simulated result screen reached from the entry sheet's "Snap the menu"
 * option, highlighting the same real recommendation from `menu/recommend.ts`
 * rather than fabricated copy.
 */
function MenuPhotoMock({
  placeName,
  pick,
  onClose,
}: {
  placeName: string;
  pick: DishPickLike;
  onClose: () => void;
}) {
  return (
    <Screen contentStyle={{ paddingTop: 60 }}>
      <BackButton style={{ marginBottom: 18 }} />
      <Kicker style={{ marginBottom: 10 }}>{placeName} · scanned menu</Kicker>
      <Text variant="display" size={26} style={{ marginBottom: 8 }}>
        Got it — here&apos;s what stood out
      </Text>
      <Text variant="body" size={13} color={colors.ink55} style={{ marginBottom: 20 }}>
        A simulated scan for now — Hoppr highlighted the pick that fits your taste.
      </Text>

      <View style={photoMockStyles.scanFrame}>
        <View style={photoMockStyles.scanLine} />
        <Text variant="kicker" size={9} color={colors.ink40} style={{ marginBottom: 10 }}>
          MENU · PHOTO
        </Text>
        {pick ? (
          <>
            <View style={photoMockStyles.highlightRow}>
              <Text variant="bodyMedium" size={14} style={{ flex: 1 }}>
                {pick.item.name}
              </Text>
              {pick.item.price != null ? (
                <Text variant="bodyMedium" size={12} color={colors.ink60}>
                  ${pick.item.price.toFixed(2)}
                </Text>
              ) : null}
            </View>
            {pick.alternatives.slice(0, 2).map((a) => (
              <View key={a.item.id} style={photoMockStyles.plainRow}>
                <Text variant="body" size={13} color={colors.ink60} style={{ flex: 1 }}>
                  {a.item.name}
                </Text>
                {a.item.price != null ? (
                  <Text variant="body" size={12} color={colors.ink45}>
                    ${a.item.price.toFixed(2)}
                  </Text>
                ) : null}
              </View>
            ))}
          </>
        ) : (
          <Text variant="body" size={13} color={colors.ink55}>
            No items to highlight yet — add this menu by hand below.
          </Text>
        )}
      </View>

      {pick ? (
        <Card accent style={{ marginTop: 18 }}>
          <Kicker accent style={{ marginBottom: 8 }}>
            Hoppr&apos;s pick
          </Kicker>
          <Text variant="serif" size={20}>
            {pick.item.name}
          </Text>
          <Text variant="body" size={13} color={colors.ink70} style={{ marginTop: 8 }}>
            {pick.reason}
          </Text>
        </Card>
      ) : null}

      <PillButton label="Back to menu" variant="solid" style={{ marginTop: spacing.xl }} onPress={onClose} />
    </Screen>
  );
}

const photoMockStyles = StyleSheet.create({
  scanFrame: {
    borderWidth: 1.5,
    borderColor: colors.ink16,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    padding: spacing.lg,
    backgroundColor: colors.card,
  },
  scanLine: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.5,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    backgroundColor: 'rgba(200,67,28,0.1)',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 8,
  },
  plainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingVertical: 6,
  },
});

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
