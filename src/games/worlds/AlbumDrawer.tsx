// Album drawer: creatures not on screen; tap one to bring it back.
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/kid/IconButton';
import { CloseIcon } from '@/components/kid/icons/CloseIcon';
import { PressableScale } from '@/components/kid/PressableScale';
import { border, colors, fonts, fontSize, overlays, radius, space } from '@/theme/tokens';

import type { Creature } from './types';

// Side drawer listing album creatures.
export function AlbumDrawer({ album, onPick, onClose }: { album: Creature[]; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.scrim]}>
      <View style={styles.drawer}>
        <View style={styles.head}>
          <Text style={styles.title}>Album</Text>
          <IconButton icon={<CloseIcon />} accessibilityLabel="Close album" onPress={onClose} size={52} />
        </View>
        <ScrollView contentContainerStyle={styles.grid}>
          {album.map((c) => (
            <PressableScale key={c.entity.id} accessibilityLabel={`Bring back ${c.entity.name ?? 'creature'}`} onPress={() => onPick(c.entity.id)} style={styles.cell}>
              <Image source={{ uri: c.uri }} style={styles.img} resizeMode="contain" />
              <Text style={styles.name} numberOfLines={1}>
                {c.entity.name ?? ''}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: overlays.scrim, alignItems: 'flex-end' },
  drawer: { width: 320, maxWidth: '90%', height: '100%', backgroundColor: colors.surface, padding: space.lg, gap: space.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cell: { width: 128, alignItems: 'center', borderRadius: radius.button, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.sm },
  img: { width: 100, height: 80 },
  name: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.caption, color: colors.ink },
});
