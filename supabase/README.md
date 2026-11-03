# Doodle Den · Supabase

Backend for the parent account, backup/sync, server time and AI Magic (A3, A4, A7). Kids never sign in.

## Setup

```bash
supabase start            # local stack
supabase db reset         # runs migrations/0001_core.sql then 0002_ai.sql
supabase functions serve  # local edge functions
deno test --allow-env supabase/functions/_shared   # server unit tests
```

- `0001_core.sql`: family, kid_profile, time_rule, usage_day, artwork + RLS (each parent sees only their family), `server_now()` granted to `anon`, private `art` bucket with owner-only storage policies (path `<family_id>/<kid_id>/<artwork_id>.png`, signed URLs only).
- `0002_ai.sql`: `app_config` (`ai_free_for_all`, `ai_caps_per_day`), `ai_consent`, `ai_usage`, `family_share`, `family.ai_entitled`, `artwork.family_shared`.

## Functions

| Function | Auth | Purpose |
| --- | --- | --- |
| `ai-coloring-page`, `ai-magic-sketch`, `ai-story`, `ai-guess`, `ai-coach`, `ai-digest` | parent JWT | A7 features through `_shared/handler.ts` (guard → validate → moderate → provider → moderate → `ai_usage`) |
| `rc-webhook` | `RC_WEBHOOK_SECRET` header | RevenueCat → `family.ai_entitled` |
| `family-gallery` | token in `?t=` | read-only HTML page of shared art |

Deploy `family-gallery` and `rc-webhook` with `--no-verify-jwt`.

## Secrets (set with `supabase secrets set KEY=value`)

| Secret | Default | Notes |
| --- | --- | --- |
| `AI_TEXT_PROVIDER` | `anthropic` | text + vision |
| `AI_TEXT_MODEL` | `claude-haiku-5-5` | |
| `AI_TEXT_API_KEY` | — | required for AI |
| `AI_IMAGE_PROVIDER` | `openai` | image generate + edit |
| `AI_IMAGE_MODEL` | `gpt-image-1` | owner confirms the current model name before launch |
| `AI_IMAGE_API_KEY` | — | also used for moderation |
| `AI_MODERATION_PROVIDER` | `openai` | |
| `RC_WEBHOOK_SECRET` | random string | same value in the RevenueCat dashboard |
| `COST_COLORING_PAGE`, `COST_MAGIC_SKETCH`, `COST_STORY`, `COST_GUESS`, `COST_COACH`, `COST_DIGEST` | 0 | estimated USD per call |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by the platform. Never put any of these in the app.

## Switches

- Start charging for AI: `update app_config set value = 'false' where key = 'ai_free_for_all';`
- Caps: edit `ai_caps_per_day` (digest is counted over 7 days).
- Providers must be zero-retention accounts (owner confirms before launch).

## Lists to keep in step with the app

`_shared/aiIdeaTiles.json` = `src/content/aiIdeaTiles.json`; `_shared/coachIdeas.json` ids = `src/content/coachIdeas.json`; `_shared/blocklist.ts` ≈ `src/content/blocklist.ts`.

## Deployed state (project `oagidmdqcnwiuaavssie`, "Doodle-Den", us-east-1)
- Migrations applied via the Supabase connector: `0001_core`, `0002_ai`, `0003_hardening` (parents cannot set `plan` / `ai_entitled`; no anon table access; `server_now()` search_path pinned).
- The app calls one router function `ai` (`supabase/functions/ai/index.ts`) at `/functions/v1/ai/<ai-feature-name>`; the per-feature folders stay for reference/tests.
- Deploy functions: `supabase link --project-ref oagidmdqcnwiuaavssie && supabase functions deploy ai family-gallery rc-webhook delete-account` then `supabase functions deploy family-gallery rc-webhook --no-verify-jwt` (gallery is a public page; webhook checks `RC_WEBHOOK_SECRET`).
