// In-memory stand-in for expo-file-system's File/Directory/Paths (new API) used by jest.setup.ts.
export const fsData = new Map<string, string>();

type Part = string | { uri: string };

const join = (parts: Part[]) =>
  parts
    .map((p) => (typeof p === 'string' ? p : p.uri))
    .join('/')
    .replace(/\/+/g, '/')
    .replace('file:/', 'file:///');

export class File {
  uri: string;
  constructor(...parts: Part[]) {
    this.uri = join(parts);
  }
  get exists(): boolean {
    return fsData.has(this.uri);
  }
  create(): void {
    if (!fsData.has(this.uri)) fsData.set(this.uri, '');
  }
  write(content: string): void {
    fsData.set(this.uri, content);
  }
  async text(): Promise<string> {
    return fsData.get(this.uri) ?? '';
  }
  async base64(): Promise<string> {
    return fsData.get(this.uri) ?? '';
  }
  delete(): void {
    fsData.delete(this.uri);
  }
}

export class Directory {
  uri: string;
  constructor(...parts: Part[]) {
    this.uri = join(parts);
  }
  get exists(): boolean {
    return [...fsData.keys()].some((k) => k.startsWith(`${this.uri}/`));
  }
  create(): void {}
  delete(): void {
    for (const k of [...fsData.keys()]) if (k.startsWith(`${this.uri}/`)) fsData.delete(k);
  }
}

export const Paths = { document: { uri: 'file:///doc' }, cache: { uri: 'file:///cache' } };
