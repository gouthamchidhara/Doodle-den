// Parent zone → Kids (T-092): list, add (max 4), edit, delete with two confirms, per-kid trash.
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/kid/Avatar';
import { KidForm, type KidFormValue } from '@/components/parent/KidForm';
import { KidTrash } from '@/components/parent/KidTrash';
import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { toAvatarId } from '@/content/avatars';
import { createKid, listKids, MAX_KIDS, updateKid } from '@/db/repositories/kidRepo';
import { removeKid } from '@/games/parent/kidAdmin';
import { FREE_KIDS } from '@/state/features';
import { useSessionStore } from '@/state/sessionStore';
import { usePlan } from '@/state/usePlan';
import { colors, fonts, fontSize, space } from '@/theme/tokens';
import type { KidProfile } from '@/types/models';

type Editing = { id: string | null; value: KidFormValue };

// Kids management screen.
export function KidsScreen() {
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const plan = usePlan();
  const maxKids = plan.family ? MAX_KIDS : FREE_KIDS;
  const load = useCallback(() => {
    listKids().then(setKids).catch((e: unknown) => console.warn('[kids] load failed', e));
  }, []);
  useEffect(load, [load]);

  const save = async () => {
    if (!editing || !editing.value.age || !editing.value.nickname.trim()) return;
    const v = { nickname: editing.value.nickname, avatarId: editing.value.avatar, ageMode: editing.value.age };
    if (editing.id) await updateKid(editing.id, v);
    else await createKid(v);
    setEditing(null);
    load();
  };

  const confirmDelete = (k: KidProfile) =>
    Alert.alert(`Delete ${k.nickname}?`, 'All their drawings, stories and progress will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Are you sure?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete for good',
              style: 'destructive',
              onPress: () =>
                void removeKid(k.id).then(() => {
                  const s = useSessionStore.getState();
                  if (s.activeKidId === k.id) s.setActiveKid(null, s.ageMode);
                  setEditing(null);
                  load();
                }),
            },
          ]),
      },
    ]);

  if (editing) {
    const k = kids.find((x) => x.id === editing.id);
    return (
      <ParentScreen title={k ? `Edit ${k.nickname}` : 'Add a kid'} onBack={() => setEditing(null)}>
        <ParentCard>
          <KidForm value={editing.value} onChange={(value) => setEditing({ ...editing, value })} />
        </ParentCard>
        <ParentButton label="Save" disabled={!editing.value.age || !editing.value.nickname.trim()} onPress={() => void save()} />
        {k ? <KidTrash kidId={k.id} /> : null}
        {k && kids.length > 1 ? <ParentButton label={`Delete ${k.nickname}`} variant="secondary" onPress={() => confirmDelete(k)} /> : null}
      </ParentScreen>
    );
  }

  return (
    <ParentScreen title="Kids">
      <ParentCard>
        {kids.map((k) => (
          <Pressable
            key={k.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${k.nickname}`}
            onPress={() => setEditing({ id: k.id, value: { nickname: k.nickname, avatar: toAvatarId(k.avatarId), age: k.ageMode } })}
            style={styles.row}
          >
            <Avatar id={k.avatarId} size={48} />
            <View style={styles.flex}>
              <Text style={styles.name}>{k.nickname}</Text>
              <Text style={styles.muted}>{k.ageMode === 'little' ? 'Ages 3–5' : 'Ages 6–8'}</Text>
            </View>
          </Pressable>
        ))}
      </ParentCard>
      {kids.length < maxKids ? (
        <ParentButton label="Add a kid" onPress={() => setEditing({ id: null, value: { nickname: '', avatar: 'fox', age: null } })} />
      ) : (
        <Text style={styles.muted}>{plan.family ? `Up to ${MAX_KIDS} kids.` : 'More kids come with the Family plan (Subscription).'}</Text>
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 64 },
  flex: { flex: 1 },
  name: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.body, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
});
