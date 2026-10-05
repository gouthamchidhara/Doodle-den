// Onboarding 3: kid nickname (max 12), avatar, age band.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/kid/Avatar';
import { OnboardingFrame } from '@/components/parent/OnboardingFrame';
import { AVATAR_IDS, type AvatarId } from '@/content/avatars';
import { createKid, MAX_NICKNAME, updateKid } from '@/db/repositories/kidRepo';
import { getOnboardingKid, setOnboardingKid } from '@/services/onboarding';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import type { AgeMode } from '@/types/models';

import { useOnboardingStep } from './useOnboardingStep';

// Profile form; editing again (after Back) updates the same kid.
export function AddKidScreen() {
  useOnboardingStep('add-kid');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>('fox');
  const [age, setAge] = useState<AgeMode | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOnboardingKid()
      .then((k) => {
        if (!k) return;
        setExistingId(k.id);
        setNickname(k.nickname);
        setAvatar(AVATAR_IDS.includes(k.avatarId as AvatarId) ? (k.avatarId as AvatarId) : 'fox');
        setAge(k.ageMode);
      })
      .catch((e: unknown) => console.warn('[onboarding] load kid failed', e));
  }, []);

  const valid = nickname.trim().length > 0 && age !== null;

  const onNext = async () => {
    if (!valid || !age) return;
    setBusy(true);
    try {
      if (existingId) {
        await updateKid(existingId, { nickname, avatarId: avatar, ageMode: age });
      } else {
        const kid = await createKid({ nickname, avatarId: avatar, ageMode: age });
        await setOnboardingKid(kid.id);
      }
      router.push('/onboarding/time-rules');
    } catch (e) {
      console.warn('[onboarding] save kid failed', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingFrame title="Who will play?" onBack={() => router.back()} onNext={onNext} nextDisabled={!valid || busy}>
      <View style={styles.field}>
        <Text style={styles.label}>Nickname</Text>
        <TextInput
          accessibilityLabel="Nickname"
          value={nickname}
          onChangeText={(t) => setNickname(t.slice(0, MAX_NICKNAME))}
          maxLength={MAX_NICKNAME}
          placeholder="A nickname, not a full name"
          placeholderTextColor={colors.inkMuted}
          autoCorrect={false}
          autoComplete="off"
          style={styles.input}
        />
        <Text style={styles.hint}>A nickname, not a full name</Text>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Pick an avatar</Text>
        <View style={styles.avatars}>
          {AVATAR_IDS.map((id) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: avatar === id }}
              accessibilityLabel={`${id} avatar`}
              onPress={() => setAvatar(id)}
              style={[styles.avatar, avatar === id && styles.avatarOn]}
            >
              <Avatar id={id} size={64} />
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Age</Text>
        <View style={styles.row}>
          {(
            [
              ['little', '3–5'],
              ['big', '6–8'],
            ] as const
          ).map(([mode, label]) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected: age === mode }}
              accessibilityLabel={`Age ${label}`}
              onPress={() => setAge(mode)}
              style={[styles.choice, age === mode && styles.choiceOn]}
            >
              <Text style={styles.choiceText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.sm },
  label: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.inkMuted },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: border.thin,
    borderColor: colors.borderNeutral,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.ink,
  },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  avatar: { borderRadius: radius.round, borderWidth: border.normal, borderColor: 'transparent', padding: 2 },
  avatarOn: { borderColor: colors.ink },
  row: { flexDirection: 'row', gap: space.md },
  choice: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: border.thin,
    borderColor: colors.borderNeutral,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceOn: { borderWidth: border.normal, borderColor: colors.ink, backgroundColor: colors.tint.leaf.fill },
  choiceText: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.body, color: colors.ink },
});
