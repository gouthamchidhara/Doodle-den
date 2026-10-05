// Sticker Book (A5): pages of 12 slots (earned in color, others as gray silhouettes) + a Decorate page.
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChipTabs } from '@/components/kid/ChipTabs';
import { IconButton } from '@/components/kid/IconButton';
import { ArrowLeftIcon } from '@/components/kid/icons/ArrowLeftIcon';
import { ArrowRightIcon } from '@/components/kid/icons/ArrowRightIcon';
import { KidHeader } from '@/components/kid/KidHeader';
import { StickerView } from '@/components/kid/StickerView';
import { getReward, REWARDS } from '@/content/rewards';
import { listRewards } from '@/db/repositories/rewardRepo';
import { useSessionStore } from '@/state/sessionStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import { useLayout } from '@/theme/useLayout';

import { useIntroVoice } from './shared/useIntroVoice';
import { DecoratePage } from './stickers/DecoratePage';

export const SLOTS_PER_PAGE = 12;

// All slot ids in book order: catalog stickers, then earned daily stickers.
export function bookSlots(earned: string[]): string[] {
  return [...REWARDS.map((r) => r.id), ...earned.filter((id) => id.startsWith('day_')).sort()];
}

// Sticker Book screen.
export function StickerBookScreen() {
  const { isTablet, width } = useLayout();
  const kidId = useSessionStore((s) => s.activeKidId);
  useIntroVoice('intro_stickers');
  const [tab, setTab] = useState<'book' | 'decorate'>('book');
  const [earned, setEarned] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!kidId) return;
    listRewards(kidId)
      .then((r) => setEarned(r.map((x) => x.rewardId)))
      .catch((e: unknown) => console.warn('[stickers] load failed', e));
  }, [kidId]);

  const slots = bookSlots(earned);
  const pages = Math.max(1, Math.ceil(slots.length / SLOTS_PER_PAGE));
  const shown = slots.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE);
  const have = new Set(earned);
  const cols = isTablet ? 6 : 3;
  const cell = Math.min(140, (width - space.xl * 2 - space.md * (cols - 1)) / cols);

  return (
    <SafeAreaView style={[styles.screen, { padding: isTablet ? space.xl : space.lg }]}>
      <KidHeader />
      <View style={styles.tabs}>
        <ChipTabs
          tabs={[
            { key: 'book', label: 'My stickers' },
            { key: 'decorate', label: 'Decorate' },
          ]}
          selected={tab}
          onSelect={setTab}
        />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {tab === 'book' ? (
          <>
            <View style={[styles.page, { gap: space.md }]}>
              {shown.map((id) => (
                <View key={id} style={[styles.slot, { width: cell }]} accessibilityLabel={have.has(id) ? (getReward(id)?.title ?? 'Sticker') : 'Sticker to find'}>
                  <StickerView id={id} size={cell - space.md} earned={have.has(id)} />
                  {have.has(id) ? <Text style={styles.title} numberOfLines={1}>{getReward(id)?.title}</Text> : null}
                </View>
              ))}
            </View>
            <View style={styles.nav}>
              <IconButton icon={<ArrowLeftIcon />} accessibilityLabel="Previous page" onPress={() => setPage((p) => Math.max(0, p - 1))} />
              <Text style={styles.pageNum}>{`${page + 1} / ${pages}`}</Text>
              <IconButton icon={<ArrowRightIcon />} accessibilityLabel="Next page" onPress={() => setPage((p) => Math.min(pages - 1, p + 1))} />
            </View>
          </>
        ) : (
          <DecoratePage kidId={kidId} earned={earned} width={Math.min(width - space.xl * 2, 900)} onSaved={() => setTab('book')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid },
  tabs: { paddingVertical: space.lg },
  body: { alignItems: 'center', gap: space.lg, paddingBottom: space.xl },
  page: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: radius.panel, borderWidth: border.normal, borderColor: colors.borderSoft, padding: space.lg },
  slot: { alignItems: 'center', gap: space.xs },
  title: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.caption, color: colors.ink },
  nav: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  pageNum: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
});
