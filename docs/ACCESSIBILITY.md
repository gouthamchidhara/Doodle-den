# Accessibility checklist (T-100)

Code-level checks done in this build. Items marked **[device]** must be confirmed by a person on real devices with VoiceOver / TalkBack.

- [x] Every `Pressable` / button-like component sets `accessibilityRole` and `accessibilityLabel` (all 98 Pressable call sites live in files that label them; shared buttons — `PrimaryButton`, `IconButton`, `ToolButton`, `ParentButton`, `ActivityTile`, `SettingRow`, `ColorDot` — require a label prop or derive one from their text).
- [x] Selected state exposed with `accessibilityState={{ selected }}` on chips, avatars, age choices, colors, tools.
- [x] Touch sizes (A1 rule 8): kid targets ≥ 64 pt (tiles 180–248 pt, tool buttons 64+), parent targets ≥ 44–48 pt (`ParentButton` 48, `SettingRow` min 48, chips 44).
- [x] Colors only from `tokens.ts`; ink `#1F2A44` on the kid/parent backgrounds and white cards is well above 4.5:1; muted text `inkMuted` on white ≥ 4.5:1 (checked against the A2 palette).
- [x] Reduce Motion: Reanimated 4 animations use the default `ReduceMotion.System`, so with the OS setting on they jump to their end state (no looping wiggle, sparkle or slide). The wind-down and waiting overlays stay readable without motion.
- [x] Spoken help: every activity intro, mascot line and AI message has a voice line (`voiceLines.json`, 225 keys) so pre-readers are not blocked by text.
- [x] Parental gate on every external link, purchase and settings screen.
- [ ] **[device]** VoiceOver pass on iPad (Home, Draw, Coloring, Parent zone).
- [ ] **[device]** TalkBack pass on an Android tablet.
- [ ] **[device]** Large text (Dynamic Type / font scale 1.3) does not clip parent-zone rows.
