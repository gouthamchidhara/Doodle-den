# Compliance (T-102)

## Dependency scan
- [x] No ads, analytics, attribution or crash-reporting SDKs in `package.json` (checked: no firebase, sentry, amplitude, mixpanel, segment, appsflyer, adjust, admob, facebook). RevenueCat (purchases) and Supabase (parent account, backup, AI) are the only network SDKs, both used only after a parent action.
- [x] No third-party links or social sharing reachable by a kid; all external links, purchases and the share sheet sit behind the Parent Gate.

## iOS privacy manifest
- [x] `ios.privacyManifests` in `app.config.ts` → `PrivacyInfo.xcprivacy`: tracking false, no tracking domains, collected data = email (parent account) and photos (backed-up drawings), both linked, app functionality only; required-reason APIs: UserDefaults CA92.1, FileTimestamp C617.1, SystemBootTime 35F9.1, DiskSpace E174.1.

## Google Play Data safety (answers)
- Data collected: Email address (optional parent account, app functionality, not shared); Photos (drawings, only when the parent turns on backup or Family Gallery; app functionality; not shared). Data encrypted in transit: yes. Users can request deletion: yes (Account → Delete all data).
- No location, contacts, device IDs, advertising ID. Declare "Does not use advertising ID".
- Families policy: target audience 3–8 (+ parents); no ads; Teacher Approved not requested.

## Apple Kids Category checklist
- [x] No third-party analytics or advertising.
- [x] Parental gate (hold + PIN) before links out, purchases and settings.
- [x] Kid nickname only, never a full name; no kid data leaves the device without the parent's consent.
- [x] AI Magic needs a parent account + explicit consent; prompts are moderated and blocklisted server-side (A7).
- [x] Camera/microphone purpose strings written for parents.
- [ ] Owner: privacy policy and support URLs in `src/content/links.ts` (placeholders now) and in App Store Connect.

Owner sign-off: ______________________  Date: __________
