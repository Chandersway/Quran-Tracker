# Comparison with the supplied original screens

The six original images in `C:/Users/Karma/Pictures/pcmo/oldapp` were inspected on 13 November 2026. They are reference evidence, not screenshots of the new build. The implementation uses the current light/dark visual system and preserves the original information and actions rather than reproducing the old colors.

| Original image | Observed feature | Current source / verification |
| --- | --- | --- |
| `23.07.11 (1)` | Dashboard Today: daily goal circular progress, completed amount, quick check-in, today's planning, reading-plan ring. | Home uses `progressForGoal` and a real-data ring, opens the Goals recording sheet directly, shows today's plans and an independent reading-plan ring. Requires final native verification. |
| `23.07.11 (2)` | Reading-plan card followed by Hizb overview with week, month, year and custom periods, scrollable chart and detail. | `ReadingPlanHomeCard` uses the persisted plan and reading history; `HizbOverviewCard` provides source periods, 60 entries and details. Requires final native verification. |
| `23.07.11 (4)` | Hifz summary and independent scores by Surah, Hizb or Juz, including weaker/stronger items. | `PracticeOverview` computes from explicit independent assessments and offers score editing. Requires final native verification. |
| `23.07.11 (3)` | Individual Hizb score dialog, explaining score 0 and preservation of reading marks. | Hifz score editor is separate from read marks in the progress screen. Requires final native verification of the dialog and both states. |
| `23.07.11` | Stats period control and stacked circular distributions with registration counts, percentages, and registration detail. | The shared statistics overview now renders all three source distributions together, with counts, percentages and registration drilldowns. Requires final native verification. |
| `23.07.10` | Seven-day activity chart and reading history grouped by day/week/month, with precise ranges and Arabic opening where available. | Stats now provides day/week/month grouped expandable history, exact ranges and Arabic openings where available. Requires final native verification. |

The three primary navigation destinations remain Statistics, printed Mushaf and Groups; other original destinations are available under More. Group data and native/iOS behavior are not proven by these screenshots.
