// Root layout: fonts, providers, LockGate and orientation are added in T-003 / T-033.
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
