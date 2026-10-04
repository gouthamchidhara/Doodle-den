// Sanity checks for the test environment itself.
describe('test environment', () => {
  it('runs in the America/Chicago time zone', () => {
    // CST is UTC-6 in January, CDT is UTC-5 in July.
    expect(new Date('2026-01-15T12:00:00Z').getTimezoneOffset()).toBe(360);
    expect(new Date('2026-07-15T12:00:00Z').getTimezoneOffset()).toBe(300);
  });
});
