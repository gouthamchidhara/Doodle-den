// Profile picker: big avatar buttons; tap sets the active kid (A5).
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/kid/Avatar';
import { PadlockIcon } from '@/components/kid/icons/PadlockIcon';
import { PressableScale } from '@/components/kid/PressableScale';
import { listKids } from '@/db/repositories/kidRepo';
import { setMeta } from '@/db/repositories/metaRepo';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import type { KidProfile } from '@/types/models';

// Lists kid profiles; a small "Grown-ups" button opens the Parent Gate.
export function ProfilePickerScreen() {
  const { isTablet } = useLayout();
  const [kids, setKids] = useState<KidProfile[]>([]);
  const setActiveKid = useSessionStore((s) => s.setActiveKid);
  const size = isTablet ? 160 : 120;

  useEffect(() => {
    listKids()
      .then(setKids)
      .catch((e: unknown) => console.warn('[profiles] load failed', e));
  }, []);

  const pick = async (kid: KidProfile) => {
    try {
      await setMeta('active_kid_id', kid.id);
      setActiveKid(kid.id, kid.ageMode);
      router.replace('/');
    } catch (e) {
      console.warn('[profiles] pick failed', e);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.grid}>
        {kids.map((k) => (
          <PressableScale key={k.id} accessibilityLabel={k.nickname} onPress={() => void pick(k)} style={styles.kid}>
            <View style={[styles.ring, { width: size + 16, height: size + 16 }]}>
              <Avatar id={k.avatarId} size={size} />
            </View>
            <Text style={styles.name}>{k.nickname}</Text>
          </PressableScale>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <PressableScale accessibilityLabel="Grown-ups" onPress={() => router.push({ pathname: '/parent/gate', params: { next: '/parent' } })} style={styles.grownups}>
          <PadlockIcon size={20} color={colors.inkMuted} />
          <Text style={styles.grownupsText}>Grown-ups</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  grid: { flexGrow: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: space.xxxl, padding: space.xxl },
  kid: { alignItems: 'center', gap: space.md },
  ring: { borderRadius: radius.round, borderWidth: border.thick, borderColor: colors.borderSoft, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', padding: space.xl },
  grownups: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 56,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: border.normal,
    borderColor: colors.borderNeutral,
    backgroundColor: colors.surface,
  },
  grownupsText: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.inkMuted },
});
