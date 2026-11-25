# Source copy review

The source catalog contains 1712 semantic/structured source entries and the raw literal inventory preserves all 11784 UI-source literals with source locations.

TypeScript AST inspection found 878 controlled UI text references; 54 still need source reconciliation or explicit review as genuinely new functional copy. This is an open review list, not a claim of full localization parity. Unknown text remains visible instead of being silently machine translated.

`new-ui-copy.json` explicitly separates necessary new RN affordances and API-only operational panels from the curated Kotlin wording. No new marketing prose is canonical.

| Screen | Line | Text needing reconciliation |
|---|---:|---|
| `src/features/account/AccountScreen.tsx` | 717 | W |
| `src/features/account/NotificationsScreen.tsx` | 48 | Quiet starts (minutes after midnight) |
| `src/features/account/NotificationsScreen.tsx` | 49 | Quiet ends (minutes after midnight) |
| `src/features/account/NotificationsScreen.tsx` | 57 | Mute duration |
| `src/features/account/NotificationsScreen.tsx` | 58 | 1 hour |
| `src/features/account/NotificationsScreen.tsx` | 59 | 8 hours |
| `src/features/account/NotificationsScreen.tsx` | 60 | Until I turn it back on |
| `src/features/account/NotificationsScreen.tsx` | 61 | Device push |
| `src/features/account/NotificationsScreen.tsx` | 63 | Register this phone for group reply notifications. Permission is requested only when you press the button. |
| `src/features/account/NotificationsScreen.tsx` | 64 | Enable push on this device |
| `src/features/account/NotificationsScreen.tsx` | 65 | Unregister this device |
| `src/features/account/NotificationsScreen.tsx` | 66 | This device is registered for group replies. |
| `src/features/account/NotificationsScreen.tsx` | 70 | Online notification preferences are not configured. Local choices stay on this device. |
| `src/features/account/NotificationsScreen.tsx` | 71 | Loading your groups… |
| `src/features/account/NotificationsScreen.tsx` | 73 | No reading groups yet |
| `src/features/account/NotificationsScreen.tsx` | 76 | Push registration needs an installed Android or iOS build on a physical device. |
| `src/features/account/NotificationsScreen.tsx` | 77 | Device push is not configured yet. Add the platform credentials before enabling it. |
| `src/features/account/NotificationsScreen.tsx` | 82 | On |
| `src/features/account/NotificationsScreen.tsx` | 393 | Groepsmeldingen per type |
| `src/features/account/NotificationsScreen.tsx` | 395 | أنواع إشعارات المجموعة |
| `src/features/account/NotificationsScreen.tsx` | 396 | Group notification types |
| `src/features/account/SettingsScreen.tsx` | 17 | System |
| `src/features/account/SettingsScreen.tsx` | 27 | Text |
| `src/features/account/SettingsScreen.tsx` | 30 | Muhammadi |
| `src/features/account/SettingsScreen.tsx` | 34 | Every day at |
| `src/features/account/SettingsScreen.tsx` | 35 | Earlier |
| `src/features/account/SettingsScreen.tsx` | 36 | Later |
| `src/features/account/SettingsScreen.tsx` | 250 | Meldingen en stille uren |
| `src/features/account/SettingsScreen.tsx` | 252 | الإشعارات وساعات الهدوء |
| `src/features/account/SettingsScreen.tsx` | 253 | Notifications and quiet hours |
| `src/features/groups/GroupEventsPanel.tsx` | 194 | ${t('groups.events.dateLabel')} · YYYY-MM-DD |
| `src/features/groups/GroupEventsPanel.tsx` | 201 | ${t('groups.events.timeLabel')} · HH:MM |
| `src/features/quran/MushafLibraryScreen.tsx` | 21 | Mushaf library |
| `src/features/quran/MushafLibraryScreen.tsx` | 23 | Select |
| `src/features/quran/MushafLibraryScreen.tsx` | 24 | Selected |
| `src/features/quran/MushafLibraryScreen.tsx` | 25 | Included |
| `src/features/quran/MushafLibraryScreen.tsx` | 26 | Local package |
| `src/features/quran/MushafLibraryScreen.tsx` | 27 | Downloaded |
| `src/features/quran/MushafLibraryScreen.tsx` | 28 | Not downloaded |
| `src/features/quran/MushafLibraryScreen.tsx` | 29 | Checking downloads… |
| `src/features/quran/MushafLibraryScreen.tsx` | 30 | Downloaded pages |
| `src/features/quran/MushafLibraryScreen.tsx` | 31 | Cancel download |
| `src/features/quran/MushafLibraryScreen.tsx` | 32 | Remove download |
| `src/features/quran/MushafLibraryScreen.tsx` | 33 | Download this Mushaf? |
| `src/features/quran/MushafLibraryScreen.tsx` | 34 | Page packages can require about 60–70 MB. PDF sizes vary. |
| `src/features/quran/MushafLibraryScreen.tsx` | 35 | Remove this download? |
| `src/features/quran/MushafLibraryScreen.tsx` | 36 | The downloaded files for this edition will be removed from this device. |
| `src/features/quran/MushafLibraryScreen.tsx` | 37 | Download could not be completed. Check your connection and storage, then retry. |
| `src/features/quran/MushafLibraryScreen.tsx` | 38 | Downloads are available in the mobile app. |
| `src/features/quran/MushafLibraryScreen.tsx` | 39 | Downloading |
| `src/features/study/BooksScreen.tsx` | 60 | About this book |
| `src/features/study/BooksScreen.tsx` | 64 | Page {page} / {total} |
| `src/features/study/BooksScreen.tsx` | 69 | {count} results |
| `src/features/study/BooksScreen.tsx` | 71 | Open book |
