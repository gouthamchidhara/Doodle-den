// Hashing + random helpers for the parent PIN (SHA-256 + salt).
import * as Crypto from 'expo-crypto';

// Hex SHA-256 of a UTF-8 string.
export async function sha256Hex(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input, { encoding: Crypto.CryptoEncoding.HEX });
}

// Random bytes as lowercase hex.
export function randomHex(byteCount: number): string {
  return Array.from(Crypto.getRandomBytes(byteCount), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time-ish string compare to avoid early exit on the first mismatch.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
