// Printing (A5 Stickers From My Art, A7 Feature 3): sticker sheet and story book PDFs → share sheet.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { getArtwork, listStickers } from '@/db/repositories/artworkRepo';
import type { Story } from '@/types/feature';

import { readBase64 } from './files';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const img = (b64: string) => `data:image/png;base64,${b64}`;

// A4/Letter sheet: 3 × 4 stickers with cut lines.
export function stickerSheetHtml(images: string[]): string {
  const cells = images.slice(0, 12).map((b) => `<div class="c"><img src="${img(b)}"></div>`).join('');
  return `<html><head><meta charset="utf-8"><style>@page{margin:12mm}body{margin:0}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}.c{border:1px dashed #999;border-radius:6mm;height:60mm;display:flex;align-items:center;justify-content:center}.c img{max-width:90%;max-height:90%}</style></head><body><div class="g">${cells}</div></body></html>`;
}

// Story book: title page, then one page per story page (drawing + text).
export function storyBookHtml(title: string, pages: { image: string | null; text: string }[]): string {
  const body = pages
    .map((p) => `<section>${p.image ? `<img src="${img(p.image)}">` : ''}<p>${esc(p.text)}</p></section>`)
    .join('');
  return `<html><head><meta charset="utf-8"><style>@page{margin:14mm}body{font-family:sans-serif;color:#1F2A44}section{page-break-before:always;text-align:center}h1{font-size:40px;text-align:center;margin-top:40%}img{max-width:100%;max-height:150mm;border-radius:8mm}p{font-size:26px;line-height:1.4}</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`;
}

async function share(html: string): Promise<boolean> {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return true;
  } catch (e) {
    console.warn('[print] failed', e);
    return false;
  }
}

// Builds and shares a kid's sticker sheet; false when there are no stickers.
export async function printStickerSheet(kidId: string): Promise<boolean> {
  const stickers = await listStickers(kidId);
  const imgs: string[] = [];
  for (const s of stickers) {
    const b = await readBase64(s.stickerPath ?? s.pngPath);
    if (b) imgs.push(b);
  }
  return imgs.length ? share(stickerSheetHtml(imgs)) : false;
}

// Builds and shares a story book PDF.
export async function printStoryBook(story: Story): Promise<boolean> {
  const pages: { image: string | null; text: string }[] = [];
  for (const p of story.pages) {
    const id = story.artworkIds[p.artIndex];
    const a = id ? await getArtwork(id) : null;
    pages.push({ image: a ? await readBase64(a.pngPath) : null, text: p.text });
  }
  return share(storyBookHtml(story.title, pages));
}
