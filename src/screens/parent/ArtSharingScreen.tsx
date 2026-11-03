// Parent zone → Art & sharing (T-093/T-094/T-095): backup consent, Family Gallery link + share toggles, printing.
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { SettingRow } from '@/components/parent/SettingRow';
import { listArtworks, type ArtworkRecord } from '@/db/repositories/artworkRepo';
import { listStories } from '@/db/repositories/storyRepo';
import { useAuth } from '@/services/auth';
import { activeShareToken, createShareLink, galleryUrl, revokeShareLinks, shareArtwork } from '@/services/familyGallery';
import { printStickerSheet, printStoryBook } from '@/services/print';
import { hasSyncConsent, pendingCount, runSync, setSyncConsent } from '@/services/sync';
import { useSessionStore } from '@/state/sessionStore';
import { usePlan } from '@/state/usePlan';
import { colors, fonts, fontSize } from '@/theme/tokens';
import type { Story } from '@/types/feature';

// Art & sharing screen.
export function ArtSharingScreen() {
  const kidId = useSessionStore((s) => s.activeKidId);
  const { email } = useAuth();
  const plan = usePlan();
  const [backup, setBackup] = useState(false);
  const [pending, setPending] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [arts, setArts] = useState<ArtworkRecord[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  const load = useCallback(() => {
    hasSyncConsent().then(setBackup).catch(() => undefined);
    pendingCount().then(setPending).catch(() => undefined);
    if (email) activeShareToken().then(setToken).catch(() => undefined);
    if (kidId) {
      listArtworks(kidId, { excludeActivities: ['flipbook_frame'] }).then((a) => setArts(a.slice(0, 24))).catch(() => undefined);
      listStories(kidId).then(setStories).catch(() => undefined);
    }
  }, [email, kidId]);
  useEffect(load, [load]);

  if (!plan.family) {
    return (
      <ParentScreen title="Art & sharing">
        <ParentCard>
          <Text style={styles.text}>Backup, the Family Gallery and printing come with the Family plan.</Text>
          <ParentButton label="See plans" onPress={() => router.push('/parent/subscription')} />
        </ParentCard>
      </ParentScreen>
    );
  }

  const toggleBackup = async (on: boolean) => {
    if (on && !email) {
      Alert.alert('Parent account needed', 'Sign in under Account to back up art.');
      return;
    }
    await setSyncConsent(on);
    setBackup(on);
    if (on) await runSync();
    load();
  };
  const toggleShare = async (a: ArtworkRecord) => {
    await shareArtwork(a.id, !a.familyShared);
    load();
  };
  const fail = () => Alert.alert('Nothing to print', 'There was nothing to print, or sharing is not available here.');

  return (
    <ParentScreen title="Art & sharing">
      <ParentCard title="Backup">
        <Text style={styles.text}>Copies drawings (pictures only) and settings to your parent account. Strokes, photos and voice clips stay on this device.</Text>
        <SettingRow label="Back up art" toggle={{ value: backup, onChange: (v) => void toggleBackup(v) }} last={!backup} />
        {backup ? <SettingRow label="Waiting to upload" value={`${pending}`} onPress={() => void runSync().then(load)} last /> : null}
      </ParentCard>
      <ParentCard title="Family Gallery">
        {!email ? <Text style={styles.text}>Sign in under Account to make a private link for family.</Text> : null}
        {email && !token ? <ParentButton label="Create private link" onPress={() => void createShareLink().then(setToken)} /> : null}
        {token ? (
          <>
            <Text style={styles.text} selectable>
              {galleryUrl(token)}
            </Text>
            <ParentButton label="Share link" onPress={() => void Share.share({ message: galleryUrl(token) })} />
            <ParentButton label="Turn off link" variant="secondary" onPress={() => void revokeShareLinks().then(() => setToken(null))} />
          </>
        ) : null}
        {email
          ? arts.map((a, i) => (
              <SettingRow
                key={a.id}
                label={a.title ?? `Drawing ${new Date(a.createdAt).toLocaleDateString()}`}
                toggle={{ value: a.familyShared, onChange: () => void toggleShare(a) }}
                last={i === arts.length - 1}
              />
            ))
          : null}
      </ParentCard>
      <ParentCard title="Print">
        <ParentButton label="Print sticker sheet" variant="secondary" onPress={() => kidId && void printStickerSheet(kidId).then((ok) => ok || fail())} />
        {stories.map((s, i) => (
          <SettingRow key={s.id} label={`Print "${s.title}"`} value="" onPress={() => void printStoryBook(s).then((ok) => ok || fail())} last={i === stories.length - 1} />
        ))}
      </ParentCard>
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
});
