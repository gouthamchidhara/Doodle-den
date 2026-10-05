// Parent zone → Extra iOS lock (A4 Screen Time setup): explain, authorize, pick Doodle Den, start monitoring.
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { SettingRow } from '@/components/parent/SettingRow';
import { getRules } from '@/db/repositories/rulesRepo';
import { lockController } from '@/lock/lockRuntime';
import {
  disableScreenTime,
  enableScreenTime,
  isScreenTimeEnabled,
  isScreenTimeOn,
  requestScreenTimeAuth,
} from '@/lock/screenTime';
import { ScreenTimePicker } from '@/lock/ScreenTimePicker';
import { useSessionStore } from '@/state/sessionStore';
import { colors, fonts, fontSize } from '@/theme/tokens';

type Step = 'intro' | 'picking' | 'done' | 'denied';

// Setup and on/off switch for the Screen Time shield.
export function ScreenTimeScreen() {
  const kidId = useSessionStore((s) => s.activeKidId);
  const [on, setOn] = useState(false);
  const [step, setStep] = useState<Step>('intro');

  useEffect(() => {
    isScreenTimeOn()
      .then(setOn)
      .catch(() => undefined);
  }, []);

  const start = async () => {
    setStep((await requestScreenTimeAuth()) ? 'picking' : 'denied');
  };

  const picked = async () => {
    if (!kidId) return;
    const rules = await getRules(kidId);
    const ok = await enableScreenTime(rules, lockController.current()?.extraTodaySec ?? 0);
    setOn(ok);
    setStep(ok ? 'done' : 'intro');
  };

  const turnOff = async () => {
    await disableScreenTime();
    setOn(false);
    setStep('intro');
  };

  if (!isScreenTimeEnabled()) {
    return (
      <ParentScreen title="Extra iOS lock">
        <Text style={styles.note}>Not available in this version.</Text>
      </ParentScreen>
    );
  }

  return (
    <ParentScreen title="Extra iOS lock" subtitle="iPhone/iPad will also block Doodle Den when time is up.">
      <ParentCard>
        {on ? (
          <>
            <Text style={styles.on}>Extra iOS lock is on.</Text>
            <SettingRow label="Extra iOS lock" toggle={{ value: true, onChange: () => void turnOff() }} last />
          </>
        ) : (
          <>
            {step === 'denied' ? <Text style={styles.note}>Screen Time permission was not given. Try again.</Text> : null}
            <ParentButton label="Turn on" onPress={() => void start()} />
          </>
        )}
      </ParentCard>
      {step === 'picking' ? <ScreenTimePicker onDone={() => void picked()} /> : null}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.inkMuted },
  on: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.body, color: colors.leaf },
});
