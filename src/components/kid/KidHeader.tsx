// Kid screen top bar (A5 global rules): Home at top-left, optional extra buttons, TimePill, right-side actions.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useRemainingMinutes } from '@/lock/useRemainingMinutes';
import { space } from '@/theme/tokens';

import { HomeIcon } from './icons/HomeIcon';
import { IconButton } from './IconButton';
import { TimePill } from './TimePill';

export interface KidHeaderProps {
  left?: ReactNode;
  right?: ReactNode;
  onHome?: () => void;
  showPill?: boolean;
}

// Header row shared by every kid screen except Kid Home.
export function KidHeader({ left, right, onHome, showPill = true }: KidHeaderProps) {
  const minutes = useRemainingMinutes();
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        <IconButton icon={<HomeIcon />} accessibilityLabel="Home" onPress={onHome ?? (() => router.replace('/home'))} />
        {left}
      </View>
      {showPill && minutes !== null ? <TimePill minutesLeft={minutes} /> : null}
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  side: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexShrink: 0 },
  right: { justifyContent: 'flex-end' },
});
