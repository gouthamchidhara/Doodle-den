# Store submission checklist (T-104 / T-105)

## Builds (T-104)
1. `npm i -g eas-cli && eas login && eas init` (writes the EAS project id into the config).
2. Set secrets in EAS (never in git): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_RC_IOS_KEY`, `EXPO_PUBLIC_RC_ANDROID_KEY`.
3. Preview to test devices: `eas build -p all --profile preview`.
4. Production: `eas build -p all --profile production`, then `eas submit -p ios` (TestFlight; set `ascAppId` in `eas.json`) and `eas submit -p android` (internal track; upload the first AAB by hand in Play Console).
5. iOS Screen Time: keep `EXPO_PUBLIC_IOS_SCREEN_TIME=false` until Apple grants the Family Controls entitlement, then set it to `true` in the production profile.

## Beta loop (T-105)
- TestFlight + Play internal testing with 5–10 families for 1–2 weeks; log issues in GitHub; fix → new build. Run `npx tsc --noEmit && npx expo lint && npx jest` before each build.

## App Store
- Name: Sleepy Crayons · Bundle: com.gpc.doodleden · Team: KSD8FCH7C9 · Category: Kids (Ages 6–8; or 5 and under) + Education.
- Screenshots: iPad 13" (Home, Free Draw, Coloring, Aquarium, Gallery, Parent zone), iPhone 6.9" (same set). No prices or "free" text inside screenshots.
- Age rating answers: all "None"; Unrestricted web access: No; Parental controls: Yes; Age assurance: parental gate.
- Privacy nutrition label: matches `docs/COMPLIANCE.md` (email + photos, linked, not used for tracking).
- Review notes: "Settings, purchases, links and sharing are behind a parental gate (press and hold, then a 4-digit PIN; test PIN set on first launch). Screen Time (Family Controls) is used only to let a parent lock other apps when play time ends; it is optional and set up in Parent zone → Device lock. AI features need a parent account and explicit consent; images are moderated server-side."
- In-app purchases: Family monthly + yearly, entitlement `family` in RevenueCat; attach to the version.

## Google Play
- Target audience: 5 and under, 6–8 (Families policy). Ads: No. Data safety: see `docs/COMPLIANCE.md`.
- Content rating questionnaire: no violence, no user communication between users, no location.
- Store listing: short + full description, feature graphic 1024×500, tablet screenshots 7" and 10".

## Before pressing Submit
- [ ] Real privacy/support URLs in `src/content/links.ts`.
- [ ] Final icon/splash (CONTENT_TODO).
- [ ] Supabase project migrated (`supabase db push`), functions deployed, secrets set (`supabase/README.md`), Deno tests run.
- [ ] RevenueCat products + webhook URL configured.
- [ ] Performance table in `docs/PERFORMANCE.md` filled in.
- [ ] Device checks in `docs/ACCESSIBILITY.md` ticked.
- [ ] Owner sign-off in `docs/COMPLIANCE.md`.
