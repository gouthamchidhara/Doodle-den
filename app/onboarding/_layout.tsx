// Onboarding stack (parent look, slide transitions).
import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgParent } }} />;
}
