// Earned-sticker toast (A5): the sticker pops in and flies into a book icon; one toast per 20 s.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getReward } from '@/content/rewards';
import { playSound } from '@/services/audio';
import { useRewardStore } from '@/state/rewardStore';
import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { StickerBookArt } from './icons/StickerBookArt';
import { StickerView } from './StickerView';

const SHOW_MS = 3000;

// Mounted in the kid layout.
export function RewardToast() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<string | null>(null);
  const fly = useSharedValue(0);

  useEffect(() => {
    const t = setInterval(() => {
      if (current) return;
      const next = useRewardStore.getState().shift(Date.now());
      if (next) setCurrent(next);
    }, 1000);
    return () => clearInterval(t);
  }, [current]);

  useEffect(() => {
    if (!current) return undefined;
    playSound('sticker-earned');
    fly.set(withSequence(withTiming(0, { duration: 0 }), withDelay(1600, withTiming(1, { duration: 900, easing: Easing.in(Easing.cubic) }))));
    const t = setTimeout(() => setCurrent(null), SHOW_MS);
    return () => clearTimeout(t);
  }, [current, fly]);

  const stickerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: fly.get() * 120 }, { scale: 1 - fly.get() * 0.7 }], opacity: 1 - fly.get() * 0.6 }));
  if (!current) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + space.xl }]} accessibilityRole="alert">
      <View style={styles.toast}>
        <Animated.View style={stickerStyle}>
          <StickerView id={current} size={64} />
        </Animated.View>
        <Text style={styles.text}>{getReward(current)?.title ?? 'New sticker!'}</Text>
        <StickerBookArt size={48} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: border.normal, borderColor: colors.sun, paddingHorizontal: space.lg, paddingVertical: space.sm },
  text: { fontFamily: fonts.display, fontSize: fontSize.body, color: colors.ink },
});
