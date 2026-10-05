// Dev-only readout of the lock-native values (T-031 check: uptime increases, boot id stable).
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSize } from '@/theme/tokens';

import { getBootId, getUptimeMs, hasNativeLock, isPinned } from '../../modules/lock-native';

// Text block refreshed every second.
export function LockNativeDebug() {
  const [line, setLine] = useState('');
  useEffect(() => {
    const read = () => setLine(`native=${hasNativeLock()} uptimeMs=${Math.round(getUptimeMs())} bootId=${getBootId()} pinned=${isPinned()}`);
    read();
    const t = setInterval(read, 1000);
    return () => clearInterval(t);
  }, []);
  return <Text style={styles.text}>{line}</Text>;
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.ink },
});
