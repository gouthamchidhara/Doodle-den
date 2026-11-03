// AR Wall (A5). Hidden until @reactvision/react-viro supports this Expo SDK (OPEN_QUESTIONS T-061); a deep link lands here.
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mascot } from '@/components/kid/Mascot';
import { PrimaryButton } from '@/components/kid/PrimaryButton';
import { SpeechBubble } from '@/components/kid/SpeechBubble';
import { colors, space } from '@/theme/tokens';

// Friendly "not on this device" screen.
export function ArWallScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Mascot mood="idle" />
      <SpeechBubble text="The magic wall is not ready on this device yet." />
      <PrimaryButton label="Home" onPress={() => router.replace('/home')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid, alignItems: 'center', justifyContent: 'center', gap: space.xl },
});
