// AI weekly note on the dashboard (A7 Feature 6, T-098): once per ISO week, cached; one refresh per week; hidden when Magic is off.
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { getDigest } from '@/services/ai';
import { colors, fonts, fontSize } from '@/theme/tokens';
import { isoWeekKey } from '@/utils/time';

// Cache keys for a week.
export const digestKey = (week: string) => `digest_${week}`;
export const digestRefreshedKey = (week: string) => `digest_refreshed_${week}`;

// The card; `facts` are numbers only.
export function DigestCard({ facts, enabled }: { facts: Record<string, unknown> | null; enabled: boolean }) {
  const [text, setText] = useState<string | null>(null);
  const [canRefresh, setCanRefresh] = useState(false);
  useEffect(() => {
    if (!enabled || !facts) return;
    const week = isoWeekKey(Date.now());
    (async () => {
      const cached = await getMeta(digestKey(week));
      setCanRefresh((await getMeta(digestRefreshedKey(week))) !== '1');
      if (cached) {
        setText(cached);
        return;
      }
      const r = await getDigest({ week: facts });
      if (r.ok) {
        await setMeta(digestKey(week), r.data.text);
        setText(r.data.text);
      }
    })().catch(() => undefined);
  }, [enabled, facts]);

  const refresh = async () => {
    if (!facts) return;
    const week = isoWeekKey(Date.now());
    setCanRefresh(false);
    await setMeta(digestRefreshedKey(week), '1');
    const r = await getDigest({ week: facts });
    if (r.ok) {
      await setMeta(digestKey(week), r.data.text);
      setText(r.data.text);
    }
  };

  if (!enabled || !text) return null;
  return (
    <ParentCard title="This week">
      <Text style={styles.text}>{text}</Text>
      {canRefresh ? <ParentButton label="Refresh" variant="secondary" onPress={() => void refresh()} /> : null}
    </ParentCard>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.ink, lineHeight: 26 },
});
