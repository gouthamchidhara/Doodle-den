// 1–3 earned stars (gold) out of 3.
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

const STAR = 'M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z';

// Row of three stars, `count` filled.
export function StarRow({ count, size = 28 }: { count: number; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`${count} stars`}>
      {[0, 1, 2].map((i) => (
        <Svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <Path d={STAR} fill={i < count ? colors.sun : colors.surfaceMuted} stroke={colors.ink} strokeWidth={1.5} strokeLinejoin="round" />
        </Svg>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
