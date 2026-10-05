// Random ids for rows and files.
import * as Crypto from 'expo-crypto';

// Returns a new random UUID v4.
export function newId(): string {
  return Crypto.randomUUID();
}
