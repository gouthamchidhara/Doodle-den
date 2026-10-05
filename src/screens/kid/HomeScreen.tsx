// Kid Home (A5, mockup "Kid Home · iPad"): greeting, time pill, shelves, tiles, mascot with today's idea.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityTile } from '@/components/kid/ActivityTile';
import { Avatar } from '@/components/kid/Avatar';
import { CloudIcon } from '@/components/kid/icons/CloudIcon';
import { PadlockIcon } from '@/components/kid/icons/PadlockIcon';
import { Mascot } from '@/components/kid/Mascot';
import { PressableScale } from '@/components/kid/PressableScale';
import { ShelfTabs } from '@/components/kid/ShelfTabs';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { TimePill } from '@/components/kid/TimePill';
import { routeForActivity, toShelfKey, visibleTiles, type ShelfKey, type TileDef } from '@/content/activities';
import { pickDailyIdea } from '@/content/dailyIdea';
import { listKids } from '@/db/repositories/kidRepo';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { isArSupported } from '@/games/arwall/arSupport';
import { useRemainingMinutes } from '@/lock/useRemainingMinutes';
import { useAiStatus } from '@/services/useAiStatus';
import { useActiveKid } from '@/state/useActiveKid';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';
import { localDayKey } from '@/utils/time';

// Opens the Parent Gate, then the given parent route.
const gate = (next: string) => router.push({ pathname: '/parent/gate', params: { next } });

// Kid Home screen.
export function HomeScreen() {
  const { isTablet, width, ageMode } = useLayout();
  const kid = useActiveKid();
  const minutes = useRemainingMinutes();
  const ai = useAiStatus();
  const [shelf, setShelf] = useState<ShelfKey>('draw');
  const [kidCount, setKidCount] = useState(1);
  const [idea] = useState(() => pickDailyIdea(localDayKey(Date.now())));

  useEffect(() => {
    if (!kid) return;
    getMeta(`shelf_${kid.id}`)
      .then((v) => setShelf(toShelfKey(v)))
      .catch(() => undefined);
    listKids()
      .then((k) => setKidCount(k.length))
      .catch(() => undefined);
  }, [kid]);

  const chooseShelf = (s: ShelfKey) => {
    setShelf(s);
    if (kid) setMeta(`shelf_${kid.id}`, s).catch((e: unknown) => console.warn('[home] save shelf failed', e));
  };

  const cols = isTablet ? 4 : 2;
  const pad = isTablet ? space.xxxl : space.lg;
  const gap = isTablet ? space.xl : space.md;
  const tileW = (width - pad * 2 - gap * (cols - 1)) / cols;
  const tiles = visibleTiles(shelf, ageMode, { arSupported: isArSupported() });

  const openTile = (t: TileDef) => {
    if (t.magic && !ai.online) return;
    router.push(t.route as never);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingHorizontal: pad }]}>
        <PressableScale
          accessibilityLabel="Switch player"
          onPress={() => (kidCount > 1 ? gate('/profiles') : undefined)}
          style={styles.who}
        >
          <View style={styles.avatar}>{kid ? <Avatar id={kid.avatarId} size={56} /> : null}</View>
          <View>
            <Text style={styles.hi}>{kid ? `Hi, ${kid.nickname}!` : 'Hi!'}</Text>
            {isTablet ? <Text style={styles.sub}>What do you want to make?</Text> : null}
          </View>
        </PressableScale>
        <View style={styles.right}>
          {minutes !== null && isTablet ? <TimePill minutesLeft={minutes} /> : null}
          <PressableScale accessibilityLabel="Grown-ups" onPress={() => gate('/parent')} style={styles.grownups}>
            <PadlockIcon color={colors.inkMuted} />
            {isTablet ? <Text style={styles.grownupsText}>Grown-ups</Text> : null}
          </PressableScale>
        </View>
      </View>
      {minutes !== null && !isTablet ? (
        <View style={[styles.pillRow, { paddingHorizontal: pad }]}>
          <TimePill minutesLeft={minutes} />
        </View>
      ) : null}
      <View style={{ paddingHorizontal: pad, paddingVertical: space.md }}>
        <ShelfTabs selected={shelf} onSelect={chooseShelf} />
      </View>
      <ScrollView contentContainerStyle={[styles.grid, { paddingHorizontal: pad, gap }]}>
        {tiles.map((t) => {
          const locked = !!t.magic && !ai.consented;
          const dimmed = !!t.magic && !ai.online;
          return (
            <View key={t.key} style={{ width: tileW }}>
              <ActivityTile
                title={t.title}
                tint={t.tint}
                icon={
                  <View>
                    <t.Art size={isTablet ? 120 : 90} />
                    {dimmed ? (
                      <View style={styles.cloud}>
                        <CloudIcon size={28} />
                      </View>
                    ) : null}
                  </View>
                }
                badge={t.key === 'aquarium' ? 'NEW' : undefined}
                locked={locked}
                dimmed={dimmed}
                onPress={() => openTile(t)}
                onLockedPress={() => gate('/parent/magic')}
              />
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.bottom, { paddingHorizontal: pad }]}>
        <Mascot mood="idle" size={isTablet ? 110 : 80} />
        <PressableScale accessibilityLabel={idea.text} onPress={() => router.push(routeForActivity(idea.activity) as never)} sound="bubble" style={styles.bubbleWrap}>
          <SpeechBubble text={isTablet ? `Today's idea: ${idea.text}` : idea.text} voiceClip={idea.voice} />
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.lg, gap: space.md },
  who: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 64, height: 64, borderRadius: radius.round, backgroundColor: colors.tint.sun.fill, borderWidth: border.thick, borderColor: colors.sun, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hi: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: fontSize.label + 1, color: colors.inkMuted },
  right: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pillRow: { flexDirection: 'row', paddingTop: space.sm },
  grownups: {
    height: 56,
    minWidth: 56,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: border.normal,
    borderColor: colors.borderNeutral,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  grownupsText: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.inkMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: space.lg },
  cloud: { position: 'absolute', right: -6, top: -6 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: space.lg, paddingBottom: space.lg },
  bubbleWrap: { flexShrink: 1, marginBottom: space.xxl },
});
