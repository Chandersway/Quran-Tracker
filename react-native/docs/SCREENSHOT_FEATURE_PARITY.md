# Original screenshot feature comparison

All six supplied original-app screenshots were opened and inspected. The machine-readable companion records their SHA-256 and concrete RN evidence. Native screenshots and interactions remain a separate acceptance gate.

| Original screenshot | Visible feature contracts | Current RN evidence |
|---|---|---|
| `WhatsApp Image 2026-11-13 at 23.07.10.jpeg` | Stats weekly activity and grouped history | `src/features/practice/StatsScreen.tsx:453`, `src/features/practice/StatisticsHistory.tsx:9`, `src/domain/statistics.ts:144` |
| `WhatsApp Image 2026-11-13 at 23.07.11.jpeg` | Statistics distribution circles | `src/features/practice/StatsScreen.tsx:42`, `src/features/practice/StatsScreen.tsx:303`, `src/features/practice/StatsScreen.tsx:571` |
| `WhatsApp Image 2026-11-13 at 23.07.11 (1).jpeg` | Home Today and independent reading-plan circles | `src/features/home/HomeScreen.tsx:128`, `src/features/home/HomeScreen.tsx:162`, `src/features/planning/ReadingPlanScreen.tsx:42` |
| `WhatsApp Image 2026-11-13 at 23.07.11 (2).jpeg` | Home Hizb chart and date filters | `src/features/home/HizbOverviewCard.tsx:17`, `src/features/home/HizbOverviewCard.tsx:81`, `src/domain/hizbAnalytics.ts:49` |
| `WhatsApp Image 2026-11-13 at 23.07.11 (3).jpeg` | Hizb independent Hifz score dialog | `src/features/practice/ProgressScreen.tsx:259`, `src/state/reducer.ts:284` |
| `WhatsApp Image 2026-11-13 at 23.07.11 (4).jpeg` | Home Hifz scope overview and review recommendations | `src/features/home/PracticeOverview.tsx:57`, `src/features/home/PracticeOverview.tsx:206`, `src/features/home/PracticeOverview.tsx:229` |

## Final native acceptance notes

- The screenshots are visual baselines, not proof that an RN workflow has been exercised. All six images were opened and visually inspected.
- Modern composition differs from the source, but no screenshot contract is counted as implemented solely from a route or label.
- Stats Hifdh mastery now uses a circular percentage ring with the original assessed-Hizb definition and explanation; final native comparison remains.
- The original 1/4, 2/4, 3/4 and 4/4 Rub summary labels are restored. Underlying legacy history markers remain unchanged.
- Hifz dialogs now include the continuous 0-100 slider, numeric input/presets, source clear/save/cancel actions and independent-score explanation. Clear immediately commits score 0 and dismisses, preserving reading and memorization flags.
- A new printed-page registration remains in the page bucket. Its known canonical range and recorded edition/page are displayed/opened without falsely counting a whole Surah, Hizb or Juz.
- The Hizb chart source helper text says full check-ins, but its active owner-scoped SQL counts all read/type=hizb registrations, including legacy fractional names. RN follows the query; it does not silently change historical counts.
- No account was created and no live OAuth, email, group message or push credential workflow was performed during this audit.
