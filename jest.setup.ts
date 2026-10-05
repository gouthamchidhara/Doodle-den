// Global Jest setup: Reanimated test mode and native module mocks used by many tests.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const mockAudioPlayer = () => ({
  play: jest.fn(),
  pause: jest.fn(),
  remove: jest.fn(),
  release: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
  setPlaybackRate: jest.fn(),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  volume: 1,
  loop: false,
  shouldCorrectPitch: true,
  playing: false,
});
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockAudioPlayer()),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  useAudioPlayer: jest.fn(() => mockAudioPlayer()),
  useAudioRecorder: jest.fn(() => ({ prepareToRecordAsync: jest.fn(), record: jest.fn(), stop: jest.fn(), uri: null })),
  useAudioRecorderState: jest.fn(() => ({ isRecording: false, durationMillis: 0 })),
  requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  getRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  RecordingPresets: { HIGH_QUALITY: {} },
}));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

jest.mock('expo-router', () => {
  const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true), navigate: jest.fn(), dismissAll: jest.fn() };
  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: jest.fn(() => ({})),
    useSegments: jest.fn(() => []),
    usePathname: jest.fn(() => '/'),
    useFocusEffect: jest.fn(),
    Redirect: () => null,
    Link: ({ children }: { children: unknown }) => children,
    Stack: Object.assign(() => null, { Screen: () => null }),
    Slot: () => null,
  };
});

jest.mock('expo-file-system', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const m = require('./__tests__/helpers/mockFs') as typeof import('./__tests__/helpers/mockFs');
  return { File: m.File, Directory: m.Directory, Paths: m.Paths };
});
