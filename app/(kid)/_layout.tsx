// Kid shell: screens plus reward toasts and the wind-down overlay on top.
import { Stack } from 'expo-router';
import { View } from 'react-native';

import { RewardToast } from '@/components/kid/RewardToast';
import { WindDownOverlay } from '@/components/kid/WindDownOverlay';

export default function KidLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <RewardToast />
      <WindDownOverlay />
    </View>
  );
}
