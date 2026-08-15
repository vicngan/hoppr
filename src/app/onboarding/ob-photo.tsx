import { useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboarding } from '@/core/onboarding/store';

/**
 * Avatar upload is a tappable placeholder toggle — no real image picker
 * (out of scope per package brief). DOB is three plain numeric inputs.
 */
export default function ObPhotoScreen() {
  const router = useRouter();
  const photoUri = useOnboarding((s) => s.photoUri);
  const dob = useOnboarding((s) => s.dob);
  const setField = useOnboarding((s) => s.setField);

  const [month, setMonth] = useState(dob?.split('-')[1] ?? '');
  const [day, setDay] = useState(dob?.split('-')[2] ?? '');
  const [year, setYear] = useState(dob?.split('-')[0] ?? '');

  const togglePhoto = () => setField('photoUri', photoUri ? undefined : 'placeholder');

  const next = () => {
    if (month && day && year) setField('dob', `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    router.push('/onboarding/ob-notif' as never);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader
          eyebrow="ALMOST THERE"
          onBack={() => router.back()}
          skipLabel="Skip for now"
          onSkip={next}
        />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            Put a face to the name.
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            Helps friends find you when you plan together.
          </Text>

          <Pressable onPress={togglePhoto} style={styles.avatarWrap}>
            {photoUri ? (
              <LinearGradient
                colors={[colors.avatarGradientFrom, colors.avatarGradientTo]}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="rgba(20,17,13,0.35)" strokeWidth={1.5}>
                  <Circle cx={12} cy={9} r={4} />
                  <Path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                </Svg>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.onDark} strokeWidth={2}>
                <Path d="M23 19V8h-4l-2-3H7L5 8H1v11z" />
                <Circle cx={12} cy={13} r={4} />
              </Svg>
            </View>
          </Pressable>

          <Text variant="bodyMedium" size={13} style={styles.dobLabel}>
            Date of birth
          </Text>
          <View style={styles.dobRow}>
            <TextInput
              value={month}
              onChangeText={setMonth}
              placeholder="MM"
              placeholderTextColor={colors.ink40}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.dobInput, styles.dobMonth]}
            />
            <TextInput
              value={day}
              onChangeText={setDay}
              placeholder="DD"
              placeholderTextColor={colors.ink40}
              keyboardType="number-pad"
              maxLength={2}
              style={styles.dobInput}
            />
            <TextInput
              value={year}
              onChangeText={setYear}
              placeholder="YYYY"
              placeholderTextColor={colors.ink40}
              keyboardType="number-pad"
              maxLength={4}
              style={[styles.dobInput, styles.dobYear]}
            />
          </View>
          <Text variant="body" size={12} color={colors.ink45} style={styles.notice}>
            You must be 21+ for bars and nightlife.
          </Text>
        </View>
      </View>

      <PillButton label="Continue" variant="solid" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: {},
  body: { paddingTop: spacing.xl, alignItems: 'center' },
  headline: { marginBottom: spacing.sm, alignSelf: 'flex-start' },
  sub: { marginBottom: spacing.xl, alignSelf: 'flex-start' },
  avatarWrap: { marginBottom: spacing.xxl, position: 'relative' },
  avatar: { width: 130, height: 130, borderRadius: 65 },
  avatarEmpty: {
    borderWidth: 2,
    borderColor: colors.ink20,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.fill,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dobLabel: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  dobRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  dobInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.ink14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
  },
  dobMonth: { flex: 2 },
  dobYear: { flex: 1.4 },
  notice: { marginTop: spacing.md, alignSelf: 'flex-start' },
});
