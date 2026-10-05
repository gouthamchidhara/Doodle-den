// App files under the document folder (A3 File paths). All paths here are relative to Paths.document.
import { Directory, File, Paths } from 'expo-file-system';

export interface ArtPaths {
  png: string;
  thumb: string;
  strokes: string;
}

// Relative paths for one artwork's three files.
export function artPaths(kidId: string, artworkId: string): ArtPaths {
  const base = `art/${kidId}/${artworkId}`;
  return { png: `${base}.png`, thumb: `${base}.thumb.png`, strokes: `${base}.strokes.json` };
}

// Absolute file:// URI for a relative path (for <Image source>).
export function fileUri(rel: string): string {
  return new File(Paths.document, rel).uri;
}

// Opens a file handle, creating it (and its folders) when missing.
function ensureFile(rel: string): File {
  const f = new File(Paths.document, rel);
  if (!f.exists) f.create({ intermediates: true });
  return f;
}

// Writes base64 bytes (PNG) to a relative path.
export function writeBase64(rel: string, b64: string): void {
  ensureFile(rel).write(b64, { encoding: 'base64' });
}

// Writes UTF-8 text to a relative path.
export function writeText(rel: string, text: string): void {
  ensureFile(rel).write(text);
}

// Reads UTF-8 text, or null when the file is missing or unreadable.
export async function readText(rel: string): Promise<string | null> {
  try {
    const f = new File(Paths.document, rel);
    return f.exists ? await f.text() : null;
  } catch (e) {
    console.warn('[files] read failed', e);
    return null;
  }
}

// Reads a file as base64, or null when missing.
export async function readBase64(rel: string): Promise<string | null> {
  try {
    const f = new File(Paths.document, rel);
    return f.exists ? await f.base64() : null;
  } catch (e) {
    console.warn('[files] read failed', e);
    return null;
  }
}

// True when the relative file exists.
export function fileExists(rel: string): boolean {
  return new File(Paths.document, rel).exists;
}

// Deletes files quietly (missing files are fine).
export function deleteFiles(rels: (string | null | undefined)[]): void {
  for (const rel of rels) {
    if (!rel) continue;
    try {
      const f = new File(Paths.document, rel);
      if (f.exists) f.delete();
    } catch (e) {
      console.warn('[files] delete failed', e);
    }
  }
}

// Deletes a kid's whole art folder (profile deletion).
export function deleteKidArt(kidId: string): void {
  try {
    const d = new Directory(Paths.document, `art/${kidId}`);
    if (d.exists) d.delete();
  } catch (e) {
    console.warn('[files] delete folder failed', e);
  }
}
