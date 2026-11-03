// Parent zone → Time rules (A5): every TimeRules field with allowed ranges; Save → saveRules + applyRulesChange (+ iOS shield).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { TimeRulesForm } from '@/components/parent/TimeRulesForm';
import { getRules, saveRules } from '@/db/repositories/rulesRepo';
import { lockController } from '@/lock/lockRuntime';
import { useSessionStore } from '@/state/sessionStore';
import type { TimeRules } from '@/types/models';

// Time rules screen.
export function TimeRulesScreen() {
  const params = useLocalSearchParams<{ kidId?: string }>();
  const activeKid = useSessionStore((s) => s.activeKidId);
  const kidId = params.kidId || activeKid;
  const [rules, setRules] = useState<TimeRules | null>(null);

  useEffect(() => {
    if (kidId) getRules(kidId).then(setRules).catch(() => undefined);
  }, [kidId]);

  const save = async () => {
    if (!rules || !kidId) return;
    await saveRules(rules);
    await lockController.rulesChanged(kidId);
    router.back();
  };

  return (
    <ParentScreen title="Time rules">
      {rules ? (
        <>
          <TimeRulesForm rules={rules} onChange={setRules} showAdvanced />
          <ParentButton label="Save" onPress={() => void save()} />
        </>
      ) : null}
    </ParentScreen>
  );
}
