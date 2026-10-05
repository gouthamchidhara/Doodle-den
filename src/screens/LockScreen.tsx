// Lock screen (A5, mockup "Lock screen · iPad"): night sky, sleeping crayons, ideas, parent hold-to-unlock.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckIcon } from '@/components/kid/icons/CheckIcon';
import { PadlockIcon } from '@/components/kid/icons/PadlockIcon';
import { Mascot } from '@/components/kid/Mascot';
import { NightSky } from '@/components/kid/NightSky';
import { OffScreenIdeaCard } from '@/components/kid/OffScreenIdeaCard';
import { PressableScale } from '@/components/kid/PressableScale';
import { pickOffScreenIdeas } from '@/content/offScreenIdeas';
import type { ParentUnlockOption } from '@/lock/lockEngine';
import { lockController } from '@/lock/lockRuntime';
import { useLockStore } from '@/lock/lockStore';
import { loopSound } from '@/services/audio';
import { say } from '@/services/voice';
import { useCanvasStore } from '@/state/canvasStore';
import { isParentUnlocked } from '@/state/parentStore';
import { useActiveKid } from '@/state/useActiveKid';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { backText, lockHeadline, lockVoice } from './lock/lockText';
import { UnlockSheet } from './lock/UnlockSheet';

export const LULLABY_MS = 60_000;
const SAVED_CHIP_MS = 60_000;
const HOLD_MS = 1000;

// The screen a locked kid sees.
export function LockScreen() {
  const { isTablet, width } = useLayout();
  const params = useLocalSearchParams<{ unlock?: string }>();
  const kid = useActiveKid();
  const state = useLockStore((s) => s.state);
  const rules = useLockStore((s) => s.rules);
  const lastSave = useCanvasStore((s) => s.lastAutosaveAt);
  const [now, setNow] = useState(() => Date.now());
  const [sheet, setSheet] = useState(() => params.unlock === '1' && isParentUnlocked());
  const [ideas] = useState(() => pickOffScreenIdeas(Math.floor(Date.now() / 3_600_000)));
  const reason = state?.lock.reason ?? 'daily';

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    const stop = loopSound('lullaby-loop', 0.3);
    const quiet = setTimeout(stop, LULLABY_MS);
    const clock = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      sub.remove();
      stop();
      clearTimeout(quiet);
      clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    say(lockVoice(reason));
  }, [reason]);

  const pick = async (option: ParentUnlockOption) => {
    setSheet(false);
    await lockController.parentUnlock(option);
    if (option === 'plus15' || option === 'plus30') router.replace('/home');
  };

  const saved = lastSave !== null && now - lastSave < SAVED_CHIP_MS;
  const cardW = isTablet ? 250 : Math.min(320, width - space.xl * 2);

  return (
    <View style={styles.screen}>
      <NightSky />
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Mascot mood="sleeping" size={isTablet ? 120 : 90} />
          <Text style={[styles.h1, !isTablet && styles.h1Phone]} accessibilityRole="header">
            {lockHeadline(reason)}
          </Text>
          <Text style={styles.sub}>{`Great art today${kid ? `, ${kid.nickname}` : ''}! Time for some real-world play.`}</Text>
          {saved ? (
            <View style={styles.chip}>
              <CheckIcon color={colors.leaf} />
              <Text style={styles.chipText}>Your drawing is saved in My Gallery</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.ideas, !isTablet && styles.ideasPhone]}>
          {ideas.map((i) => (
            <OffScreenIdeaCard key={i.id} idea={i} width={cardW} />
          ))}
        </View>
        <View style={[styles.bottom, !isTablet && styles.bottomPhone]}>
          <Text style={styles.back}>{state ? backText(state, rules, now) : ''}</Text>
          <PressableScale
            accessibilityLabel="Grown-ups: hold to unlock"
            delayLongPress={HOLD_MS}
            onLongPress={() => router.push({ pathname: '/parent/gate', params: { next: '/locked?unlock=1' } })}
            style={styles.unlock}
          >
            <PadlockIcon color={colors.nightText} size={20} />
            <Text style={styles.unlockText}>Grown-ups: hold to unlock</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
      {sheet ? <UnlockSheet onPick={(o) => void pick(o)} onClose={() => setSheet(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  safe: { flex: 1, padding: space.xl },
  top: { alignItems: 'center', gap: space.sm, marginTop: space.xl },
  h1: { fontFamily: fonts.display, fontSize: fontSize.kidHero, color: colors.white, textAlign: 'center' },
  h1Phone: { fontSize: fontSize.title + 6 },
  sub: { fontFamily: fonts.body, fontSize: fontSize.bubble, color: colors.nightText, textAlign: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.nightRaised, borderRadius: radius.button, paddingVertical: space.sm, paddingHorizontal: space.lg, marginTop: space.sm },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label + 2, color: colors.white },
  ideas: { flexDirection: 'row', justifyContent: 'center', gap: space.xl, marginTop: space.xxxl },
  ideasPhone: { flexDirection: 'column', alignItems: 'center', gap: space.md, marginTop: space.xl },
  bottom: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  bottomPhone: { flexDirection: 'column' },
  back: { fontFamily: fonts.body, fontSize: fontSize.body - 2, color: colors.nightMuted },
  unlock: { flexDirection: 'row', alignItems: 'center', gap: space.sm, height: 52, paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: border.thin + 1, borderColor: colors.nightBorder },
  unlockText: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.nightText },
});
