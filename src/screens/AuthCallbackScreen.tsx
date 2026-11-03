// Magic-link landing (doodleden://auth): finishes sign-in, then opens the account screen or the PIN reset.
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeSignIn } from '@/services/auth';
import { useParentStore } from '@/state/parentStore';
import { colors, fonts, fontSize, space } from '@/theme/tokens';

// Reads code / tokens from the query or the #fragment.
export function authParams(url: string): { code?: string; access_token?: string; refresh_token?: string; reset?: string } {
  const out: Record<string, string> = {};
  const [base, hash = ''] = url.split('#');
  const query = base.split('?')[1] ?? '';
  for (const part of [...query.split('&'), ...hash.split('&')]) {
    const [k, v] = part.split('=');
    if (k && v !== undefined) out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}

// Callback screen.
export function AuthCallbackScreen() {
  const url = Linking.useLinkingURL();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!url) return;
    const p = authParams(url);
    completeSignIn(p)
      .then((ok) => {
        if (!ok) {
          setFailed(true);
          return;
        }
        if (p.reset === 'pin') {
          useParentStore.getState().unlock();
          router.replace('/parent/reset-pin');
        } else router.replace('/parent/account');
      })
      .catch(() => setFailed(true));
  }, [url]);
  return (
    <SafeAreaView style={styles.screen}>
      {failed ? <Text style={styles.text}>This sign-in link did not work. Please ask for a new one.</Text> : <ActivityIndicator color={colors.ink} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgParent, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  text: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.ink, textAlign: 'center' },
});
