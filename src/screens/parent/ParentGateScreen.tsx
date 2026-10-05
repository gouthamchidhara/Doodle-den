// Parent Gate: hold 2 s, then 4-digit PIN; 3 wrong → 60 s cooldown (A5).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/kid/icons/CloseIcon';
import { HoldButton } from '@/components/parent/HoldButton';
import { PinPad } from '@/components/parent/PinPad';
import { getCooldownMs, verifyPin } from '@/services/pinService';
import { useParentStore } from '@/state/parentStore';
import { colors, fonts, fontSize, space, touch } from '@/theme/tokens';

import { forgotPin } from './forgotPin';

// Where to go after unlocking; only parent routes and the profile picker are allowed.
export function safeNext(next: string | string[] | undefined): string {
  const n = Array.isArray(next) ? next[0] : next;
  if (n && (n.startsWith('/parent') || n === '/profiles' || n.startsWith('/locked')) && n !== '/parent/gate') return n;
  return '/parent';
}

// Two-step gate; on success opens the requested parent screen.
export function ParentGateScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const [step, setStep] = useState<'hold' | 'pin'>('hold');
  const [shakeKey, setShakeKey] = useState(0);
  const [cooldownSec, setCooldownSec] = useState(0);
  const unlock = useParentStore((s) => s.unlock);

  useEffect(() => {
    getCooldownMs()
      .then((ms) => setCooldownSec(Math.ceil(ms / 1000)))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (cooldownSec <= 0) return undefined;
    const t = setTimeout(() => setCooldownSec((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldownSec]);

  const onPin = async (pin: string) => {
    const r = await verifyPin(pin);
    if (r.ok) {
      unlock();
      router.replace(safeNext(params.next) as never);
      return;
    }
    setShakeKey((k) => k + 1);
    if (r.reason === 'cooldown') setCooldownSec(Math.ceil(r.retryInMs / 1000));
    if (r.reason === 'no_pin') router.replace('/onboarding/create-pin');
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}>
        <CloseIcon />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title}>For grown-ups</Text>
        {step === 'hold' ? (
          <HoldButton label="Press and hold for 2 seconds" onComplete={() => setStep('pin')} />
        ) : (
          <>
            <Text style={styles.sub}>{cooldownSec > 0 ? `Too many tries. Try again in ${cooldownSec} s.` : 'Enter your PIN'}</Text>
            <PinPad onComplete={(p) => void onPin(p)} shakeKey={shakeKey} disabled={cooldownSec > 0} />
            <Pressable accessibilityRole="button" accessibilityLabel="Forgot PIN?" onPress={() => void forgotPin(Alert.alert)}>
              <Text style={styles.link}>Forgot PIN?</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgParent, padding: space.xl },
  close: { width: touch.parent, height: touch.parent, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
  title: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
  link: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.link, padding: space.md },
});
