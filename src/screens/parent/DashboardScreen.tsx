// Parent zone dashboard (A5, mockup "Parent zone · phone"): kid switcher, digest, today ring, week bars, rules, new art, skills.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ParentCard } from '@/components/parent/ParentCard';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { SettingRow } from '@/components/parent/SettingRow';
import { StatRing } from '@/components/parent/StatRing';
import { WeekBars } from '@/components/parent/WeekBars';
import { listKids } from '@/db/repositories/kidRepo';
import { saveRules } from '@/db/repositories/rulesRepo';
import { bedtimeText, digestFacts, loadDashboard, skillsLine, weekBars, type Dashboard } from '@/games/parent/dashboard';
import { lockController } from '@/lock/lockRuntime';
import { fileUri } from '@/services/files';
import { useAiStatus } from '@/services/useAiStatus';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import type { KidProfile } from '@/types/models';
import { localDayKey } from '@/utils/time';

import { DigestCard } from './DigestCard';

const MENU: { label: string; route: string }[] = [
  { label: 'Kids', route: '/parent/profiles' },
  { label: 'Device lock', route: '/parent/device-lock' },
  { label: 'Magic', route: '/parent/magic' },
  { label: 'Art & sharing', route: '/parent/art-sharing' },
  { label: 'Subscription', route: '/parent/subscription' },
  { label: 'Account', route: '/parent/account' },
];

// Dashboard screen.
export function DashboardScreen() {
  const activeKid = useSessionStore((s) => s.activeKidId);
  const ai = useAiStatus();
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [kidId, setKidId] = useState<string | null>(activeKid);
  const [d, setD] = useState<Dashboard | null>(null);
  const [today, setToday] = useState('');

  useFocusEffect(
    useCallback(() => {
      listKids()
        .then(async (k) => {
          setKids(k);
          const id = kidId ?? k[0]?.id ?? null;
          if (!kidId) setKidId(id);
          setToday(localDayKey(Date.now()));
          if (id) setD(await loadDashboard(id));
        })
        .catch((e: unknown) => console.warn('[dashboard] load failed', e));
    }, [kidId]),
  );

  const facts = useMemo(() => (d ? digestFacts(d) : null), [d]);
  const kid = kids.find((k) => k.id === kidId);
  const toggleFinish = async (on: boolean) => {
    if (!d || !kidId) return;
    const rules = await saveRules({ ...d.rules, maxExtensionsPerSession: on ? 1 : 0 });
    await lockController.rulesChanged(kidId);
    setD({ ...d, rules });
  };

  return (
    <ParentScreen title={kid ? `${kid.nickname}'s week` : 'Parent zone'} onBack={() => router.replace('/home')}>
      {kids.length > 1 ? (
        <View style={styles.kids}>
          {kids.map((k) => (
            <Pressable key={k.id} accessibilityRole="button" accessibilityLabel={`Show ${k.nickname}`} onPress={() => setKidId(k.id)} style={[styles.chip, k.id === kidId && styles.chipOn]}>
              <Text style={styles.chipText}>{k.nickname}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <DigestCard facts={facts} enabled={ai.consented} />
      {d ? (
        <>
          <ParentCard>
            <View style={styles.today}>
              <StatRing used={Math.round(d.today.usedSec / 60)} limit={d.rules.dailyLimitMin} />
              <View>
                <Text style={styles.h}>Today</Text>
                <Text style={styles.big}>{`${Math.round(d.today.usedSec / 60)} of ${d.rules.dailyLimitMin} min`}</Text>
                <Text style={styles.muted}>{`${d.today.sessions} session${d.today.sessions === 1 ? '' : 's'} · ${d.today.extensionsUsed} extension${d.today.extensionsUsed === 1 ? '' : 's'} used`}</Text>
              </View>
            </View>
          </ParentCard>
          <ParentCard title="Play time this week">
            <WeekBars days={weekBars(d.week, today)} />
          </ParentCard>
          <ParentCard>
            <SettingRow label="Daily limit" value={`${d.rules.dailyLimitMin} min`} onPress={() => router.push({ pathname: '/parent/time-rules', params: { kidId: kidId ?? '' } })} />
            <SettingRow label="Per session" value={`${d.rules.sessionLimitMin} min`} onPress={() => router.push({ pathname: '/parent/time-rules', params: { kidId: kidId ?? '' } })} />
            <SettingRow label="Bedtime lock" value={bedtimeText(d.rules)} onPress={() => router.push({ pathname: '/parent/time-rules', params: { kidId: kidId ?? '' } })} />
            <SettingRow label={'"Finish my drawing" extra 2 min'} toggle={{ value: d.rules.maxExtensionsPerSession > 0, onChange: (v) => void toggleFinish(v) }} last />
          </ParentCard>
          <ParentCard title="New art this week">
            <View style={styles.thumbs}>
              {d.newArt.map((a) => (
                <Image key={a.id} source={{ uri: fileUri(a.thumbPath) }} style={styles.thumb} resizeMode="cover" />
              ))}
            </View>
            <Text style={styles.muted}>{`${d.newArtCount} new this week`}</Text>
            <Text style={styles.muted}>{skillsLine(d.letters, d.colors)}</Text>
          </ParentCard>
        </>
      ) : null}
      <ParentCard>
        {MENU.map((m, i) => (
          <SettingRow key={m.route} label={m.label} value="" onPress={() => router.push(m.route as never)} last={i === MENU.length - 1} />
        ))}
      </ParentCard>
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  kids: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: space.lg, height: 44, borderRadius: radius.pill, borderWidth: border.thin, borderColor: colors.borderParent, justifyContent: 'center', backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.tint.sky.fill, borderColor: colors.sky },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.ink },
  today: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  h: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.inkMuted },
  big: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.title, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
  thumbs: { flexDirection: 'row', gap: space.sm },
  thumb: { width: 88, height: 88, borderRadius: 14, backgroundColor: colors.bgKid },
});
