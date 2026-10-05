// Safe JSON helpers for TEXT columns holding arrays/objects.

// Parses a JSON array of strings, returning [] on bad data.
export function parseStringArray(json: string): string[] {
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
