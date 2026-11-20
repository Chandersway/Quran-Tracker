# Tracking and planning implementation handoff

Implemented on 17 November 2026 against the local Kotlin source. Original audit evidence remains unchanged; the updated synthetic probe writes a separate fixed-state report.

## Finding disposition

| Audit finding | Implementation and verification |
|---|---|
| 4: Juz/Rub repeat dialogs | `ProgressScreen.tsx` integrates the reader agent's `PartActionsSheet`; Juz/Rub have individual read actions and each Hizb card exposes all four quarter counts/actions. Existing bulk actions remain. Source removal semantics and the later page-checkbox toggle remain covered by existing tests. |
| 5: assessment age changes after reading | `reducer.ts` preserves an existing progress row's `lastUpdated` during ordinary read increments. `tracking-parity.test.ts` checks actual Surah/Juz read/unmark paths, score preservation, and unchanged overdue advice. |
| 5: tint setting and long press | `hifzPresentation.ts` provides the ten original score buckets, excluding unassessed zero scores. Practice and Home consume `preferences.hifzColorsEnabled`; disabled returns neutral styling. Juz/Hizb/Surah Practice titles support long-press score editing. Root supplies preference persistence/settings; reader agent consumes the same helper for Quran cards. |
| 5/8: Home mean | `PracticeOverview.tsx` uses all explicit Surah/Hizb/Juz assessments through `averageAssessmentScore`, independently of the selected browsing category. Existing Stats mastery remains Hizb-only. A real Home callback test changes category and confirms the mean stays 57 for scores 30/50/90. |
| 6: double submit, early success, failed persistence | `usePracticeSave.ts` synchronously locks submission, caches its exact action across failed writes, waits for `commit`, and retains error/retry state. Quick check and bulk Practice commit one `checkIn/batch`. Success callback/notice and close happen only after durability. Captured owner IDs are supplied; saving is disabled while ownership is unresolved. Root's store rejects stale explicit owners. Real callback tests invoke the same stale handler twice before rendering, reject storage, retry, and reopen for a deliberate new reading. |
| 7: full-Hizb chart contract | Preserved. A multi-Hizb callback test verifies one batch, one history row per selected Hizb, and four Rub count increments per Hizb. No four-Rub history aggregation was added. |
| 8: weekly activity population and window | `weeklyHistoryActivity` includes every history action after the rolling seven-day cutoff and groups by stored date. The modern Stats layout consumes this helper, retains its empty-state copy, and leaves read-only rings and optional visual patterns intact. Tests check the cutoff and that rings still exclude memorized/review rows. |
| 9: checklist | No missing implementation identified; untouched. Existing independent coverage/stoppoint/reset behavior remains. |
| 10: Focus/fullscreen | No implementation change. The later fullscreen suppression of the floating timer remains intentional. |
| 11: plan identity | Shared `planIdentity` includes goal ID, date, type, reference, and sub-ID. Agenda UI, Goals duplicate checks, and reducer use it. Reducer tests retain all three intentions and reject only the same-intention duplicate. |
| 11: registration timestamp and default unit | `goalRegistrationTimestamp` keeps the real current clock on the chosen valid local date. Both fresh and linked Goals entries use it. Whole selected Surah/Hizb/Juz is now the default quantity; optional measured units remain available explicitly. Real Goals callback tests verify one whole Surah for a pages goal and the timestamp used by reading-plan accounting. |
| 12: reading plan misses same-day goal entries | Fixed at the Goals producer. `readingPlan.ts` already had the correct start-time predicate and remains unchanged. The probe now returns one Hizb when a 14:00 plan receives an 18:00 Goals entry. |
| 13: reminder presets and completion | Agenda restores Now/+30 minutes/Tonight clock presets. Now on today stores an exact `reminderDueAt` five seconds ahead through the normal permission, quiet-hours/category, and reconciliation path. `planningReminders.ts` includes that timestamp in identity and eligibility. Direct completion and goal-linked completion clear hour/minute/notification ID/exact time, so undo cannot reactivate it. Tests exercise the actual Now callback and normal completion/cancellation eligibility. |

## Shared integration changes

- `src/state/reducer.ts` is updated for the above behavior, `checkIn/batch`, and the reader agent's validated per-Surah cursor persistence (`surahPositions`).
- Root owns `src/state/store.tsx`, `src/state/models.ts`, decoder changes, and the appearance settings. Those integrations were present during the final tracking tests.
- Reader agent owns `PartActionsSheet.tsx` and Quran list integration. This handoff covers its use from Practice.

## Changed source files

- `src/domain/{agenda,goalRegistration,goals,hifz,hifzPresentation,planning,statistics}.ts`
- `src/state/reducer.ts`
- `src/features/practice/hooks/usePracticeSave.ts`
- `src/features/practice/components/{QuickCheckInSheet,ReadingStatisticsOverview}.tsx`
- `src/features/practice/screens/{GoalsScreen,ProgressScreen}.tsx`
- `src/features/planning/screens/PlanningScreen.tsx`
- `src/features/home/components/PracticeOverview.tsx`
- `src/services/notifications/planningReminders.ts`

## Verification

`tests/tracking-parity.test.ts` adds seven domain regressions. `tests/tracking-ui.test.ts` adds six real-component callback tests, using `tests/helpers/componentHarness.ts` to replace native rendering only. Store and reducer mutations are real; synthetic deferred/rejected persistence is injected deliberately.

The targeted run passed **66 tests**, including those two files plus `agenda`, `reading-plan`, `hifz-motivation`, `quick-check-in`, `planning-reminders`, `reducer`, `goals`, `statistics`, `progress-actions`, and `mushaf-reading-toggle` tests. Targeted ESLint passes; changed source/tests are formatted.

`npx tsx .tooling/parity-date-tracking-probe.ts` passes and writes `.tooling/parity-date-tracking-fixed-probe.json`: actual entry hour 18, all goal IDs `[1,2,3]`, reminder cleared/no reminder after undo, and unchanged Hifz assessment date/advice. Historical audit JSON is preserved.

Native taps, screen-reader interaction, physical storage exhaustion, timer lifecycle, and actual OS notification delivery were not exercised by these synthetic tests. No live reminders were sent. Root owns final integrated typecheck/native verification; the last typecheck during this handoff only reported the reader agent's in-progress `reader-parity.test.ts` narrow fixture types.
