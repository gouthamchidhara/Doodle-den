# A7 · AI features

Six narrow AI features run through Supabase Edge Functions. The app never talks to an AI provider directly, kids never type or chat with an AI, and every output passes moderation. All six are free at launch and can become paid by flipping one server setting.

## Non-negotiable AI rules

1. **No chat.** No text box where a kid talks to an AI. No free-form conversation. Each feature is one fixed task with a fixed prompt template.
2. **Server only.** All AI calls go `app → Supabase Edge Function → provider`. API keys live only in Supabase secrets.
3. **Parent first.** AI works only after a parent has (a) signed in and (b) accepted the AI consent screen. Otherwise Magic tiles show the mascot line "Ask a grown-up to turn on Magic" and open the Parent Gate.
4. **Moderate in and out.** Every text input and every output (text or image) is checked. Anything flagged returns `BLOCKED`.
5. **Never change the kid's art.** AI results are saved as NEW items. Originals are never edited or deleted.
6. **Minimal data.** Send only what the task needs: a resized drawing (max 768 px, PNG) or short text. Never send kid nickname, age band beyond `little`/`big`, device ids, or location. Never send camera photos of the room.
7. **Zero retention.** Use provider accounts/endpoints that do not retain or train on inputs. The owner confirms this before launch.
8. **Caps always on**, even when free.

## Architecture

| Step | Where | What happens |
| --- | --- | --- |
| 1 | App (`src/services/ai.ts`) | Builds request, attaches the parent's Supabase access token, calls `supabase.functions.invoke('<function>', { body })` with a 60 s timeout |
| 2 | Edge Function `_shared/guard.ts` | Verify JWT → load family → check consent → check entitlement → check daily cap |
| 3 | `_shared/validate.ts` | Validate body with zod; reject oversize images (> 1.5 MB base64) |
| 4 | `_shared/moderation.ts` | Moderate text input (blocklist first, then provider moderation) |
| 5 | `_shared/providers/*.ts` | Call the provider with the feature's exact prompt template, 45 s timeout |
| 6 | `_shared/moderation.ts` | Moderate the output (text: blocklist + provider moderation; image: provider image moderation or a vision safety check) |
| 7 | `_shared/usage.ts` | Insert one `ai_usage` row (status, estimated cost) |
| 8 | Function | Return the response contract below |

## Response contract (all functions)

```ts
type AiResponse<T> =
  | { ok: true; id: string; data: T }
  | { ok: false; code: 'NEEDS_CONSENT' | 'NEEDS_PLAN' | 'CAP_REACHED' | 'BLOCKED' | 'BAD_INPUT' | 'PROVIDER_ERROR' | 'UNAUTHORIZED' };
```

Kid-facing message per code (mascot speech bubble + `expo-speech`; never show the code):

| Code | Mascot says | Then |
| --- | --- | --- |
| `NEEDS_CONSENT`, `NEEDS_PLAN`, `UNAUTHORIZED` | "Ask a grown-up to turn on Magic!" | Button opens Parent Gate → AI settings |
| `CAP_REACHED` | "My magic needs a nap. Let's try again tomorrow!" | Back to shelf |
| `BLOCKED` | "Hmm, let's pick a different idea!" | Back to idea picker |
| `BAD_INPUT`, `PROVIDER_ERROR`, timeout | "Oops, my magic got tangled. Try again?" | Retry button |
| Offline (no request sent) | "Magic needs the internet." | Magic tiles show a small cloud icon and are dimmed |

While waiting: full-screen mascot "stirring a paint pot" animation, a soft loop sound, and a big Cancel button. No progress percentages.

## Supabase tables (save as `supabase/migrations/0002_ai.sql`)

```sql
alter table public.family add column ai_entitled boolean not null default false;

create table public.app_config (
  key text primary key,
  value jsonb not null
);
insert into public.app_config (key, value) values
  ('ai_free_for_all', 'true'),
  ('ai_caps_per_day', '{"coloring_page":10,"magic_sketch":10,"story":5,"guess":50,"coach":50,"digest":1}');

create table public.ai_consent (
  family_id uuid primary key references public.family(id) on delete cascade,
  consent_version int not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family(id) on delete cascade,
  feature text not null,
  status text not null check (status in ('ok','blocked','error','cap')),
  est_cost_usd numeric(10,5) not null default 0,
  created_at timestamptz not null default now()
);
create index on public.ai_usage (family_id, feature, created_at);

create table public.family_share (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family(id) on delete cascade,
  token text not null unique,         -- 32 random url-safe chars
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.app_config enable row level security;   -- no client policies: server reads with service role
alter table public.ai_consent enable row level security;
alter table public.ai_usage enable row level security;
alter table public.family_share enable row level security;

create policy "own consent" on public.ai_consent for all
  using (family_id in (select id from public.family where parent_user_id = auth.uid()))
  with check (family_id in (select id from public.family where parent_user_id = auth.uid()));
create policy "own usage read" on public.ai_usage for select
  using (family_id in (select id from public.family where parent_user_id = auth.uid()));
create policy "own shares" on public.family_share for all
  using (family_id in (select id from public.family where parent_user_id = auth.uid()))
  with check (family_id in (select id from public.family where parent_user_id = auth.uid()));
```

**Guard logic (`_shared/guard.ts`):**

```text
user = verify JWT from Authorization header            -> else UNAUTHORIZED
family = select * from family where parent_user_id = user.id -> else UNAUTHORIZED
consent = ai_consent row with revoked_at is null       -> else NEEDS_CONSENT
free = app_config['ai_free_for_all'] == true
if not free and not family.ai_entitled                 -> NEEDS_PLAN
used = count ai_usage where family_id, feature, status in ('ok','blocked') and created_at >= start of UTC day
if used >= app_config['ai_caps_per_day'][feature]      -> CAP_REACHED (log status 'cap')
```

The digest cap counts per 7 days instead of per day.

## Paid-later switch

- RevenueCat entitlement id: `ai_magic`. Create it now. Attach it to the Family subscription products (and an optional add-on product later).
- After parent sign-in, call `Purchases.logIn(family.id)` so RevenueCat's app user id = `family.id`.
- Edge Function `rc-webhook`: RevenueCat webhook → check `Authorization` header equals secret `RC_WEBHOOK_SECRET` → for events `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `UNCANCELLATION`: set `family.ai_entitled = true` if `ai_magic` is in `entitlement_ids`; for `EXPIRATION`: set false. Return 200.
- To start charging: `update app_config set value = 'false' where key = 'ai_free_for_all';`. No app release needed.
- App UI: when the server returns `NEEDS_PLAN`, the Parent zone shows the paywall with the AI benefits listed.

## Providers (`_shared/providers/`)

Write small adapters behind these interfaces so the owner can switch providers with secrets only:

```ts
export interface TextProvider { complete(opts: { system: string; user: string; images?: string[]; maxTokens: number; json: boolean }): Promise<string> }
export interface ImageProvider {
  generate(opts: { prompt: string; size: '1024x1024' }): Promise<string>;              // returns base64 PNG
  edit(opts: { prompt: string; imageBase64: string; size: '1024x1024' }): Promise<string>; // returns base64 PNG
}
export interface Moderator { text(input: string): Promise<boolean>; image(base64: string): Promise<boolean> } // true = safe
```

| Secret (Supabase) | Default to implement first | Notes |
| --- | --- | --- |
| `AI_TEXT_PROVIDER` | `anthropic` | Text + vision (story, guesses, coach, digest, idea rewrite, image safety check) |
| `AI_TEXT_MODEL` | `claude-haiku-4-5-20251001` | Small, fast, cheap; supports images |
| `AI_TEXT_API_KEY` | — |  |
| `AI_IMAGE_PROVIDER` | `openai` | Image generate + edit (coloring pages, Magic Sketch) |
| `AI_IMAGE_MODEL` | the provider's current image model | Owner confirms name before launch |
| `AI_IMAGE_API_KEY` | — |  |
| `AI_MODERATION_PROVIDER` | `openai` | Moderation endpoint for text and images |
| `RC_WEBHOOK_SECRET` | random string | Also set in RevenueCat dashboard |
| `COST_*` | e.g. `COST_COLORING_PAGE=0.04` | Estimated USD per call for `ai_usage.est_cost_usd`; owner fills real values |

If a provider is unavailable, implement the interface for another provider; do not change feature code.

## Blocklist (`_shared/blocklist.ts`)

Lowercase word list checked on every text input and text output before provider moderation: violence, weapons, blood, death, horror and scary-monster words, adult/sexual words, drugs, alcohol, smoking, profanity, slurs, self-harm words, real brand and character names, and personal-info patterns (digits sequences of 5+, `@`, `http`, street words like "street", "road", "avenue"). Owner reviews the final list. Match whole words, case-insensitive.

## Feature 1 · Coloring Page Maker — `ai-coloring-page`

**Kid flow:** Magic shelf → Coloring Page Maker → three big tile rows: WHO (required), DOING (optional), WHERE (optional). Each tile = picture + spoken word on tap. Big mode also shows a microphone button ("Say your idea") using `expo-speech-recognition` on-device; the transcript is shown as big text with "Use it" / "Try again". Tap "Make my page!".

**Tile lists (`src/content/aiIdeaTiles.json`):**

- WHO (40): dinosaur, cat, dog, unicorn, rocket, robot, fish, dragon, castle, truck, butterfly, flower, owl, whale, turtle, lion, elephant, bunny, bear, car, train, airplane, octopus, mermaid, knight, astronaut, friendly monster, penguin, giraffe, fox, horse, house, tree, sun, ice cream, cake, balloon, pirate ship, bee, snail
- DOING (12): on a skateboard, eating ice cream, flying, swimming, dancing, sleeping, playing soccer, reading a book, wearing a hat, riding a bike, juggling, waving hello
- WHERE (10): in space, under the sea, in a jungle, at the beach, in a castle, on a farm, in a city, on a mountain, in the snow, at a birthday party

**Request:** `{ ageMode: 'little'|'big', tiles?: { who: string; doing?: string; where?: string }, spokenText?: string }` — exactly one of `tiles` or `spokenText`. `spokenText` max 80 chars, Big mode only. Tile values must exactly match the JSON lists (server has a copy).

**Server steps:**

1. Tiles → `idea = who + ' ' + (doing ?? '') + ' ' + (where ?? '')` trimmed.
2. Spoken → blocklist + moderation → text model rewrite. System: `Rewrite the child's idea as a short, safe, kid-friendly coloring page subject, max 8 words. No brands, no real people, no scary or violent content. If it cannot be made appropriate for a 3-8 year old, return exactly BLOCKED. Return only the subject.` → if `BLOCKED` → `BLOCKED`.
3. Image prompt (exact): `A children's coloring book page of {idea}. Simple black outlines only on a pure white background, thick clean lines, large closed shapes that are easy to color, no shading, no gray, no text, no letters, cute and friendly, centered, whole subject visible.` For `little`, append `Very simple, few large shapes.`
4. `ImageProvider.generate` 1024×1024 → image moderation → return.

**Response data:** `{ imageBase64: string, idea: string }`.

**App post-processing:** threshold to pure black/white (luminance < 160 → black, else white) with Skia, save to `art/<kidId>/pages/<id>.png`, insert `ai_result` (feature `coloring_page`), open it in the Coloring screen (bitmap flood-fill mode, tab A5). Generated pages appear in a "My Pages" row at the top of the Coloring page picker.

## Feature 2 · Magic Sketch — `ai-magic-sketch`

**Kid flow:** from Free Draw ("Magic" button, only if the canvas has at least 10 strokes) or from My Gallery detail. Shows the original, mascot waves a wand, result slides in beside it. Buttons: "Keep it!" (default) and "Try again" (counts toward cap).

**Request:** `{ ageMode, imageBase64 }` — the drawing exported at 768 px long edge on white.

**Image prompt (exact, edit mode):** `Redraw this child's drawing as a clean, colorful cartoon illustration for young children. Keep the same subject, pose, layout and the colors the child chose. Bold outlines, flat bright colors, friendly, no text, no realistic human faces, white background.`

**Steps:** input image moderation → `ImageProvider.edit` → output image moderation → return `{ imageBase64 }`.

**App:** save as a NEW artwork (activity `magic`, title `"Magic " + original title or null`), insert `ai_result` with `source_artwork_id`. Original untouched.

## Feature 3 · Story Maker — `ai-story`

**Kid flow:** Magic shelf → Story Maker → pick 1–4 drawings from My Gallery (big thumbnails, numbered in tap order) → "Make my story!" → story plays: one drawing per page, text in big Fredoka, read aloud with `expo-speech` (rate 0.9 Little, 1.0 Big), auto-turns pages; buttons Replay, Next, Done. Saved in My Stuff → Stories.

**Request:** `{ ageMode, images: string[] /* 1-4, 512 px PNG base64 */, heroName?: string }`. `heroName` is sent only if the parent turned on "Use nickname in stories" (default OFF); otherwise the story says "our little artist".

**Step 1 (vision, one call with all images):** system `Describe each child's drawing in max 12 simple words, as what it most likely shows. Be kind. Return JSON {"captions": [string, ...]} in the same order.`

**Step 2 (text):** system (exact):

```text
You write very short, gentle, happy stories for children aged {3-5|6-8}.
Rules: max {60|120} words total. {4-6|6-10} short sentences. Simple everyday words.
Happy ending. No violence, no scary content, no danger, no brands, no real people,
no romance, no unsafe activities, no questions to the reader.
Each drawing appears in order as a character, object or place.
Return only JSON: {"title": string (max 6 words), "pages": [{"artIndex": number, "text": string}]}
with exactly one page per drawing.
```

user: `Drawings in order: {captions as numbered list}. Hero: {heroName or "our little artist"}.`

**Steps:** parse JSON (retry once if invalid) → blocklist + moderation on title and all page texts → return `{ title, pages }`.

**App:** insert `story` (body = JSON string of pages). Parent zone → Stories → "Print book": `expo-print` HTML template, cover page (title + first drawing), one page per drawing with its text, then `expo-sharing`.

## Feature 4 · Mascot Guesses — `ai-guess`

**Kid flow:** in Free Draw, Coloring and worlds' draw screens, tapping the mascot shows two bubbles: "Guess my drawing!" and "Give me an idea!" (Feature 5). Guess → mascot thinks (2 s) → speaks "Is it… a giraffe? A banana? A rocket?" with a giggle sound. Kid taps big "Yes!" (mascot cheers, earns a sticker once per day) or "No!" (mascot: "Silly me!"). Allowed only when the canvas has 5+ strokes; once per 30 s.

**Request:** `{ ageMode, imageBase64 /* 512 px */ }`.

**Prompt:** system `A young child drew this. Make 3 short, funny, kind guesses of what it might be. Each 1-3 words, things a 5-year-old knows. Never say anything negative about the drawing. Return only JSON {"guesses": [string, string, string]}.`

**Steps:** parse → drop any guess failing the blocklist → if none left return `{ guesses: ['a happy surprise'] }`.

## Feature 5 · Drawing Coach — `ai-coach`

The model can only choose an id from a fixed list, so every possible output is pre-written and pre-recorded.

**List (`src/content/coachIdeas.json`, server has a copy; each has `id`, `text`, `voice` file in `assets/voice/coach/<id>.m4a`):** add\_sun "Add a big sun!", add\_clouds "Add fluffy clouds!", add\_grass "Add some grass!", add\_flowers "Add flowers!", add\_rainbow "Add a rainbow!", add\_friend "Draw a friend for it!", add\_hat "Give it a hat!", add\_house "Draw a house!", add\_tree "Draw a tree!", add\_stars "Add twinkly stars!", add\_moon "Add the moon!", add\_bird "Add a bird!", add\_butterfly "Add a butterfly!", add\_fish "Add a fish!", add\_boat "Draw a boat!", add\_waves "Add waves!", add\_mountain "Draw a mountain!", add\_road "Draw a road!", add\_car "Add a car!", add\_balloon "Add a balloon!", add\_heart "Add a heart!", add\_stripes "Try some stripes!", add\_dots "Try polka dots!", use\_glitter "Try the glitter brush!", use\_neon "Try the glowing brush!", use\_rainbow "Try rainbow color!", color\_sky "Color the sky!", add\_eyes "Give it eyes!", add\_smile "Give it a big smile!", add\_ground "Draw the ground!", add\_snow "Make it snow!", add\_rain "Add raindrops!", add\_apple "Draw an apple!", add\_kite "Add a kite!", add\_frame "Draw a frame around it!", draw\_big "Draw something really big!", draw\_tiny "Draw something tiny!", add\_pet "Draw a pet!", add\_snack "Draw a yummy snack!", add\_music "Add music notes!"

**Request:** `{ ageMode, imageBase64 /* 512 px */ }`.

**Prompt:** system `Look at this child's drawing. Choose the ONE idea id from the list that would be the most fun next step. Return only JSON {"id": "<id>"}.` + the list as `id: text` lines.

**Steps:** parse → if `id` not in list → use `add_sun`. Return `{ id }`. App looks up text + voice locally. Once per 60 s; only when the kid taps the mascot (never interrupts).

## Feature 6 · Parent AI Digest — `ai-digest`

**When:** Parent zone dashboard opens and no digest exists for the current week (`app_meta` key `digest_<YYYY-Www>`). Shown as a card at the top of the dashboard; parent can tap "Refresh" once per week.

**Request:** `{ week: { minutesPerDay: number[7], dailyLimitMin: number, activities: Record<string, number> /* minutes */, artworkCount: number, newColorsNamed: number, lettersTraced: string[], storiesMade: number } }` — numbers only, computed on device; no images, no names.

**Prompt:** system `Write a warm, 3-4 sentence weekly note to a parent about their child's creative play. Use only the facts given. Mention one highlight and one gentle idea for real-world play. Do not give medical, developmental or diagnostic opinions. Do not lecture about screen time. Plain words.`

**Steps:** blocklist + moderation on output → return `{ text }`. Cache locally.

## Consent screen (Parent zone → Magic settings)

Shown once before first AI use; versioned (`consent_version = 1`). Must say, in plain words: what Magic does; that drawings (not photos of your child) and picked/spoken ideas are sent to our server and an AI provider to create results; that providers do not keep or train on them; that spoken audio never leaves the device (only the text); daily limits; that the parent can turn Magic off anytime (sets `revoked_at`). Buttons: "Turn on Magic" / "Not now". Store locally in `app_meta.ai_consent = '1'` and in `ai_consent`. The owner has the final wording reviewed by a privacy lawyer.

## Family Gallery — `family-gallery`

Parent zone → Family Gallery → "Create private link" → inserts `family_share` with a random 32-char token → shows link `https://<project>.supabase.co/functions/v1/family-gallery?t=<token>` with Share and "Turn off link" (sets `revoked_at`). Parent marks artworks with "Share with family" (sets `family_shared = 1`, uploads that PNG even if backup is off).

The function (GET, no login): look up token (not revoked) → list that family's shared artworks newest first (max 60) → return a simple HTML page: title "Our art", grid of images via 60-minute signed URLs, date under each, no kid names, `<meta name="robots" content="noindex">`. Invalid token → plain "This link is turned off." page.

## App client (`src/services/ai.ts`)

Export one function per feature: `makeColoringPage`, `magicSketch`, `makeStory`, `guessDrawing`, `getCoachIdea`, `getDigest`. Each: check online (`NetInfo` is not allowed — use a quick `fetch` to Supabase health with 3 s timeout), check `app_meta.ai_consent`, call the function, map `ok:false` codes to the mascot messages above. Hook `useAiStatus()` returns `{ online, consented, signedIn }` for dimming Magic tiles.

## Required tests

- Server (Deno test in `supabase/functions/_shared/*_test.ts`): guard returns each code correctly; cap counting; blocklist matches whole words only; coach rejects unknown ids; story JSON parse retry.
- App (Jest): `ai.ts` maps every error code to the right mascot line; image threshold function turns gray pixels to pure black/white.
