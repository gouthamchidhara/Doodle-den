// Moderation (A7): blocklist first, then the provider. Anything flagged → BLOCKED.
import { passesBlocklist } from './blocklist.ts';
import { AiError } from './contract.ts';
import type { Moderator } from './providers/types.ts';

// Throws BLOCKED unless every text passes.
export async function checkText(mod: Moderator, ...texts: string[]): Promise<void> {
  for (const t of texts) {
    if (!passesBlocklist(t)) throw new AiError('BLOCKED');
    if (!(await mod.text(t))) throw new AiError('BLOCKED');
  }
}

// Throws BLOCKED unless the image passes.
export async function checkImage(mod: Moderator, base64: string): Promise<void> {
  if (!(await mod.image(base64))) throw new AiError('BLOCKED');
}
