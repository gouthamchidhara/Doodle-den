// One kid's trash in the parent zone: thumbnails with Restore, and Empty trash (two confirms).
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { listArtworks, restoreArtwork, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { emptyKidTrash } from '@/games/parent/kidAdmin';
import { fileUri } from '@/services/files';
import { colors, fonts, fontSize, space } from '@/theme/tokens';

// Trash card.
export function KidTrash({ kidId }: { kidId: string }) {
  const [items, setItems] = useState<ArtworkRecord[]>([]);
  const load = useCallback(() => {
    listArtworks(kidId, { onlyTrashed: true }).then(setItems).catch((e: unknown) => console.warn('[kids] trash load failed', e));
  }, [kidId]);
  useEffect(load, [load]);

  const empty = () =>
    Alert.alert('Empty trash?', `${items.length} drawing${items.length === 1 ? '' : 's'} will be deleted for good.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void emptyKidTrash(kidId).then(load) },
    ]);

  return (
    <ParentCard title="Trash">
      {items.length === 0 ? <Text style={styles.muted}>Trash is empty.</Text> : null}
      <View style={styles.grid}>
        {items.map((a) => (
          <Pressable key={a.id} accessibilityRole="button" accessibilityLabel="Restore drawing" onPress={() => void restoreArtwork(a.id).then(load)} style={styles.item}>
            <Image source={{ uri: fileUri(a.thumbPath) }} style={styles.thumb} resizeMode="cover" />
            <Text style={styles.muted}>Restore</Text>
          </Pressable>
        ))}
      </View>
      {items.length > 0 ? <ParentButton label="Empty trash" variant="secondary" onPress={empty} /> : null}
    </ParentCard>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  item: { alignItems: 'center', gap: space.xs, minWidth: 88, minHeight: 48 },
  thumb: { width: 88, height: 88, borderRadius: 14, backgroundColor: colors.bgKid },
  muted: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
});
