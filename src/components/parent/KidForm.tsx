// Kid profile fields: nickname (max 12), avatar, age band. Used by onboarding and the parent zone.
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components/kid/Avatar";
import { AVATAR_IDS, type AvatarId } from "@/content/avatars";
import { MAX_NICKNAME } from "@/db/repositories/kidRepo";
import { border, colors, fonts, fontSize, radius, space } from "@/theme/tokens";
import type { AgeMode } from "@/types/models";

export interface KidFormValue {
  nickname: string;
  avatar: AvatarId;
  age: AgeMode | null;
}

// Controlled form.
export function KidForm({
  value,
  onChange,
}: {
  value: KidFormValue;
  onChange: (v: KidFormValue) => void;
}) {
  const { nickname, avatar, age } = value;
  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>Nickname</Text>
        <TextInput
          accessibilityLabel="Nickname"
          value={nickname}
          onChangeText={(t) =>
            onChange({ nickname: t.slice(0, MAX_NICKNAME), avatar, age })
          }
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
              onPress={() => onChange({ nickname, avatar: id, age })}
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
              ["little", "3–5"],
              ["big", "6–8"],
            ] as const
          ).map(([mode, label]) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected: age === mode }}
              accessibilityLabel={`Age ${label}`}
              onPress={() => onChange({ nickname, avatar, age: mode })}
              style={[styles.choice, age === mode && styles.choiceOn]}
            >
              <Text style={styles.choiceText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.sm },
  label: {
    fontFamily: fonts.bodyHeavy,
    fontSize: fontSize.label,
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.inkMuted,
  },
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
  avatars: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  avatar: {
    borderRadius: radius.round,
    borderWidth: border.normal,
    borderColor: "transparent",
    padding: 2,
  },
  avatarOn: { borderColor: colors.ink },
  row: { flexDirection: "row", gap: space.md },
  choice: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: border.thin,
    borderColor: colors.borderNeutral,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceOn: {
    borderWidth: border.normal,
    borderColor: colors.ink,
    backgroundColor: colors.tint.leaf.fill,
  },
  choiceText: {
    fontFamily: fonts.bodyHeavy,
    fontSize: fontSize.body,
    color: colors.ink,
  },
});
