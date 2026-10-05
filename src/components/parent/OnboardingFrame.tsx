// Shared parent-style frame for onboarding steps: back arrow, title, content, big Next button.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArrowLeftIcon } from '@/components/kid/icons/ArrowLeftIcon';
import { colors, fonts, fontSize, space, touch } from '@/theme/tokens';

import { ParentButton } from './ParentButton';

export interface OnboardingFrameProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children?: ReactNode;
  nextLabel?: string;
  onNext?: () => void;
  nextDisabled?: boolean;
  footer?: ReactNode;
}

// One question per screen, centered column max 520 wide.
export function OnboardingFrame({ title, subtitle, onBack, children, nextLabel = 'Next', onNext, nextDisabled, footer }: OnboardingFrameProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <View style={styles.top}>
              {onBack ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
                  <ArrowLeftIcon />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={styles.body}>{children}</View>
            {onNext ? <ParentButton label={nextLabel} onPress={onNext} disabled={nextDisabled} /> : null}
            {footer}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bgParent },
  scroll: { flexGrow: 1, padding: space.xl, alignItems: 'center' },
  column: { width: '100%', maxWidth: 520, gap: space.lg, flexGrow: 1 },
  top: { height: touch.parent },
  back: { width: touch.parent, height: touch.parent, justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: fontSize.title + 4, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: fontSize.body - 2, color: colors.inkMuted },
  body: { gap: space.lg, paddingVertical: space.md },
});
