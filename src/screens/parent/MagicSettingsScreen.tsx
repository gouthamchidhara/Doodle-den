// Parent zone → Magic settings (A5, A7 Consent screen): consent on/off, nickname-in-stories toggle, today's uses.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { SettingRow } from '@/components/parent/SettingRow';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { hasAiConsent } from '@/services/ai';
import { giveAiConsent, NICKNAME_KEY, revokeAiConsent } from '@/services/aiConsent';
import { useAuth } from '@/services/auth';
import { getSupabase } from '@/services/supabase';
import { colors, fonts, fontSize } from '@/theme/tokens';

export const CONSENT_POINTS = [
  'Magic makes coloring pages, magic versions of drawings, short stories, playful guesses, drawing ideas and a weekly note for you.',
  'To do that, the drawing (never a photo of your child) or the picked or spoken idea is sent to our server and to an AI provider.',
  'Our providers do not keep these or train on them.',
  'Spoken ideas are turned into text on the device; audio never leaves it.',
  'Each Magic feature has a daily limit.',
  'You can turn Magic off here at any time.',
];

const LABELS: Record<string, string> = { coloring_page: 'Coloring pages', magic_sketch: 'Magic sketches', story: 'Stories', guess: 'Guesses', coach: 'Drawing ideas', digest: 'Weekly note' };

// Magic settings screen.
export function MagicSettingsScreen() {
  const { email } = useAuth();
  const [on, setOn] = useState(false);
  const [nick, setNick] = useState(false);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    hasAiConsent().then(setOn).catch(() => undefined);
    getMeta(NICKNAME_KEY).then((v) => setNick(v === '1')).catch(() => undefined);
    const sb = getSupabase();
    if (!sb || !email) return;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    sb.from('ai_usage')
      .select('feature')
      .eq('status', 'ok')
      .gte('created_at', start.toISOString())
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const r of (data ?? []) as { feature: string }[]) counts[r.feature] = (counts[r.feature] ?? 0) + 1;
        setUsage(counts);
      });
  }, [email]);

  const turnOn = async () => {
    const ok = await giveAiConsent();
    setOn(ok);
    setMsg(ok ? null : 'Could not turn on Magic. Check the internet connection.');
  };

  if (!email) {
    return (
      <ParentScreen title="Magic">
        <Text style={styles.note}>Magic needs a parent account first.</Text>
        <ParentButton label="Sign in" onPress={() => router.push('/parent/account')} />
      </ParentScreen>
    );
  }

  return (
    <ParentScreen title="Magic" subtitle={on ? 'Magic is on.' : 'Please read before turning on Magic.'}>
      {!on ? (
        <ParentCard title="About Magic">
          {CONSENT_POINTS.map((p) => (
            <Text key={p} style={styles.point}>{`• ${p}`}</Text>
          ))}
          <ParentButton label="Turn on Magic" onPress={() => void turnOn()} />
          <ParentButton label="Not now" variant="secondary" onPress={() => router.back()} />
          {msg ? <Text style={styles.err}>{msg}</Text> : null}
        </ParentCard>
      ) : (
        <>
          <ParentCard>
            <SettingRow label="Magic" toggle={{ value: true, onChange: () => void revokeAiConsent().then(() => setOn(false)) }} />
            <SettingRow
              label="Use nickname in stories"
              toggle={{
                value: nick,
                onChange: (v) => {
                  setNick(v);
                  void setMeta(NICKNAME_KEY, v ? '1' : '0');
                },
              }}
              last
            />
          </ParentCard>
          <ParentCard title="Used today">
            {Object.keys(LABELS).map((k, i, all) => (
              <SettingRow key={k} label={LABELS[k]} value={String(usage[k] ?? 0)} last={i === all.length - 1} />
            ))}
          </ParentCard>
        </>
      )}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.inkMuted },
  point: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.ink },
  err: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.tomato },
});
