// Parent zone → change / reset PIN: new PIN twice.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ParentScreen } from '@/components/parent/ParentScreen';
import { PinPad } from '@/components/parent/PinPad';
import { setPin } from '@/services/pinService';
import { colors, fonts, fontSize } from '@/theme/tokens';

// Reset PIN screen.
export function ResetPinScreen() {
  const [first, setFirst] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  const done = async (pin: string) => {
    if (!first) {
      setFirst(pin);
      setMsg(null);
      return;
    }
    if (pin !== first) {
      setFirst(null);
      setMsg("PINs don't match");
      setShake((n) => n + 1);
      return;
    }
    await setPin(pin);
    router.replace('/parent');
  };

  return (
    <ParentScreen title={first ? 'Enter it again' : 'New PIN'} subtitle="4 digits only you know.">
      <PinPad key={first ?? 'first'} onComplete={(p) => void done(p)} shakeKey={shake} />
      {msg ? <Text style={styles.err}>{msg}</Text> : null}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  err: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.label, color: colors.tomato, textAlign: 'center' },
});
