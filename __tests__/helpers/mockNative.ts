// Shared in-memory mocks for expo-secure-store and expo-crypto (Node crypto under the hood).
interface NodeCrypto {
  createHash(alg: string): { update(data: string, enc: string): { digest(enc: string): string } };
  randomBytes(n: number): ArrayLike<number>;
  randomUUID(): string;
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createHash, randomBytes, randomUUID } = require('node:crypto') as NodeCrypto;

export const secureStoreData = new Map<string, string>();

export const secureStoreMock = {
  getItemAsync: jest.fn(async (k: string) => secureStoreData.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    secureStoreData.set(k, v);
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    secureStoreData.delete(k);
  }),
};

export const cryptoMock = {
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { HEX: 'hex' },
  digestStringAsync: jest.fn(async (_alg: string, input: string) => createHash('sha256').update(input, 'utf8').digest('hex')),
  getRandomBytes: jest.fn((n: number) => Uint8Array.from(randomBytes(n))),
  randomUUID: jest.fn(() => randomUUID()),
};
