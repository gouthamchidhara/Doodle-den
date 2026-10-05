// Daily limit, per-session limit and bedtime editor (onboarding + parent zone).
import { StyleSheet, View } from 'react-native';

import type { TimeRules } from '@/types/models';
import { formatClock, parseHHMM, toHHMM } from '@/utils/time';

import { SettingRow } from './SettingRow';
import { Stepper } from './Stepper';

export interface TimeRulesFormProps {
  rules: TimeRules;
  onChange: (rules: TimeRules) => void;
  showAdvanced?: boolean;
}

// Steppers in A3 ranges; session limit never exceeds the daily limit.
export function TimeRulesForm({ rules, onChange, showAdvanced }: TimeRulesFormProps) {
  const set = (patch: Partial<TimeRules>) => {
    const next = { ...rules, ...patch };
    if (next.sessionLimitMin > next.dailyLimitMin) next.sessionLimitMin = next.dailyLimitMin;
    onChange(next);
  };
  return (
    <View style={styles.wrap}>
      <Stepper label="Daily limit" value={rules.dailyLimitMin} min={10} max={180} step={5} format={(v) => `${v} min`} onChange={(v) => set({ dailyLimitMin: v })} />
      <Stepper
        label="Per session"
        value={rules.sessionLimitMin}
        min={5}
        max={Math.min(120, rules.dailyLimitMin)}
        step={5}
        format={(v) => `${v} min`}
        onChange={(v) => set({ sessionLimitMin: v })}
      />
      {showAdvanced ? (
        <Stepper label="Break between sessions" value={rules.cooldownMin} min={0} max={240} step={15} format={(v) => `${v} min`} onChange={(v) => set({ cooldownMin: v })} />
      ) : null}
      <SettingRow label="Bedtime lock" toggle={{ value: rules.bedtimeEnabled, onChange: (v) => set({ bedtimeEnabled: v }) }} />
      {rules.bedtimeEnabled ? (
        <>
          <Stepper
            label="Bedtime starts"
            value={parseHHMM(rules.bedtimeStart)}
            min={0}
            max={1425}
            step={15}
            wrap
            format={(v) => formatClock(toHHMM(v))}
            onChange={(v) => set({ bedtimeStart: toHHMM(v) })}
          />
          <Stepper
            label="Play starts again"
            value={parseHHMM(rules.bedtimeEnd)}
            min={0}
            max={1425}
            step={15}
            wrap
            format={(v) => formatClock(toHHMM(v))}
            onChange={(v) => set({ bedtimeEnd: toHHMM(v) })}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: 4 } });
