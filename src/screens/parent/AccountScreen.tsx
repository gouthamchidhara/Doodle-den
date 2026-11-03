// Parent zone → Account (A5): sign in with a magic link / sign out, change PIN, delete all data, privacy + support.
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { SettingRow } from '@/components/parent/SettingRow';
import { PRIVACY_URL, SUPPORT_URL } from '@/content/links';
import { sendMagicLink, signOut, useAuth } from '@/services/auth';
import { deleteAllData } from '@/services/deleteAll';
import { getSupabase } from '@/services/supabase';
import { border, colors, fonts, fontSize, space } from '@/theme/tokens';

// Account screen.
export function AccountScreen() {
  const { email, ready } = useAuth();
  const [input, setInput] = useState('');
  const [sent, setSent] = useState(false);
  const configured = getSupabase() !== null;

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(input.trim())) {
      Alert.alert('Check the email address');
      return;
    }
    setSent(await sendMagicLink(input));
  };

  const confirmDelete = () =>
    Alert.alert('Delete all data?', 'This deletes every drawing, kid profile and setting on this device and, if you have an account, everything we store online. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: () =>
          void deleteAllData().then((ok) => {
            if (ok) router.replace('/onboarding/welcome');
            else Alert.alert('Could not delete the online account', 'Check the internet connection and try again.');
          }),
      },
    ]);

  return (
    <ParentScreen title="Account">
      <ParentCard title="Parent account">
        {!configured ? (
          <Text style={styles.note}>Online features are not set up in this build.</Text>
        ) : !ready ? null : email ? (
          <>
            <Text style={styles.value}>{`Signed in as ${email}`}</Text>
            <ParentButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
          </>
        ) : sent ? (
          <Text style={styles.note}>Check your email and open the link on this device.</Text>
        ) : (
          <>
            <Text style={styles.note}>Optional. Lets you back up art, turn on Magic and share a Family Gallery. We only use your email to sign you in.</Text>
            <TextInput
              accessibilityLabel="Email"
              value={input}
              onChangeText={setInput}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
            />
            <ParentButton label="Send sign-in link" onPress={() => void send()} />
          </>
        )}
      </ParentCard>
      <ParentCard>
        <SettingRow label="Change PIN" value="" onPress={() => router.push('/parent/reset-pin')} />
        <SettingRow label="Privacy policy" value="" onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <SettingRow label="Help & support" value="" onPress={() => void Linking.openURL(SUPPORT_URL)} last />
      </ParentCard>
      <ParentButton label="Delete all data" variant="secondary" onPress={confirmDelete} />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
  value: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.body, color: colors.ink },
  input: { height: 48, borderRadius: 12, borderWidth: border.thin, borderColor: colors.borderNeutral, backgroundColor: colors.surface, paddingHorizontal: space.lg, fontFamily: fonts.body, fontSize: fontSize.body, color: colors.ink },
});
