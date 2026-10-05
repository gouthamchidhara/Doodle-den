// Frame for parent zone screens: back arrow, title, scrolling column (max 640 wide).
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArrowLeftIcon } from '@/components/kid/icons/ArrowLeftIcon';
import { colors, fonts, fontSize, space, touch } from '@/theme/tokens';

export interface ParentScreenProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
}

// Goes back inside the parent zone, or to the dashboard.
const defaultBack = () => (router.canGoBack() ? router.back() : router.replace('/parent'));

// Parent screen scaffold.
export function ParentScreen({ title, subtitle, children, onBack = defaultBack, right }: ParentScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          <View style={styles.top}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
              <ArrowLeftIcon />
            </Pressable>
            {right}
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgParent },
  scroll: { flexGrow: 1, padding: space.xl, alignItems: 'center' },
  column: { width: '100%', maxWidth: 640, gap: space.md },
  top: { height: touch.parent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: touch.parent, height: touch.parent, justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: fontSize.title + 4, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: fontSize.body - 2, color: colors.inkMuted },
  body: { gap: space.lg, paddingVertical: space.md },
});
