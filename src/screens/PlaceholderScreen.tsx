// Temporary screen for routes whose ticket has not landed yet: title + Home button.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/kid/IconButton';
import { HomeIcon } from '@/components/kid/icons/HomeIcon';
import { colors, fonts, fontSize, space } from '@/theme/tokens';

export interface PlaceholderScreenProps {
  title: string;
}

// Shows the route title and a way back to Kid Home.
export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.bar}>
        <IconButton icon={<HomeIcon />} accessibilityLabel="Home" onPress={() => router.replace('/home')} />
      </View>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgKid, padding: space.xl },
  bar: { flexDirection: 'row' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: fontSize.title, color: colors.ink },
});
