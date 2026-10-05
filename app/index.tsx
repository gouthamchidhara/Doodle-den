// Entry route: waits for DB + lock state, then redirects (A5 App start & routing).
import { StartupScreen } from '@/screens/StartupScreen';

export default function Index() {
  return <StartupScreen />;
}
