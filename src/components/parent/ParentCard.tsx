// White parent-zone card with optional title (A2).
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { border, colors, fonts, fontSize, radius, space } from '@/theme/tokens';

export interface ParentCardProps {
  children: ReactNode;
  title?: string;
  right?: ReactNode;
}

// Card container used on every parent screen.
export function ParentCard({ children, title, right }: ParentCardProps) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: border.thin,
    borderColor: colors.borderParent,
    borderRadius: radius.card,
    padding: 18,
    gap: space.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.bodyHeavy, fontSize: fontSize.body - 2, color: colors.ink },
});
