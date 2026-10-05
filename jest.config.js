// Jest config: jest-expo preset and a fixed local time zone so lock/time tests are deterministic (A4).
process.env.TZ = 'America/Chicago';

module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/supabase/'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // Worklets ships a resolver that skips its native-only files under Jest.
  resolver: 'react-native-worklets/jest/resolver.js',
};
