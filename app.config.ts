// Expo app config (T-002): identity, OS minimums, orientation, plugins and permission strings.
import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withGradleProperties, type ConfigPlugin } from 'expo/config-plugins';

const BUNDLE_ID = 'com.gpc.doodleden';
const APPLE_TEAM_ID = 'KSD8FCH7C9';
const SCREEN_TIME_APP_GROUP = `group.${BUNDLE_ID}.screentime`;
const IOS_SCREEN_TIME = process.env.EXPO_PUBLIC_IOS_SCREEN_TIME === 'true';

// Sets android.minSdkVersion in gradle.properties (same mechanism as expo-build-properties).
const withAndroidMinSdk: ConfigPlugin<number> = (config, minSdk) =>
  withGradleProperties(config, (cfg) => {
    cfg.modResults = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === 'android.minSdkVersion'),
    );
    cfg.modResults.push({ type: 'property', key: 'android.minSdkVersion', value: String(minSdk) });
    return cfg;
  });

// Screen Time extensions + entitlements; only built once Apple approves Family Controls (A4).
const screenTimePlugins: NonNullable<ExpoConfig['plugins']> = IOS_SCREEN_TIME
  ? [['react-native-device-activity', { appleTeamId: APPLE_TEAM_ID, appGroup: SCREEN_TIME_APP_GROUP }]]
  : [];

const MIC_PERMISSION = '$(PRODUCT_NAME) uses the microphone to give drawings a silly voice.';

// Builds the full Expo config; the iOS Screen Time pieces are added only when the flag is on (A4).
export default ({ config }: ConfigContext): ExpoConfig => {
  const expoConfig: ExpoConfig = {
    ...config,
    name: 'Sleepy Crayons',
    slug: 'doodle-den',
    version: '1.0.0',
    scheme: 'doodleden',
    // Tablets landscape, phones portrait: per-idiom lists on iOS, runtime lock (T-003) on Android.
    orientation: 'default',
    userInterfaceStyle: 'light',
    icon: './assets/images/icon.png',
    ios: {
      bundleIdentifier: BUNDLE_ID,
      appleTeamId: APPLE_TEAM_ID,
      deploymentTarget: '17.0',
      supportsTablet: true,
      requireFullScreen: true,
      icon: './assets/expo.icon',
      infoPlist: {
        UISupportedInterfaceOrientations: ['UIInterfaceOrientationPortrait'],
        'UISupportedInterfaceOrientations~ipad': [
          'UIInterfaceOrientationLandscapeLeft',
          'UIInterfaceOrientationLandscapeRight',
        ],
        ITSAppUsesNonExemptEncryption: false,
      },
      ...(IOS_SCREEN_TIME
        ? { entitlements: { 'com.apple.developer.family-controls': true } }
        : {}),
    },
    android: {
      package: BUNDLE_ID,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      // Kids app: no storage or draw-over-other-apps access (files live in the app sandbox).
      blockedPermissions: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.SYSTEM_ALERT_WINDOW',
      ],
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-sqlite',
      ['expo-secure-store', { faceIDPermission: false }],
      'expo-sharing',
      [
        'expo-splash-screen',
        { backgroundColor: '#208AEF', image: './assets/images/splash-icon.png', imageWidth: 76 },
      ],
      [
        'expo-camera',
        {
          cameraPermission: "$(PRODUCT_NAME) uses the camera to bring your child's paper drawings to life.",
          // Same text as expo-audio: NSMicrophoneUsageDescription is one shared key.
          microphonePermission: MIC_PERMISSION,
          recordAudioAndroid: false,
          barcodeScannerEnabled: false,
        },
      ],
      ['expo-audio', { microphonePermission: MIC_PERMISSION, enableBackgroundPlayback: false }],
      [
        'expo-speech-recognition',
        {
          microphonePermission: MIC_PERMISSION,
          speechRecognitionPermission:
            "$(PRODUCT_NAME) uses speech recognition to turn your child's spoken idea into text on this device.",
        },
      ],
      ...screenTimePlugins,
    ],
    experiments: { typedRoutes: true, reactCompiler: true },
  };
  return withAndroidMinSdk(expoConfig, 26);
};
