// Jest config: jest-expo preset and a fixed local time zone so lock/time tests are deterministic (A4).
process.env.TZ = 'America/Chicago';

module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/supabase/'],
};
