// Parent zone → Subscription (A5): Free vs Family, store prices from RevenueCat offerings, Restore. Parents only.
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { ParentButton } from '@/components/parent/ParentButton';
import { ParentCard } from '@/components/parent/ParentCard';
import { ParentScreen } from '@/components/parent/ParentScreen';
import { buy, cachedFamily, currentOffering, restore } from '@/services/purchases';
import { paywallActive } from '@/state/features';
import { colors, fonts, fontSize } from '@/theme/tokens';

const FREE = 'Free Draw, 10 coloring pages, Aquarium, Trace A–E, Mixing Lab, My Gallery, Sticker Book, full time lock and parent controls, 1 kid.';
const FAMILY = 'Everything: all activities, brushes and pages, up to 4 kids, backup, Family Gallery and printing.';

// Subscription screen.
export function SubscriptionScreen() {
  const [family, setFamily] = useState(false);
  const [pkgs, setPkgs] = useState<PurchasesPackage[]>([]);
  const active = paywallActive();

  useEffect(() => {
    cachedFamily().then(setFamily).catch(() => undefined);
    currentOffering()
      .then((o) => setPkgs(o?.availablePackages ?? []))
      .catch(() => undefined);
  }, []);

  const purchase = async (p: PurchasesPackage) => {
    const ok = await buy(p);
    setFamily(ok);
    if (ok) Alert.alert('Thank you!', 'Family is now on for this family.');
  };
  const doRestore = async () => {
    const ok = await restore();
    setFamily(ok);
    Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Family is on.' : 'No Family plan was found for this store account.');
  };

  return (
    <ParentScreen title="Subscription">
      <ParentCard title="Free">
        <Text style={styles.text}>{FREE}</Text>
      </ParentCard>
      <ParentCard title={family ? 'Family (active)' : 'Family'}>
        <Text style={styles.text}>{FAMILY}</Text>
        {!active ? <Text style={styles.muted}>Purchases are not set up in this build, so everything is open.</Text> : null}
        {active && !family
          ? pkgs.map((p) => <ParentButton key={p.identifier} label={`${p.product.title} · ${p.product.priceString}`} onPress={() => void purchase(p)} />)
          : null}
        {active ? <ParentButton label="Restore purchases" variant="secondary" onPress={() => void doRestore()} /> : null}
        <Text style={styles.muted}>{"Family Sharing: one purchase covers your family's devices in the same store family group."}</Text>
      </ParentCard>
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.body, fontSize: fontSize.label, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: fontSize.caption, color: colors.inkMuted },
});
