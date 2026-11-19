# Volledige bronindex

Gegenereerd met `node scripts/build-code-reference.mjs`. Dit is de vindplaats van bestanden, benoemde functies, klassen, interfaces en types; **het bestaan van een naam bewijst geen functionele gelijkwaardigheid**. De inhoudelijke beoordeling staat in de deelrapporten van deze controle.

198 oorspronkelijke Kotlin-bestanden, 584 React Native-bron-/test-/toolbestanden en 51 Supabase-bron-/migratie-/testbestanden. Gegenereerde Android/iOS-projecten, dependencies en buildcaches zijn uitgesloten. Kotlin-declaraties worden lexicaal gevonden buiten commentaar en strings; TypeScript/JavaScript-declaraties worden met de compiler-AST gelezen. Anonieme callbacks zijn geen afzonderlijk benoemde functie. Overige native bronnen hebben een lexicale typenindex; niet alle native methoden worden afzonderlijk ontleed. SQL staat op bestandsniveau in deze index; tabellen, RPC's en rechten worden inhoudelijk uitgelegd in de backendhandleiding.

De [JSON-index](source-index.json) bevat de volledige lijst, regelverwijzingen, rollen, hashes, routes en persistente voorkeuren. Dit is geen lijst waarin iedere bronregel een aparte feature is. Gebruik de bronlink om de volledige implementatie te lezen.

## Persistente appvoorkeuren

| Sleutel | Type/waarden | Bron |
| --- | --- | --- |
| `language` | `Language` | [models.ts:11](../../src/state/models.ts#L11) |
| `theme` | `ThemeMode` | [models.ts:12](../../src/state/models.ts#L12) |
| `cardPatterns` | `boolean` | [models.ts:13](../../src/state/models.ts#L13) |
| `hifzColorsEnabled` | `boolean` | [models.ts:14](../../src/state/models.ts#L14) |
| `translation` | `TranslationChoice` | [models.ts:15](../../src/state/models.ts#L15) |
| `arabicFontSize` | `number` | [models.ts:16](../../src/state/models.ts#L16) |
| `reciterId` | `number` | [models.ts:17](../../src/state/models.ts#L17) |
| `audioPlaybackSpeed` | `number` | [models.ts:18](../../src/state/models.ts#L18) |
| `audioSkipIntervalSeconds` | `5 \| 10` | [models.ts:19](../../src/state/models.ts#L19) |
| `audioRepeatEnabled` | `boolean` | [models.ts:20](../../src/state/models.ts#L20) |
| `audioAutoplayEnabled` | `boolean` | [models.ts:21](../../src/state/models.ts#L21) |
| `audioRepeatHafsReciter` | `string` | [models.ts:22](../../src/state/models.ts#L22) |
| `audioRepeatWarshReciter` | `string` | [models.ts:23](../../src/state/models.ts#L23) |
| `audioRepeatRounds` | `number` | [models.ts:24](../../src/state/models.ts#L24) |
| `bookPresentation` | `BookPresentation` | [models.ts:25](../../src/state/models.ts#L25) |
| `mushaf` | `\| 'text'     \| 'hafs_ayahinfo_1260'     \| 'warsh_maknoon'     \| 'muhammadi'     \| 'hafs_maknoon'     \| 'hafs_madina_pdf'     \| 'hafs_indopak_15'` | [models.ts:26](../../src/state/models.ts#L26) |
| `onboardingComplete` | `boolean` | [models.ts:34](../../src/state/models.ts#L34) |
| `onboardingStep` | `string` | [models.ts:35](../../src/state/models.ts#L35) |
| `reminderEnabled` | `boolean` | [models.ts:36](../../src/state/models.ts#L36) |
| `reminderHour` | `number` | [models.ts:37](../../src/state/models.ts#L37) |
| `reminderMinute` | `number` | [models.ts:38](../../src/state/models.ts#L38) |
| `displayName` | `string` | [models.ts:39](../../src/state/models.ts#L39) |
| `dockDestinations` | `DockDestinationId[]` | [models.ts:40](../../src/state/models.ts#L40) |

Dit model is niet de volledige lijst instellingen: servergebonden groeps-/meldingsvoorkeuren en zelfstandig opgeslagen leesplannen hebben een eigen opslagcontract. Die worden in de technische handleidingen apart beschreven.

## Oorspronkelijke Kotlin

### app/src/androidTest/java/com/Ameender/qurantracker/AndroidTargetCompatibilityTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/AndroidTargetCompatibilityTest.kt), 16 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AndroidTargetCompatibilityTest` | [7](../../../app/src/androidTest/java/com/Ameender/qurantracker/AndroidTargetCompatibilityTest.kt#L7) |
| fun | `packagedAppTargets36WithoutDroppingOlderDevicesOrChangingIdentity` | [8](../../../app/src/androidTest/java/com/Ameender/qurantracker/AndroidTargetCompatibilityTest.kt#L8) |

### app/src/androidTest/java/com/Ameender/qurantracker/ExampleInstrumentedTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ExampleInstrumentedTest.kt), 24 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ExampleInstrumentedTest` | [17](../../../app/src/androidTest/java/com/Ameender/qurantracker/ExampleInstrumentedTest.kt#L17) |
| fun | `useAppContext` | [19](../../../app/src/androidTest/java/com/Ameender/qurantracker/ExampleInstrumentedTest.kt#L19) |

### app/src/androidTest/java/com/Ameender/qurantracker/data/HizbCheckInDatabaseTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/HizbCheckInDatabaseTest.kt), 109 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `HizbCheckInDatabaseTest` | [16](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/HizbCheckInDatabaseTest.kt#L16) |
| fun | `resetClearsHistoryAndReadingProgressButKeepsHifz` | [17](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/HizbCheckInDatabaseTest.kt#L17) |
| fun | `aggregateObserverRefreshesAfterCommit` | [41](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/HizbCheckInDatabaseTest.kt#L41) |
| fun | `atomicBatchIdempotencyAndAccountRangeIsolation` | [55](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/HizbCheckInDatabaseTest.kt#L55) |
| fun | `accountChangeRollsBackAndSinglesHaveOwnership` | [80](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/HizbCheckInDatabaseTest.kt#L80) |
| fun | `clearHistoryOnlyWithExplicitDeviceTestArgument` | [102](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/HizbCheckInDatabaseTest.kt#L102) |

### app/src/androidTest/java/com/Ameender/qurantracker/data/LanguageEntryStoreTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/LanguageEntryStoreTest.kt), 61 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `LanguageEntryStoreTest` | [10](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/LanguageEntryStoreTest.kt#L10) |
| fun | `preferencesAndPendingStageSurviveStoreRecreation` | [11](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/LanguageEntryStoreTest.kt#L11) |
| fun | `getSharedPreferences` | [15](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/LanguageEntryStoreTest.kt#L15) |

### app/src/androidTest/java/com/Ameender/qurantracker/data/NoteScopesMigrationTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/NoteScopesMigrationTest.kt), 79 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `NoteScopesMigrationTest` | [17](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/NoteScopesMigrationTest.kt#L17) |
| fun | `version16MigratesWithoutLosingNotesAndAllScopesRoundTrip` | [18](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/NoteScopesMigrationTest.kt#L18) |
| fun | `onCreate` | [24](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/NoteScopesMigrationTest.kt#L24) |
| fun | `onUpgrade` | [32](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/NoteScopesMigrationTest.kt#L32) |

### app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt), 85 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PendingNavigationStoreTest` | [12](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L12) |
| fun | `groupPushSurvivesAuthButRejectsInvalidEvent` | [13](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L13) |
| fun | `isolated` | [24](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L24) |
| fun | `getSharedPreferences` | [28](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L28) |
| fun | `link` | [32](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L32) |
| fun | `invitationSurvivesAuthLauncherAndRecreationUntilConsumed` | [34](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L34) |
| fun | `onlyRecognizedLinksAreDeliveredAndNotificationIsIndependent` | [48](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L48) |
| fun | `staleCompletionDoesNotDiscardNewerLink` | [64](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L64) |
| fun | `malformedLinksCannotReplacePendingInvitation` | [74](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/PendingNavigationStoreTest.kt#L74) |

### app/src/androidTest/java/com/Ameender/qurantracker/data/ReadingChecklistStoreTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/ReadingChecklistStoreTest.kt), 35 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingChecklistStoreTest` | [9](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/ReadingChecklistStoreTest.kt#L9) |
| fun | `persistsChecksUndoAndSeparatePositionAcrossInstances` | [10](../../../app/src/androidTest/java/com/Ameender/qurantracker/data/ReadingChecklistStoreTest.kt#L10) |

### app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushDeviceSmokeTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushDeviceSmokeTest.kt), 20 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupPushDeviceSmokeTest` | [12](../../../app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushDeviceSmokeTest.kt#L12) |
| fun | `refreshDeviceToken` | [13](../../../app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushDeviceSmokeTest.kt#L13) |

### app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushMuteTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushMuteTest.kt), 42 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupPushMuteTest` | [15](../../../app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushMuteTest.kt#L15) |
| fun | `muteRemovesOnlyTheSelectedGroupsNotifications` | [16](../../../app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushMuteTest.kt#L16) |
| fun | `show` | [24](../../../app/src/androidTest/java/com/Ameender/qurantracker/notifications/GroupPushMuteTest.kt#L24) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupCommentDeletionTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupCommentDeletionTest.kt), 53 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupCommentDeletionTest` | [11](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupCommentDeletionTest.kt#L11) |
| fun | `deleteConfirmationIsSeparateFromSheetAndSupportsRetry` | [14](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupCommentDeletionTest.kt#L14) |
| fun | `request` | [38](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupCommentDeletionTest.kt#L38) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupFeedRedesignTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupFeedRedesignTest.kt), 90 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupFeedRedesignTest` | [24](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupFeedRedesignTest.kt#L24) |
| fun | `commentsAreCollapsedAndActionsWorkInAllLanguages` | [26](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupFeedRedesignTest.kt#L26) |
| fun | `capture` | [83](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupFeedRedesignTest.kt#L83) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupLogoTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupLogoTest.kt), 57 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupLogoTest` | [19](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupLogoTest.kt#L19) |
| fun | `overviewLogoLoadsPerGroupAndDoesNotInterceptOpeningGroup` | [22](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupLogoTest.kt#L22) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupMemberReadingUiTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupMemberReadingUiTest.kt), 28 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupMemberReadingUiTest` | [10](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupMemberReadingUiTest.kt#L10) |
| fun | `tapMemberShowsSharedReadingAndCloses` | [13](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/GroupMemberReadingUiTest.kt#L13) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/HizbMultiSelectTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/HizbMultiSelectTest.kt), 91 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `HizbMultiSelectTest` | [14](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/HizbMultiSelectTest.kt#L14) |
| fun | `selectDeselectAndScrollThroughAllSixty` | [17](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/HizbMultiSelectTest.kt#L17) |
| fun | `hizbStepperAndMultipleSelectionShareSaveAction` | [50](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/HizbMultiSelectTest.kt#L50) |
| fun | `chartScrollAndTouchWorkInRtl` | [77](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/HizbMultiSelectTest.kt#L77) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt), 182 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `IrabScreenTest` | [15](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L15) |
| fun | `fixtureIndex` | [16](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L16) |
| fun | `browserAyahMenuOnlyOffersIndexedAyahs` | [20](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L20) |
| fun | `linkedVerseOnlyOffersItsAvailableBook` | [30](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L30) |
| fun | `unavailableVerseOffersNoBooksAndMakesNoContentRequest` | [37](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L37) |
| fun | `asbabExplicitBookSwitchPreservesAyahAndClearsOldText` | [46](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L46) |
| fun | `asbabNetworkFailureShowsNoRawDetailsAndCanRetry` | [61](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L61) |
| fun | `asbabArabicLargeTextDarkSourceAndDisclaimerReachable` | [77](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L77) |
| fun | `ayahToolbarAsbabActionIsReachable` | [91](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L91) |
| fun | `asbabWarshUsesEachLinkedReferenceAndWahidi` | [101](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L101) |
| fun | `asbabUsesWahidiAndShowsHonestEmptyState` | [114](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L114) |
| fun | `excerpt` | [127](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L127) |
| fun | `opensExactAyahAndCloses` | [128](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L128) |
| fun | `missingBookRequiresExplicitAlternative` | [139](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L139) |
| fun | `rateLimitCanRetryAndInvalidInputCannotLoad` | [148](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L148) |
| fun | `warshMultipleReferencesArabicLargeTextDark` | [160](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L160) |
| fun | `slowRequestDisablesDuplicateSubmission` | [174](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/IrabScreenTest.kt#L174) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/LanguageSelectionScreenTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/LanguageSelectionScreenTest.kt), 73 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `LanguageSelectionScreenTest` | [23](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/LanguageSelectionScreenTest.kt#L23) |
| fun | `selectionUpdatesTranslationDirectionAndContinue` | [26](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/LanguageSelectionScreenTest.kt#L26) |
| fun | `darkArabicLargeTextRemainsScrollableAndSelectable` | [48](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/LanguageSelectionScreenTest.kt#L48) |
| fun | `screenshot` | [65](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/LanguageSelectionScreenTest.kt#L65) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/NotificationTimePickerTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/NotificationTimePickerTest.kt), 38 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `NotificationTimePickerTest` | [14](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/NotificationTimePickerTest.kt#L14) |
| fun | `chooseConfirmValidateAndCancelInAllLanguages` | [16](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/NotificationTimePickerTest.kt#L16) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingActivityIntegrationTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingActivityIntegrationTest.kt), 104 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingActivityIntegrationTest` | [24](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingActivityIntegrationTest.kt#L24) |
| fun | `withEntry` | [27](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingActivityIntegrationTest.kt#L27) |
| fun | `firstRunRestoresProgressCompletesAndMenuReplayKeepsCompletion` | [59](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingActivityIntegrationTest.kt#L59) |
| fun | `skipPersistsAndExistingUserBypassesIntro` | [81](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingActivityIntegrationTest.kt#L81) |
| fun | `existingUserOpensNormalApp` | [88](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingActivityIntegrationTest.kt#L88) |
| fun | `malformedAuthCallbackDoesNotLockExistingAppInLoading` | [95](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingActivityIntegrationTest.kt#L95) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt), 103 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingFocusPreviewTest` | [23](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt#L23) |
| fun | `show` | [27](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt#L27) |
| fun | `toggle` | [40](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt#L40) |
| fun | `startPauseResumeAndLeavingResetDemo` | [41](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt#L41) |
| fun | `smallDarkScreenAndThreeLanguages` | [63](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt#L63) |
| fun | `arabicPreview` | [74](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt#L74) |
| fun | `backgroundPausesAndForegroundDoesNotAutoResume` | [79](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt#L79) |
| fun | `screenshot` | [97](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingFocusPreviewTest.kt#L97) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt), 91 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingGroupsPreviewTest` | [20](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L20) |
| fun | `show` | [25](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L25) |
| fun | `tap` | [38](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L38) |
| fun | `checkPoints` | [39](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L39) |
| fun | `demoActionsAndFinalStepWork` | [45](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L45) |
| fun | `arabicAndEnglishAndSkip` | [58](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L58) |
| fun | `smallDarkScreen` | [68](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L68) |
| fun | `doubleTextInAllLanguages` | [75](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L75) |
| fun | `screenshot` | [85](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreviewTest.kt#L85) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt), 106 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingHifzPreviewTest` | [21](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt#L21) |
| fun | `show` | [25](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt#L25) |
| fun | `slider` | [38](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt#L38) |
| fun | `open` | [42](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt#L42) |
| fun | `longPressSliderSaveClearAndCancelAreLocal` | [44](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt#L44) |
| fun | `languagesAndAccessibleSliderWorkAtDoubleTextSize` | [72](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt#L72) |
| fun | `arabicScreenshotsAndDialogDismissal` | [86](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt#L86) |
| fun | `screenshot` | [96](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingHifzPreviewTest.kt#L96) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt), 87 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingPlanningPreviewTest` | [19](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt#L19) |
| fun | `show` | [23](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt#L23) |
| fun | `tap` | [36](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt#L36) |
| fun | `dateTimeUnitReminderAndSingleResultWork` | [37](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt#L37) |
| fun | `smallDarkScreenInAllLanguages` | [64](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt#L64) |
| fun | `arabicPreview` | [75](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt#L75) |
| fun | `screenshot` | [81](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreviewTest.kt#L81) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingProcessCheckpointTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingProcessCheckpointTest.kt), 72 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingProcessCheckpointTest` | [20](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingProcessCheckpointTest.kt#L20) |
| fun | `checkpoint` | [22](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingProcessCheckpointTest.kt#L22) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReadingPreviewTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReadingPreviewTest.kt), 72 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingReadingPreviewTest` | [18](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReadingPreviewTest.kt#L18) |
| fun | `demoCountersAreIndependentAndDoNotBecomeRealRegistrations` | [21](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReadingPreviewTest.kt#L21) |
| fun | `allLanguagesFitSmallScreenWithDoubleTextAndNavigationStillWorks` | [39](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReadingPreviewTest.kt#L39) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReplayTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReplayTest.kt), 72 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingReplayTest` | [16](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReplayTest.kt#L16) |
| fun | `replayStartsAtOneRestoresStepAndSkipCloses` | [19](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReplayTest.kt#L19) |
| fun | `replayAllSixStepsAndStartCloseWithoutAnotherGate` | [37](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReplayTest.kt#L37) |
| fun | `systemBackGoesToPreviousAndClosesAtFirstStep` | [58](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingReplayTest.kt#L58) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt), 114 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingShellTest` | [24](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt#L24) |
| fun | `show` | [32](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt#L32) |
| fun | `allSixStepsDotsPreviousAndStartWork` | [50](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt#L50) |
| fun | `skipCompletesWithoutTraversingRemainingSteps` | [68](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt#L68) |
| fun | `systemBackReturnsToPreviousThenLanguageWithoutCompleting` | [74](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt#L74) |
| fun | `englishAndArabicAreTranslatedAndMirrored` | [83](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt#L83) |
| fun | `allStepsAreReachableOnSmallDarkScreenAtDoubleTextSize` | [95](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt#L95) |
| fun | `screenshot` | [106](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingShellTest.kt#L106) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt), 81 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingStatisticsPreviewTest` | [19](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt#L19) |
| fun | `show` | [23](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt#L23) |
| fun | `checkCounts` | [36](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt#L36) |
| fun | `countsTranslationsAndNavigation` | [42](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt#L42) |
| fun | `smallDarkScreen` | [61](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt#L61) |
| fun | `doubleTextSizeInAllLanguages` | [66](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt#L66) |
| fun | `screenshot` | [75](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreviewTest.kt#L75) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingChecklistUiTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingChecklistUiTest.kt), 76 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingChecklistUiTest` | [15](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingChecklistUiTest.kt#L15) |
| fun | `clearActionsRequireConfirmationAndKeepOtherState` | [17](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingChecklistUiTest.kt#L17) |
| fun | `resumeAtHizbBoundaryAndCheckDoesNotMovePosition` | [39](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingChecklistUiTest.kt#L39) |
| fun | `arabicRtlShowsLocalizedNumbersAndCanSavePosition` | [57](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingChecklistUiTest.kt#L57) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingPlanDatePickerTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingPlanDatePickerTest.kt), 55 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingPlanDatePickerTest` | [24](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingPlanDatePickerTest.kt#L24) |
| fun | `endDateOpensConfirmsAndReopensInEveryLanguage` | [27](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingPlanDatePickerTest.kt#L27) |
| fun | `localizedTimeDialogRetainsActivityWindowInEveryLanguage` | [42](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/ReadingPlanDatePickerTest.kt#L42) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt), 86 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RepeatSelectionSheetTest` | [14](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L14) |
| fun | `show` | [17](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L17) |
| fun | `pageAndRepeatCountAreSelectable` | [27](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L27) |
| fun | `invalidAyahRangeCannotStart` | [38](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L38) |
| fun | `pageRangeRequiresOrderedValidPages` | [46](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L46) |
| fun | `unsupportedLayoutDoesNotOfferPages` | [56](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L56) |
| fun | `pageReferencesIncludeEntireRangeWithoutDuplicates` | [61](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L61) |
| fun | `warshHasOnlyMatchingReciterAndTranslatedLabels` | [70](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L70) |
| fun | `reciterChoiceMatchesReadingTradition` | [77](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RepeatSelectionSheetTest.kt#L77) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/RubReaderActionTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RubReaderActionTest.kt), 73 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RubReaderActionTest` | [10](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RubReaderActionTest.kt#L10) |
| fun | `all240HafsTargetsResolveToTheirActualMushafPage` | [14](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RubReaderActionTest.kt#L14) |
| fun | `unverifiedWarshAndOtherLayoutsCannotSilentlyUseHafs` | [26](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RubReaderActionTest.kt#L26) |
| fun | `all240WarshTargetsResolveThroughTheActualReaderWithoutHafsFallback` | [34](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RubReaderActionTest.kt#L34) |
| fun | `openOnlyEmitsTheRequestedTarget` | [52](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RubReaderActionTest.kt#L52) |
| fun | `pendingWarshShowsExplanationAndCannotOpen` | [62](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/RubReaderActionTest.kt#L62) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsAyahRangeUiTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsAyahRangeUiTest.kt), 28 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `StatsAyahRangeUiTest` | [9](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsAyahRangeUiTest.kt#L9) |
| fun | `hizbRegistrationShowsNumberSurahsAndCanonicalOpening` | [11](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsAyahRangeUiTest.kt#L11) |
| fun | `rangeIsVisibleWithoutOpeningAnotherScreen` | [21](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsAyahRangeUiTest.kt#L21) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsDrilldownUiTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsDrilldownUiTest.kt), 42 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `StatsDrilldownUiTest` | [10](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsDrilldownUiTest.kt#L10) |
| fun | `openFilterAndCloseActualRegistrationDetails` | [13](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/StatsDrilldownUiTest.kt#L13) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/TopLevelNavigationTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/TopLevelNavigationTest.kt), 36 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `TopLevelNavigationTest` | [15](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/TopLevelNavigationTest.kt#L15) |
| fun | `hizbTabRestoresOverviewNotItsReaderChild` | [17](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/TopLevelNavigationTest.kt#L17) |

### app/src/androidTest/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometryTest.kt

[Volledige bron](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometryTest.kt), 115 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `WarshMaknoonGeometryTest` | [29](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometryTest.kt#L29) |
| fun | `allPagesUseValidNonOverlappingWarshVerses` | [33](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometryTest.kt#L33) |
| fun | `physicalPageTargetsStayAlignedAtDifferentSizesAndInRtl` | [65](../../../app/src/androidTest/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometryTest.kt#L65) |

### app/src/debug/java/com/Ameender/qurantracker/debug/RepeatAudioProbeActivity.kt

[Volledige bron](../../../app/src/debug/java/com/Ameender/qurantracker/debug/RepeatAudioProbeActivity.kt), 128 regels, rol: debug.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RepeatAudioProbeActivity` | [19](../../../app/src/debug/java/com/Ameender/qurantracker/debug/RepeatAudioProbeActivity.kt#L19) |
| fun | `onCreate` | [27](../../../app/src/debug/java/com/Ameender/qurantracker/debug/RepeatAudioProbeActivity.kt#L27) |
| fun | `startProbe` | [93](../../../app/src/debug/java/com/Ameender/qurantracker/debug/RepeatAudioProbeActivity.kt#L93) |
| fun | `reset` | [117](../../../app/src/debug/java/com/Ameender/qurantracker/debug/RepeatAudioProbeActivity.kt#L117) |
| fun | `onStop` | [119](../../../app/src/debug/java/com/Ameender/qurantracker/debug/RepeatAudioProbeActivity.kt#L119) |
| fun | `onDestroy` | [124](../../../app/src/debug/java/com/Ameender/qurantracker/debug/RepeatAudioProbeActivity.kt#L124) |

### app/src/main/java/com/Ameender/qurantracker/MainActivity.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt), 892 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `Screen` | [59](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L59) |
| object | `Dashboard` | [60](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L60) |
| object | `Hizb` | [61](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L61) |
| object | `Juzz` | [62](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L62) |
| object | `Surahs` | [63](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L63) |
| object | `Reader` | [64](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L64) |
| object | `Tafsir` | [65](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L65) |
| object | `Mutashabihat` | [66](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L66) |
| object | `Translation` | [67](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L67) |
| object | `BookReader` | [68](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L68) |
| object | `Notes` | [69](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L69) |
| object | `Focus` | [70](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L70) |
| object | `Groups` | [71](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L71) |
| object | `ReadingPlan` | [72](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L72) |
| object | `Notifications` | [73](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L73) |
| object | `ReadingChecklist` | [74](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L74) |
| object | `DailyGoal` | [75](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L75) |
| object | `Stats` | [76](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L76) |
| object | `Agenda` | [77](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L77) |
| class | `MainActivity` | [80](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L80) |
| fun | `onCreate` | [86](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L86) |
| fun | `onResume` | [262](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L262) |
| fun | `onNewIntent` | [267](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L267) |
| fun | `receiveNavigation` | [275](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L275) |
| fun | `restorePendingNavigation` | [279](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L279) |
| fun | `QuranTrackerApp` | [289](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L289) |
| fun | `countsFor` | [345](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L345) |
| fun | `openNotes` | [346](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L346) |
| fun | `navigateTopLevel` | [472](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L472) |
| fun | `navigateSecondary` | [476](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L476) |
| fun | `navigateReader` | [482](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L482) |
| fun | `navigateBackOrHome` | [488](../../../app/src/main/java/com/Ameender/qurantracker/MainActivity.kt#L488) |

### app/src/main/java/com/Ameender/qurantracker/PlanningReminderWorker.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/PlanningReminderWorker.kt), 32 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PlanningReminderWorker` | [10](../../../app/src/main/java/com/Ameender/qurantracker/PlanningReminderWorker.kt#L10) |
| fun | `doWork` | [11](../../../app/src/main/java/com/Ameender/qurantracker/PlanningReminderWorker.kt#L11) |
| fun | `schedulePlanningReminder` | [21](../../../app/src/main/java/com/Ameender/qurantracker/PlanningReminderWorker.kt#L21) |
| fun | `cancelPlanningReminder` | [29](../../../app/src/main/java/com/Ameender/qurantracker/PlanningReminderWorker.kt#L29) |

### app/src/main/java/com/Ameender/qurantracker/QuranReminderWorker.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/QuranReminderWorker.kt), 21 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranReminderWorker` | [9](../../../app/src/main/java/com/Ameender/qurantracker/QuranReminderWorker.kt#L9) |
| fun | `doWork` | [10](../../../app/src/main/java/com/Ameender/qurantracker/QuranReminderWorker.kt#L10) |
| fun | `scheduleReminder` | [17](../../../app/src/main/java/com/Ameender/qurantracker/QuranReminderWorker.kt#L17) |
| fun | `scheduleDailyReminder` | [20](../../../app/src/main/java/com/Ameender/qurantracker/QuranReminderWorker.kt#L20) |

### app/src/main/java/com/Ameender/qurantracker/data/AccountManagementPolicy.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/AccountManagementPolicy.kt), 13 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `AccountManagementPolicy` | [4](../../../app/src/main/java/com/Ameender/qurantracker/data/AccountManagementPolicy.kt#L4) |
| fun | `validPassword` | [6](../../../app/src/main/java/com/Ameender/qurantracker/data/AccountManagementPolicy.kt#L6) |
| fun | `matchingPasswords` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/AccountManagementPolicy.kt#L7) |
| fun | `validEmail` | [8](../../../app/src/main/java/com/Ameender/qurantracker/data/AccountManagementPolicy.kt#L8) |
| fun | `changedEmail` | [10](../../../app/src/main/java/com/Ameender/qurantracker/data/AccountManagementPolicy.kt#L10) |
| fun | `deletionConfirmed` | [11](../../../app/src/main/java/com/Ameender/qurantracker/data/AccountManagementPolicy.kt#L11) |

### app/src/main/java/com/Ameender/qurantracker/data/AuthenticationState.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/AuthenticationState.kt), 28 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `AuthenticationState` | [6](../../../app/src/main/java/com/Ameender/qurantracker/data/AuthenticationState.kt#L6) |
| object | `Checking` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/AuthenticationState.kt#L7) |
| class | `Authenticated` | [9](../../../app/src/main/java/com/Ameender/qurantracker/data/AuthenticationState.kt#L9) |
| object | `SignedOut` | [14](../../../app/src/main/java/com/Ameender/qurantracker/data/AuthenticationState.kt#L14) |
| class | `ProtectedAuthAccess` | [17](../../../app/src/main/java/com/Ameender/qurantracker/data/AuthenticationState.kt#L17) |
| fun | `AuthenticationState.protectedAccess` | [23](../../../app/src/main/java/com/Ameender/qurantracker/data/AuthenticationState.kt#L23) |

### app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt), 69 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AyahNote` | [22](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt#L22) |
| interface | `AyahNoteDao` | [50](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt#L50) |
| fun | `getAll` | [52](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt#L52) |
| fun | `getNote` | [55](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt#L55) |
| fun | `insert` | [58](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt#L58) |
| fun | `update` | [61](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt#L61) |
| fun | `deleteForAyah` | [64](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt#L64) |
| fun | `delete` | [67](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNote.kt#L67) |

### app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt), 116 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `AyahNoteDataSource` | [5](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L5) |
| fun | `insertNote` | [6](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L6) |
| fun | `getNote` | [8](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L8) |
| fun | `saveNote` | [9](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L9) |
| fun | `updateNote` | [27](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L27) |
| fun | `deleteNote` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L28) |
| fun | `deleteForAyah` | [29](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L29) |
| fun | `AyahNoteDataSource.persistNote` | [33](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L33) |
| class | `AyahNoteRepository` | [43](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L43) |
| fun | `insertNote` | [46](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L46) |
| fun | `getNote` | [53](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L53) |
| fun | `saveNote` | [56](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L56) |
| fun | `updateNote` | [102](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L102) |
| fun | `deleteNote` | [108](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L108) |
| fun | `deleteForAyah` | [112](../../../app/src/main/java/com/Ameender/qurantracker/data/AyahNoteRepository.kt#L112) |

### app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt), 33 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `DailyGoal` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt#L7) |
| interface | `DailyGoalDao` | [17](../../../app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt#L17) |
| fun | `getGoals` | [19](../../../app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt#L19) |
| fun | `getGoalsOnce` | [22](../../../app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt#L22) |
| fun | `getGoal` | [25](../../../app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt#L25) |
| fun | `getGoalOnce` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt#L28) |
| fun | `upsertGoal` | [31](../../../app/src/main/java/com/Ameender/qurantracker/data/DailyGoal.kt#L31) |

### app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt), 47 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GoalDay` | [8](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L8) |
| interface | `GoalDayDao` | [18](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L18) |
| fun | `observe` | [20](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L20) |
| fun | `all` | [22](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L22) |
| fun | `save` | [23](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L23) |
| fun | `goalAction` | [26](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L26) |
| class | `GoalDayProgress` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L28) |
| class | `GoalSessionContent` | [34](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L34) |
| fun | `goalProgress` | [41](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalDay.kt#L41) |

### app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt), 238 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `GoalDataSource` | [11](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L11) |
| fun | `refreshDays` | [19](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L19) |
| fun | `saveGoal` | [20](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L20) |
| fun | `saveGoalDefinition` | [21](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L21) |
| fun | `record` | [22](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L22) |
| fun | `resolve` | [23](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L23) |
| fun | `schedule` | [24](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L24) |
| fun | `saveReadingJourney` | [25](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L25) |
| class | `GoalRepository` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L28) |
| fun | `refreshDays` | [83](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L83) |
| fun | `saveGoal` | [101](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L101) |
| fun | `saveGoalDefinition` | [104](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L104) |
| fun | `record` | [120](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L120) |
| fun | `schedule` | [154](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L154) |
| fun | `resolve` | [170](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L170) |
| fun | `saveReadingJourney` | [189](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L189) |
| fun | `requireValidContent` | [204](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L204) |
| fun | `defaultGoal` | [216](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L216) |
| fun | `unitQuranFraction` | [222](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L222) |
| fun | `historyQuranFraction` | [231](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L231) |
| fun | `journeyFraction` | [236](../../../app/src/main/java/com/Ameender/qurantracker/data/GoalRepository.kt#L236) |

### app/src/main/java/com/Ameender/qurantracker/data/GroupAuthorName.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupAuthorName.kt), 8 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `resolveGroupAuthorName` | [4](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupAuthorName.kt#L4) |

### app/src/main/java/com/Ameender/qurantracker/data/GroupMemberPermissions.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupMemberPermissions.kt), 16 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupMemberPermissions` | [10](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupMemberPermissions.kt#L10) |

### app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt), 1812 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupV2Row` | [21](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L21) |
| class | `GroupLogoRow` | [43](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L43) |
| class | `SetGroupLogoParams` | [45](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L45) |
| class | `GroupV2MembershipRow` | [51](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L51) |
| class | `GroupV2RoleRow` | [62](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L62) |
| class | `GroupV2MemberListRow` | [68](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L68) |
| class | `GroupV2RoleListRow` | [78](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L78) |
| class | `GroupV2InvitationRow` | [85](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L85) |
| class | `GroupV2JoinRequestRow` | [97](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L97) |
| class | `GroupV2MediaRow` | [109](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L109) |
| class | `GroupV2TaskRow` | [128](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L128) |
| class | `GroupV3ProfileRow` | [151](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L151) |
| class | `GroupV3TaskProgressRow` | [160](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L160) |
| class | `GroupV3PointTotalRow` | [168](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L168) |
| class | `GroupV2EventRow` | [176](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L176) |
| class | `GroupV2RuleRow` | [196](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L196) |
| class | `GroupV2NotificationPreferencesRow` | [206](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L206) |
| class | `GroupV2NotificationRow` | [214](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L214) |
| class | `GroupV2ModerationReportRow` | [226](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L226) |
| class | `GroupV2AuditEntryRow` | [244](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L244) |
| class | `GroupV2PostRow` | [256](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L256) |
| class | `GroupV2ReactionRow` | [272](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L272) |
| class | `GroupV2CommentRow` | [280](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L280) |
| class | `GroupV2ProgressRow` | [291](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L291) |
| class | `CreateGroupV2Params` | [300](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L300) |
| class | `UpdateGroupV2Params` | [313](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L313) |
| class | `JoinGroupV2Params` | [326](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L326) |
| class | `GroupIdParam` | [332](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L332) |
| class | `GetGroupDetailV3Params` | [337](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L337) |
| class | `CreateTextPostV2Params` | [342](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L342) |
| class | `RecordProgressV2Params` | [349](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L349) |
| class | `TogglePostLikeV2Params` | [360](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L360) |
| class | `AddPostCommentV2Params` | [366](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L366) |
| class | `UpdatePostV2Params` | [374](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L374) |
| class | `SetPostPinnedV2Params` | [381](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L381) |
| class | `PostMutationV2Params` | [388](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L388) |
| class | `TogglePostReactionV2Params` | [394](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L394) |
| class | `DeletePostCommentV2Params` | [401](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L401) |
| class | `ReportPostV2Params` | [408](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L408) |
| class | `SetMemberRoleV2Params` | [416](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L416) |
| class | `RemoveMemberV2Params` | [423](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L423) |
| class | `CreateInvitationV2Params` | [430](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L430) |
| class | `InvitationMutationV2Params` | [438](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L438) |
| class | `AcceptInvitationV2Params` | [444](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L444) |
| class | `CreateJoinRequestV2Params` | [450](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L450) |
| class | `ReviewJoinRequestV2Params` | [456](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L456) |
| class | `ListGroupMediaV2Params` | [463](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L463) |
| class | `RegisterGroupMediaV2Params` | [470](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L470) |
| class | `DeleteGroupMediaV2Params` | [482](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L482) |
| class | `ListGroupTasksV2Params` | [488](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L488) |
| class | `CreateGroupTaskV2Params` | [494](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L494) |
| class | `SetGroupTaskProgressV2Params` | [506](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L506) |
| class | `SetGroupTaskStatusV2Params` | [513](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L513) |
| class | `UpdateGroupProfileV2Params` | [520](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L520) |
| class | `CreateGroupEventV2Params` | [527](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L527) |
| class | `RespondGroupEventV2Params` | [538](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L538) |
| class | `SetGroupEventStatusV2Params` | [545](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L545) |
| class | `PublishGroupRulesV2Params` | [552](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L552) |
| class | `UpdateGroupNotificationPreferencesV2Params` | [558](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L558) |
| class | `ListGroupNotificationsV2Params` | [566](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L566) |
| class | `MarkGroupNotificationReadV2Params` | [574](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L574) |
| class | `SendGroupNotificationV2Params` | [581](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L581) |
| class | `ListGroupModerationReportsV2Params` | [591](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L591) |
| class | `ReviewGroupModerationReportV2Params` | [600](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L600) |
| class | `ListGroupAuditLogV2Params` | [608](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L608) |
| class | `GroupV2Repository` | [614](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L614) |
| fun | `createGroup` | [617](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L617) |
| fun | `joinGroup` | [646](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L646) |
| fun | `loadGroup` | [658](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L658) |
| fun | `loadCurrentUserGroups` | [667](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L667) |
| fun | `updateGroup` | [680](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L680) |
| fun | `deleteGroup` | [710](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L710) |
| fun | `loadMembers` | [715](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L715) |
| fun | `loadMyGroupProfile` | [738](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L738) |
| fun | `updateMyGroupProfile` | [746](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L746) |
| fun | `uploadGroupProfileAvatar` | [762](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L762) |
| fun | `loadGroupLogo` | [785](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L785) |
| fun | `setGroupLogo` | [791](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L791) |
| fun | `loadRoles` | [809](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L809) |
| fun | `setMemberRole` | [819](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L819) |
| fun | `removeMember` | [827](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L827) |
| fun | `createInvitation` | [835](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L835) |
| fun | `loadInvitations` | [848](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L848) |
| fun | `revokeInvitation` | [856](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L856) |
| fun | `acceptInvitation` | [864](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L864) |
| fun | `createJoinRequest` | [876](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L876) |
| fun | `loadJoinRequests` | [883](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L883) |
| fun | `reviewJoinRequest` | [891](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L891) |
| fun | `loadMedia` | [899](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L899) |
| fun | `uploadMedia` | [904](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L904) |
| fun | `deleteMedia` | [956](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L956) |
| fun | `loadTasks` | [967](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L967) |
| fun | `createTask` | [975](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L975) |
| fun | `setTaskProgress` | [1001](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1001) |
| fun | `setTaskStatus` | [1009](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1009) |
| fun | `loadEvents` | [1017](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1017) |
| fun | `createEvent` | [1025](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1025) |
| fun | `respondToEvent` | [1049](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1049) |
| fun | `setEventStatus` | [1057](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1057) |
| fun | `loadRules` | [1065](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1065) |
| fun | `publishRules` | [1073](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1073) |
| fun | `loadNotificationPreferences` | [1081](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1081) |
| fun | `updateNotificationPreferences` | [1089](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1089) |
| fun | `loadNotifications` | [1102](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1102) |
| fun | `markNotificationRead` | [1120](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1120) |
| fun | `sendNotification` | [1132](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1132) |
| fun | `loadModerationReports` | [1154](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1154) |
| fun | `reviewModerationReport` | [1174](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1174) |
| fun | `loadAuditLog` | [1187](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1187) |
| fun | `recordProgress` | [1199](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1199) |
| fun | `sendMessage` | [1223](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1223) |
| fun | `loadFeed` | [1242](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1242) |
| fun | `toggleLike` | [1305](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1305) |
| fun | `addComment` | [1313](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1313) |
| fun | `updatePost` | [1327](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1327) |
| fun | `setPostPinned` | [1346](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1346) |
| fun | `deletePost` | [1365](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1365) |
| fun | `toggleReaction` | [1373](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1373) |
| fun | `deleteComment` | [1382](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1382) |
| fun | `reportPost` | [1390](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1390) |
| fun | `loadLeaderboard` | [1398](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1398) |
| fun | `loadGroupRowByCode` | [1469](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1469) |
| fun | `loadGroupRowById` | [1476](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1476) |
| fun | `loadCurrentRole` | [1489](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1489) |
| fun | `loadRoleKey` | [1504](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1504) |
| fun | `loadMediaForGroup` | [1515](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1515) |
| fun | `PostgrestResult.decodeSingleFlexible` | [1543](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1543) |
| fun | `GroupV2Row.toDetails` | [1547](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1547) |
| fun | `GroupV2PostRow.toFeedItem` | [1569](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1569) |
| fun | `GroupV2MediaRow.toMediaItem` | [1610](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1610) |
| fun | `GroupV2TaskRow.toTaskItem` | [1635](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1635) |
| fun | `GroupV3ProfileRow.toGroupProfile` | [1659](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1659) |
| fun | `GroupV2EventRow.toEventItem` | [1667](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1667) |
| fun | `GroupV2RuleRow.toRule` | [1686](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1686) |
| fun | `GroupV2NotificationPreferencesRow.toNotificationPreferences` | [1695](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1695) |
| fun | `GroupV2NotificationRow.toNotification` | [1703](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1703) |
| fun | `GroupV2ModerationReportRow.toModerationReport` | [1714](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1714) |
| fun | `GroupV2AuditEntryRow.toAuditEntry` | [1731](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1731) |
| fun | `GroupV2CommentRow.toCommentItem` | [1742](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1742) |
| fun | `GroupV2InvitationRow.toInvitation` | [1754](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1754) |
| fun | `GroupV2JoinRequestRow.toJoinRequest` | [1767](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1767) |
| fun | `stableUiId` | [1780](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1780) |
| fun | `progressStreak` | [1789](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1789) |
| fun | `dateKeyDaysAgo` | [1807](../../../app/src/main/java/com/Ameender/qurantracker/data/GroupV2Repository.kt#L1807) |

### app/src/main/java/com/Ameender/qurantracker/data/HizbAnalytics.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbAnalytics.kt), 23 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `HizbPeriod` | [6](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbAnalytics.kt#L6) |
| class | `HizbDateRange` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbAnalytics.kt#L7) |
| fun | `bounds` | [9](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbAnalytics.kt#L9) |
| fun | `hizbDateRange` | [12](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbAnalytics.kt#L12) |
| fun | `completeHizbCounts` | [14](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbAnalytics.kt#L14) |
| fun | `currentHistoryOwner` | [18](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbAnalytics.kt#L18) |

### app/src/main/java/com/Ameender/qurantracker/data/HizbData.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbData.kt), 85 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `HizbInfo` | [3](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbData.kt#L3) |
| fun | `getHizbInfo` | [75](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbData.kt#L75) |
| fun | `getHizbForJuz` | [80](../../../app/src/main/java/com/Ameender/qurantracker/data/HizbData.kt#L80) |

### app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt), 67 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AppLanguage` | [5](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L5) |
| fun | `fromCode` | [9](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L9) |
| class | `LanguageEntryStage` | [13](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L13) |
| fun | `resolveLanguageEntry` | [16](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L16) |
| class | `LanguageEntryStore` | [20](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L20) |
| fun | `language` | [35](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L35) |
| fun | `select` | [37](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L37) |
| fun | `continueToIntro` | [41](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L41) |
| fun | `introStep` | [46](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L46) |
| fun | `saveIntroStep` | [48](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L48) |
| fun | `returnToLanguage` | [52](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L52) |
| fun | `completeIntro` | [57](../../../app/src/main/java/com/Ameender/qurantracker/data/LanguageEntry.kt#L57) |

### app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt), 90 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranAyahLocation` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt#L7) |
| class | `MutashabihatSequence` | [13](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt#L13) |
| class | `MutashabihatGroup` | [17](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt#L17) |
| class | `MutashabihatRepository` | [24](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt#L24) |
| fun | `loadGroups` | [25](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt#L25) |
| fun | `Any.toAbsoluteAyahs` | [59](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt#L59) |
| fun | `List` | [67](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt#L67) |
| fun | `quranLocationForAbsoluteAyah` | [78](../../../app/src/main/java/com/Ameender/qurantracker/data/MutashabihatRepository.kt#L78) |

### app/src/main/java/com/Ameender/qurantracker/data/NoteScopesMigration.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/NoteScopesMigration.kt), 33 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `migrate` | [8](../../../app/src/main/java/com/Ameender/qurantracker/data/NoteScopesMigration.kt#L8) |

### app/src/main/java/com/Ameender/qurantracker/data/OnboardingStep.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/OnboardingStep.kt), 17 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingStep` | [4](../../../app/src/main/java/com/Ameender/qurantracker/data/OnboardingStep.kt#L4) |
| fun | `fromId` | [14](../../../app/src/main/java/com/Ameender/qurantracker/data/OnboardingStep.kt#L14) |

### app/src/main/java/com/Ameender/qurantracker/data/PendingNavigationStore.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/PendingNavigationStore.kt), 61 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PendingNavigationStore` | [8](../../../app/src/main/java/com/Ameender/qurantracker/data/PendingNavigationStore.kt#L8) |
| fun | `receive` | [14](../../../app/src/main/java/com/Ameender/qurantracker/data/PendingNavigationStore.kt#L14) |
| fun | `receive` | [43](../../../app/src/main/java/com/Ameender/qurantracker/data/PendingNavigationStore.kt#L43) |
| fun | `consumeGroup` | [52](../../../app/src/main/java/com/Ameender/qurantracker/data/PendingNavigationStore.kt#L52) |
| fun | `consumeNotification` | [57](../../../app/src/main/java/com/Ameender/qurantracker/data/PendingNavigationStore.kt#L57) |

### app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt), 70 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PlanningItem` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L7) |
| interface | `PlanningItemDao` | [30](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L30) |
| fun | `getOnce` | [32](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L32) |
| fun | `getAll` | [35](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L35) |
| fun | `getForDate` | [38](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L38) |
| fun | `getFromDate` | [41](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L41) |
| fun | `getDatesWithItems` | [44](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L44) |
| fun | `insert` | [47](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L47) |
| fun | `setDone` | [50](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L50) |
| fun | `setDoneAndHistoryLogged` | [53](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L53) |
| fun | `setReminder` | [56](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L56) |
| fun | `delete` | [59](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L59) |
| fun | `deleteById` | [62](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L62) |
| fun | `countDuplicate` | [68](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningItem.kt#L68) |

### app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt), 200 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `PlanningDataSource` | [14](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L14) |
| fun | `getItemsForDate` | [20](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L20) |
| fun | `addItem` | [21](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L21) |
| fun | `addKhatmaPlan` | [22](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L22) |
| fun | `toggleDone` | [23](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L23) |
| fun | `deleteItem` | [24](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L24) |
| fun | `setReminder` | [25](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L25) |
| fun | `saveGoal` | [26](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L26) |
| class | `PlanningRepository` | [29](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L29) |
| fun | `getItemsForDate` | [51](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L51) |
| fun | `addItem` | [54](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L54) |
| fun | `addKhatmaPlan` | [74](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L74) |
| fun | `toggleDone` | [109](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L109) |
| fun | `complete` | [117](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L117) |
| fun | `deleteItem` | [149](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L149) |
| fun | `setReminder` | [154](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L154) |
| fun | `saveGoal` | [163](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L163) |
| fun | `khatmaPartRangeLabel` | [179](../../../app/src/main/java/com/Ameender/qurantracker/data/PlanningRepository.kt#L179) |

### app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt), 103 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `ProfileAvatarService` | [5](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L5) |
| fun | `clearCachedProfile` | [10](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L10) |
| fun | `resolveAvatarUrl` | [18](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L18) |
| fun | `cacheUploadedAvatarUrl` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L28) |
| fun | `cachedUploadedAvatarUrl` | [37](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L37) |
| fun | `resolveDisplayName` | [45](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L45) |
| fun | `cacheUploadedDisplayName` | [58](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L58) |
| fun | `cachedUploadedDisplayName` | [68](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L68) |
| fun | `withCachedAvatar` | [76](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L76) |
| fun | `cacheKey` | [99](../../../app/src/main/java/com/Ameender/qurantracker/data/ProfileAvatarService.kt#L99) |

### app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt), 38 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `QuranDao` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L7) |
| fun | `getAllProgress` | [11](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L11) |
| fun | `getByType` | [15](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L15) |
| fun | `getById` | [19](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L19) |
| fun | `upsertProgress` | [23](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L23) |
| fun | `deleteAll` | [27](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L27) |
| fun | `resetReadingProgress` | [30](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L30) |
| fun | `incrementReadCount` | [33](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L33) |
| fun | `incrementReadCount` | [36](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDao.kt#L36) |

### app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt), 295 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranDatabase` | [24](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L24) |
| fun | `quranDao` | [26](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L26) |
| fun | `readingHistoryDao` | [27](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L27) |
| fun | `dailyGoalDao` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L28) |
| fun | `goalDayDao` | [29](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L29) |
| fun | `planningItemDao` | [30](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L30) |
| fun | `readingJourneyDao` | [31](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L31) |
| fun | `ayahNoteDao` | [32](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L32) |
| fun | `getDatabase` | [38](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L38) |
| fun | `migrate` | [70](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L70) |
| fun | `migrate` | [88](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L88) |
| fun | `migrate` | [95](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L95) |
| fun | `migration` | [102](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L102) |
| fun | `migrate` | [104](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L104) |
| fun | `ensureCurrentSchema` | [109](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L109) |
| fun | `addColumnIfMissing` | [279](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabase.kt#L279) |

### app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt), 178 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranDatabaseHelper` | [8](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L8) |
| fun | `getDatabasePath` | [13](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L13) |
| fun | `getDatabase` | [25](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L25) |
| fun | `getAllChapters` | [34](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L34) |
| fun | `getAyahsForChapter` | [60](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L60) |
| fun | `getChapterName` | [81](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L81) |
| fun | `getAyahText` | [94](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L94) |
| fun | `searchAyahs` | [107](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L107) |
| fun | `normalizeArabicSearchText` | [144](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L144) |
| class | `QuranChapter` | [160](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L160) |
| fun | `getAyahs` | [169](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L169) |
| class | `QuranSearchResult` | [172](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranDatabaseHelper.kt#L172) |

### app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt), 330 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `NoteScope` | [3](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L3) |
| fun | `fromKey` | [5](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L5) |
| class | `QuranNoteTarget` | [9](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L9) |
| fun | `validate` | [16](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L16) |
| fun | `includes` | [27](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L27) |
| class | `QuranStart` | [42](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L42) |
| object | `QuranStructure` | [50](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L50) |
| fun | `start` | [294](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L294) |
| fun | `AyahNote.target` | [305](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L305) |
| fun | `AyahNote.withTarget` | [312](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L312) |
| fun | `AyahNote.validateTarget` | [321](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranNoteTarget.kt#L321) |

### app/src/main/java/com/Ameender/qurantracker/data/QuranProgress.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgress.kt), 21 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranProgress` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgress.kt#L7) |

### app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt), 286 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `QuranProgressDataSource` | [13](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L13) |
| fun | `quickCheckIn` | [14](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L14) |
| fun | `dayActivitySince` | [27](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L27) |
| fun | `markJuzRead` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L28) |
| fun | `removeJuz` | [29](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L29) |
| fun | `markRubRead` | [30](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L30) |
| fun | `removeRub` | [31](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L31) |
| fun | `markSurah` | [32](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L32) |
| fun | `removeSurah` | [33](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L33) |
| fun | `updateHifzScore` | [34](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L34) |
| fun | `updateHifzScoreRange` | [35](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L35) |
| fun | `resetHistory` | [36](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L36) |
| class | `QuranProgressRepository` | [39](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L39) |
| fun | `quickCheckIn` | [46](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L46) |
| fun | `dayActivitySince` | [85](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L85) |
| fun | `markJuzRead` | [87](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L87) |
| fun | `markJuzReadInternal` | [91](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L91) |
| fun | `removeJuz` | [114](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L114) |
| fun | `markRubRead` | [121](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L121) |
| fun | `markRubReadInternal` | [125](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L125) |
| fun | `removeRub` | [165](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L165) |
| fun | `markSurah` | [186](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L186) |
| fun | `markSurahInternal` | [190](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L190) |
| fun | `removeSurah` | [219](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L219) |
| fun | `updateHifzScore` | [230](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L230) |
| fun | `updateHifzScoreRange` | [249](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L249) |
| fun | `resetHistory` | [257](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L257) |
| fun | `progressId` | [265](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L265) |
| fun | `rubHistoryMarkers` | [272](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L272) |
| fun | `hifzScopeLimit` | [280](../../../app/src/main/java/com/Ameender/qurantracker/data/QuranProgressRepository.kt#L280) |

### app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt), 52 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `ReadingChecklistMapping` | [4](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L4) |
| fun | `index` | [6](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L6) |
| fun | `point` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L7) |
| fun | `maximum` | [16](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L16) |
| fun | `range` | [20](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L20) |
| fun | `hizbAt` | [27](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L27) |
| class | `ReadingChecklistState` | [30](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L30) |
| fun | `clearPosition` | [34](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L34) |
| fun | `clearChecklist` | [35](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L35) |
| fun | `completed` | [36](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L36) |
| fun | `partial` | [37](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L37) |
| fun | `check` | [38](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L38) |
| fun | `stopAt` | [43](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklist.kt#L43) |

### app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklistStore.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklistStore.kt), 33 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingChecklistStore` | [10](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklistStore.kt#L10) |
| fun | `read` | [13](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklistStore.kt#L13) |
| fun | `load` | [22](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklistStore.kt#L22) |
| fun | `update` | [23](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingChecklistStore.kt#L23) |

### app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt), 155 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingHistory` | [7](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L7) |
| interface | `ReadingHistoryDao` | [26](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L26) |
| fun | `hizbCounts` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L28) |
| fun | `hasSource` | [31](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L31) |
| fun | `recordRequest` | [33](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L33) |
| fun | `clearRequests` | [35](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L35) |
| fun | `getAllOnce` | [37](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L37) |
| fun | `insertOnce` | [40](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L40) |
| fun | `deleteSource` | [42](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L42) |
| fun | `insert` | [45](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L45) |
| fun | `getAll` | [48](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L48) |
| fun | `getRecent` | [51](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L51) |
| fun | `getMostRead` | [62](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L62) |
| fun | `getMostReadHizb` | [73](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L73) |
| fun | `getAllTypeCounts` | [83](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L83) |
| fun | `getActivityPerDay` | [93](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L93) |
| fun | `deleteAll` | [96](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L96) |
| fun | `deleteRubReadForDay` | [110](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L110) |
| fun | `getTotalReadCount` | [119](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L119) |
| class | `HizbReadingCount` | [122](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L122) |
| class | `CheckInRequest` | [125](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L125) |
| class | `SurahReadCount` | [127](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L127) |
| class | `HizbReadCount` | [133](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L133) |
| class | `TypeCount` | [140](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L140) |
| class | `SurahLastRead` | [145](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L145) |
| class | `DayActivity` | [151](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingHistory.kt#L151) |

### app/src/main/java/com/Ameender/qurantracker/data/ReadingJourney.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingJourney.kt), 33 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingJourney` | [11](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingJourney.kt#L11) |
| interface | `ReadingJourneyDao` | [23](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingJourney.kt#L23) |
| fun | `getJourney` | [25](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingJourney.kt#L25) |
| fun | `getJourneyOnce` | [28](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingJourney.kt#L28) |
| fun | `upsertJourney` | [31](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingJourney.kt#L31) |

### app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt), 113 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ProgressMeasurement` | [5](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L5) |
| object | `ReadingMetrics` | [14](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L14) |
| fun | `surahAyahCount` | [40](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L40) |
| fun | `measure` | [43](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L43) |
| fun | `ayahEquivalent` | [56](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L56) |
| fun | `historyMeasurement` | [75](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L75) |
| fun | `historyAyahEquivalent` | [85](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L85) |
| fun | `pageEquivalent` | [88](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L88) |
| fun | `pointsForAyahs` | [91](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L91) |
| fun | `goalUnitAmount` | [94](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L94) |
| fun | `normalizeUnit` | [103](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingMetrics.kt#L103) |

### app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt), 121 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingStatsSummary` | [10](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt#L10) |
| fun | `readingStatsSummary` | [27](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt#L27) |
| fun | `currentReadingStreak` | [70](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt#L70) |
| fun | `historyDateKey` | [94](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt#L94) |
| fun | `startOfDayMillis` | [100](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt#L100) |
| fun | `startOfWeekMillis` | [103](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt#L103) |
| fun | `startOfMonthMillis` | [109](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt#L109) |
| fun | `Calendar.copyAtStart` | [114](../../../app/src/main/java/com/Ameender/qurantracker/data/ReadingStatsSummary.kt#L114) |

### app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt), 37 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `ReminderScheduler` | [8](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt#L8) |
| fun | `scheduleDaily` | [9](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt#L9) |
| fun | `schedulePlanning` | [10](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt#L10) |
| fun | `cancelPlanning` | [11](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt#L11) |
| class | `AndroidReminderScheduler` | [14](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt#L14) |
| fun | `scheduleDaily` | [17](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt#L17) |
| fun | `schedulePlanning` | [21](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt#L21) |
| fun | `cancelPlanning` | [33](../../../app/src/main/java/com/Ameender/qurantracker/data/ReminderScheduler.kt#L33) |

### app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt), 1179 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingGroupDetails` | [39](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L39) |
| class | `ReadingGroupMemberRow` | [61](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L61) |
| class | `ReadingGroupRoleRow` | [71](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L71) |
| class | `ReadingGroupInvitationRow` | [77](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L77) |
| class | `ReadingGroupJoinRequestRow` | [88](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L88) |
| class | `ReadingGroupMediaItem` | [99](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L99) |
| class | `ReadingGroupTaskItem` | [119](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L119) |
| class | `ReadingGroupProfile` | [141](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L141) |
| class | `ReadingGroupEventItem` | [149](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L149) |
| class | `ReadingGroupRule` | [168](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L168) |
| class | `ReadingGroupNotificationPreferences` | [177](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L177) |
| class | `ReadingGroupNotification` | [184](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L184) |
| class | `ReadingGroupModerationReport` | [195](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L195) |
| class | `ReadingGroupAuditEntry` | [212](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L212) |
| class | `ProfileUpsert` | [224](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L224) |
| class | `ProfileRow` | [231](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L231) |
| class | `ReadingGroupReadingEntry` | [237](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L237) |
| class | `ReadingGroupLeaderboardRow` | [244](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L244) |
| class | `ReadingGroupFeedItem` | [262](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L262) |
| class | `ReadingGroupCommentItem` | [287](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L287) |
| class | `UserAccount` | [297](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L297) |
| object | `SupabaseConfig` | [317](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L317) |
| object | `SupabaseService` | [327](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L327) |
| fun | `consumeAccountDeletionNotice` | [359](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L359) |
| fun | `UserInfo.toAuthenticationState` | [384](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L384) |
| fun | `synchronizeAuthenticationState` | [387](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L387) |
| fun | `authenticatedUserOrNull` | [397](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L397) |
| fun | `currentUserEmail` | [407](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L407) |
| fun | `isAuthenticated` | [411](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L411) |
| fun | `currentUserAccount` | [413](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L413) |
| fun | `isProviderDisplayName` | [452](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L452) |
| fun | `isProviderAvatarUrl` | [457](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L457) |
| fun | `loadProfile` | [464](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L464) |
| fun | `saveProfileName` | [474](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L474) |
| fun | `uploadProfileAvatar` | [488](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L488) |
| fun | `currentDisplayName` | [519](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L519) |
| fun | `ensureProfileExists` | [523](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L523) |
| fun | `createReadingGroup` | [536](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L536) |
| fun | `joinReadingGroup` | [565](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L565) |
| fun | `loadReadingGroup` | [574](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L574) |
| fun | `loadReadingGroupForUser` | [580](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L580) |
| fun | `loadCurrentUserReadingGroups` | [584](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L584) |
| fun | `loadCurrentUserReadingGroup` | [589](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L589) |
| fun | `updateReadingGroup` | [593](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L593) |
| fun | `deleteReadingGroup` | [620](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L620) |
| fun | `loadGroupMembers` | [626](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L626) |
| fun | `loadMyGroupProfile` | [630](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L630) |
| fun | `updateMyGroupProfile` | [635](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L635) |
| fun | `uploadGroupProfileAvatar` | [645](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L645) |
| fun | `loadGroupRoles` | [654](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L654) |
| fun | `loadGroupLogo` | [659](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L659) |
| fun | `setGroupLogo` | [661](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L661) |
| fun | `setGroupMemberRole` | [666](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L666) |
| fun | `removeGroupMember` | [672](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L672) |
| fun | `createGroupInvitation` | [678](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L678) |
| fun | `loadGroupInvitations` | [689](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L689) |
| fun | `revokeGroupInvitation` | [694](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L694) |
| fun | `acceptGroupInvitation` | [700](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L700) |
| fun | `createGroupJoinRequest` | [708](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L708) |
| fun | `loadGroupJoinRequests` | [714](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L714) |
| fun | `reviewGroupJoinRequest` | [719](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L719) |
| fun | `loadGroupMedia` | [725](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L725) |
| fun | `uploadGroupMedia` | [731](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L731) |
| fun | `deleteGroupMedia` | [753](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L753) |
| fun | `loadGroupTasks` | [759](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L759) |
| fun | `createGroupTask` | [764](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L764) |
| fun | `updateGroupTaskProgress` | [788](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L788) |
| fun | `updateGroupTaskStatus` | [794](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L794) |
| fun | `loadGroupEvents` | [800](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L800) |
| fun | `createGroupEvent` | [805](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L805) |
| fun | `respondToGroupEvent` | [819](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L819) |
| fun | `updateGroupEventStatus` | [825](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L825) |
| fun | `loadGroupRules` | [831](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L831) |
| fun | `publishGroupRules` | [837](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L837) |
| fun | `loadGroupNotificationPreferences` | [845](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L845) |
| fun | `loadGroupPushPreferences` | [851](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L851) |
| fun | `saveGroupPushPreferences` | [859](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L859) |
| fun | `updateGroupNotificationPreferences` | [871](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L871) |
| fun | `loadGroupNotifications` | [884](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L884) |
| fun | `markGroupNotificationRead` | [895](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L895) |
| fun | `sendGroupNotification` | [905](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L905) |
| fun | `loadGroupModerationReports` | [923](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L923) |
| fun | `reviewGroupModerationReport` | [935](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L935) |
| fun | `loadGroupAuditLog` | [948](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L948) |
| fun | `recordGroupProgress` | [958](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L958) |
| fun | `sendGroupMessage` | [982](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L982) |
| fun | `loadGroupFeed` | [991](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L991) |
| fun | `toggleGroupFeedLike` | [995](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L995) |
| fun | `toggleGroupPostReaction` | [1001](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1001) |
| fun | `updateGroupPost` | [1007](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1007) |
| fun | `setGroupPostPinned` | [1015](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1015) |
| fun | `deleteGroupPost` | [1021](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1021) |
| fun | `reportGroupPost` | [1027](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1027) |
| fun | `deleteGroupPostComment` | [1033](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1033) |
| fun | `addGroupFeedComment` | [1039](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1039) |
| fun | `loadGroupLeaderboard` | [1047](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1047) |
| fun | `signIn` | [1051](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1051) |
| fun | `signUp` | [1059](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1059) |
| fun | `signInWithGoogle` | [1067](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1067) |
| fun | `requestPasswordReset` | [1071](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1071) |
| fun | `verifyAccountPassword` | [1076](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1076) |
| fun | `changeAccountPassword` | [1086](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1086) |
| fun | `requestPasswordChangeCode` | [1095](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1095) |
| fun | `completePasswordRecovery` | [1097](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1097) |
| fun | `dismissPasswordRecovery` | [1104](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1104) |
| fun | `changeAccountEmail` | [1106](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1106) |
| fun | `accountDeletionStatus` | [1114](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1114) |
| fun | `deleteOwnAccount` | [1117](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1117) |
| fun | `pushAccountId` | [1130](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1130) |
| fun | `registerPushDevice` | [1132](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1132) |
| fun | `unregisterPushDevice` | [1140](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1140) |
| class | `GroupPushTarget` | [1144](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1144) |
| fun | `groupPushTarget` | [1145](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1145) |
| fun | `signOut` | [1149](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1149) |
| fun | `handleDeeplinks` | [1155](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1155) |
| fun | `groupUnitLabel` | [1170](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1170) |
| fun | `JsonObject` | [1177](../../../app/src/main/java/com/Ameender/qurantracker/data/SupabaseService.kt#L1177) |

### app/src/main/java/com/Ameender/qurantracker/data/TranslationRepository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/data/TranslationRepository.kt), 76 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `TranslationSource` | [6](../../../app/src/main/java/com/Ameender/qurantracker/data/TranslationRepository.kt#L6) |
| class | `TranslationAyah` | [13](../../../app/src/main/java/com/Ameender/qurantracker/data/TranslationRepository.kt#L13) |
| class | `TranslationRepository` | [19](../../../app/src/main/java/com/Ameender/qurantracker/data/TranslationRepository.kt#L19) |
| fun | `getTranslation` | [21](../../../app/src/main/java/com/Ameender/qurantracker/data/TranslationRepository.kt#L21) |
| fun | `getTranslations` | [25](../../../app/src/main/java/com/Ameender/qurantracker/data/TranslationRepository.kt#L25) |
| fun | `getTranslations` | [39](../../../app/src/main/java/com/Ameender/qurantracker/data/TranslationRepository.kt#L39) |

### app/src/main/java/com/Ameender/qurantracker/domain/DailyGoalRules.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/domain/DailyGoalRules.kt), 11 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `deriveDailyGoalFromJourney` | [3](../../../app/src/main/java/com/Ameender/qurantracker/domain/DailyGoalRules.kt#L3) |

### app/src/main/java/com/Ameender/qurantracker/domain/HifzScores.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/domain/HifzScores.kt), 26 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `derivedJuzHifzScore` | [4](../../../app/src/main/java/com/Ameender/qurantracker/domain/HifzScores.kt#L4) |
| fun | `shouldConfirmJuzHifzScore` | [13](../../../app/src/main/java/com/Ameender/qurantracker/domain/HifzScores.kt#L13) |

### app/src/main/java/com/Ameender/qurantracker/domain/PlanningLabels.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/domain/PlanningLabels.kt), 9 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `PlanningTypeIcon` | [3](../../../app/src/main/java/com/Ameender/qurantracker/domain/PlanningLabels.kt#L3) |

### app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt), 30 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `QuranProgressType` | [7](../../../app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt#L7) |
| object | `QuranAction` | [14](../../../app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt#L14) |
| fun | `juzProgressId` | [19](../../../app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt#L19) |
| fun | `hizbProgressId` | [21](../../../app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt#L21) |
| fun | `rubProgressId` | [23](../../../app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt#L23) |
| fun | `surahProgressId` | [26](../../../app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt#L26) |
| fun | `todayDateKey` | [28](../../../app/src/main/java/com/Ameender/qurantracker/domain/QuranProgressKeys.kt#L28) |

### app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushGate.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushGate.kt), 29 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `GroupPushGate` | [10](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushGate.kt#L10) |
| fun | `initialize` | [13](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushGate.kt#L13) |
| fun | `dismiss` | [15](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushGate.kt#L15) |

### app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushPreferences.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushPreferences.kt), 17 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupPushPreferences` | [7](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushPreferences.kt#L7) |

### app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt), 108 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `GroupPushRegistration` | [20](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L20) |
| fun | `prefs` | [25](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L25) |
| fun | `installation` | [26](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L26) |
| fun | `initialize` | [29](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L29) |
| fun | `tokenChanged` | [53](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L53) |
| fun | `enqueue` | [57](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L57) |
| fun | `register` | [62](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L62) |
| fun | `beforeSignOut` | [81](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L81) |
| fun | `cancelGroupNotifications` | [91](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L91) |
| class | `GroupPushRegistrationWorker` | [98](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L98) |
| fun | `doWork` | [99](../../../app/src/main/java/com/Ameender/qurantracker/notifications/GroupPushRegistration.kt#L99) |

### app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt), 139 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `NotificationCoordinator` | [24](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L24) |
| fun | `initialize` | [28](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L28) |
| fun | `reconcileSoon` | [37](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L37) |
| fun | `reconcile` | [42](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L42) |
| fun | `scheduleNextReminder` | [68](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L68) |
| fun | `planning` | [90](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L90) |
| fun | `deliver` | [103](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L103) |
| fun | `language` | [129](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L129) |
| class | `NotificationReconcileWorker` | [132](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L132) |
| fun | `doWork` | [133](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationCoordinator.kt#L133) |

### app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt), 54 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `NotificationCategory` | [7](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L7) |
| class | `GroupNotificationMode` | [8](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L8) |
| class | `GroupEventType` | [9](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L9) |
| class | `QuietHours` | [11](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L11) |
| fun | `nextAllowed` | [13](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L13) |
| class | `NotificationPreferences` | [25](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L25) |
| object | `NotificationPolicy` | [37](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L37) |
| fun | `dailyAllowed` | [38](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L38) |
| fun | `planningAllowed` | [41](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L41) |
| fun | `groupAllowed` | [44](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPolicy.kt#L44) |

### app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPreferencesRepository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPreferencesRepository.kt), 41 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `NotificationPreferencesRepository` | [10](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPreferencesRepository.kt#L10) |
| fun | `load` | [14](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPreferencesRepository.kt#L14) |
| fun | `save` | [28](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationPreferencesRepository.kt#L28) |

### app/src/main/java/com/Ameender/qurantracker/notifications/NotificationText.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationText.kt), 73 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `notificationText` | [3](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationText.kt#L3) |
| fun | `notificationUnit` | [65](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationText.kt#L65) |

### app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt), 94 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `NotificationsState` | [14](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L14) |
| class | `NotificationsViewModel` | [27](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L27) |
| fun | `save` | [45](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L45) |
| fun | `retryGroups` | [59](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L59) |
| fun | `loadGroups` | [60](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L60) |
| fun | `saveGroupPush` | [71](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L71) |
| fun | `loadOverride` | [75](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L75) |
| fun | `saveOverride` | [79](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L79) |
| fun | `remoteSave` | [83](../../../app/src/main/java/com/Ameender/qurantracker/notifications/NotificationsViewModel.kt#L83) |

### app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt), 129 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranMessagingService` | [23](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt#L23) |
| fun | `onNewToken` | [24](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt#L24) |
| fun | `onMessageReceived` | [26](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt#L26) |
| fun | `initialize` | [64](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt#L64) |
| fun | `createChannel` | [69](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt#L69) |
| fun | `validPushUuid` | [78](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt#L78) |
| class | `GroupPushDisplayWorker` | [81](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt#L81) |
| fun | `doWork` | [82](../../../app/src/main/java/com/Ameender/qurantracker/notifications/QuranMessagingService.kt#L82) |

### app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt), 266 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `accountManagementText` | [29](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L29) |
| class | `AccountAction` | [79](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L79) |
| fun | `AccountManagementPanel` | [82](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L82) |
| fun | `t` | [85](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L85) |
| fun | `ForgotPasswordButton` | [111](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L111) |
| fun | `AccountRecoveryHost` | [120](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L120) |
| fun | `AccountActionDialog` | [126](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L126) |
| fun | `t` | [127](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L127) |
| fun | `submit` | [159](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L159) |
| fun | `AccountPasswordField` | [255](../../../app/src/main/java/com/Ameender/qurantracker/ui/AccountManagement.kt#L255) |

### app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt), 1306 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `ReminderTimeDialog` | [40](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L40) |
| fun | `ReminderQuickChip` | [115](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L115) |
| fun | `TimeStepper` | [130](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L130) |
| fun | `AgendaScreen` | [174](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L174) |
| fun | `WeekStrip` | [329](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L329) |
| fun | `AgendaWeekDayCell` | [384](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L384) |
| fun | `UpcomingPlanningList` | [413](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L413) |
| fun | `UpcomingPlanningRow` | [449](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L449) |
| fun | `AgendaMonthGrid` | [477](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L477) |
| fun | `PlannerCard` | [527](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L527) |
| fun | `PlannerSectionHeader` | [535](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L535) |
| class | `AgendaDayStatus` | [546](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L546) |
| fun | `agendaDayStatus` | [548](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L548) |
| fun | `agendaStatusColor` | [560](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L560) |
| fun | `agendaStatusSurface` | [569](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L569) |
| fun | `agendaWeekDates` | [578](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L578) |
| fun | `agendaDateOffset` | [596](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L596) |
| fun | `agendaLocale` | [606](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L606) |
| fun | `agendaWeekCalendars` | [612](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L612) |
| fun | `formatWeekdayLabel` | [620](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L620) |
| fun | `formatAgendaDate` | [626](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L626) |
| fun | `planningTypeLabel` | [632](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L632) |
| fun | `upcomingPlanningIcon` | [639](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L639) |
| fun | `upcomingDayLabel` | [645](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L645) |
| fun | `formatPlanningReminder` | [658](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L658) |
| fun | `PlanningItemCard` | [665](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L665) |
| fun | `AddPlanningItemSheet` | [823](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L823) |
| fun | `KhatmaPlannerBlock` | [1103](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L1103) |
| fun | `khatmaPreview` | [1204](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L1204) |
| fun | `khatmaPartRangeLabel` | [1214](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L1214) |
| fun | `NumberPicker` | [1243](../../../app/src/main/java/com/Ameender/qurantracker/ui/AgendaScreen.kt#L1243) |

### app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt), 420 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `QuranPrimaryButton` | [57](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L57) |
| fun | `QuranSecondaryButton` | [90](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L90) |
| fun | `QuranIconButton` | [123](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L123) |
| fun | `QuranAppCard` | [145](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L145) |
| fun | `QuranStatisticCard` | [169](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L169) |
| fun | `QuranProgressCard` | [181](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L181) |
| fun | `QuranProgressRow` | [190](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L190) |
| fun | `QuranAyahCard` | [220](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L220) |
| fun | `QuranSurahCard` | [246](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L246) |
| fun | `QuranAppDialog` | [309](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L309) |
| fun | `QuranSnackbar` | [350](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L350) |
| fun | `QuranLoadingIndicator` | [362](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L362) |
| fun | `QuranEmptyState` | [371](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L371) |
| fun | `QuranErrorState` | [381](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L381) |
| fun | `QuranOfflineState` | [390](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L390) |
| fun | `QuranStateBlock` | [399](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppComponents.kt#L399) |

### app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt), 4468 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupFormStrings` | [3](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L3) |
| class | `GroupTypeStrings` | [39](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L39) |
| class | `GroupUnitStrings` | [49](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L49) |
| class | `GroupGoalStrings` | [66](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L66) |
| class | `GroupPrivacyStrings` | [79](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L79) |
| class | `GroupPermissionStrings` | [85](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L85) |
| class | `GroupJoinStrings` | [92](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L92) |
| class | `GroupHomeStrings` | [103](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L103) |
| class | `GroupFeedStrings` | [112](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L112) |
| class | `GroupProgressStrings` | [122](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L122) |
| class | `GroupMembersStrings` | [134](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L134) |
| class | `GroupSettingsStrings` | [142](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L142) |
| class | `GroupCreateStrings` | [151](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L151) |
| class | `GroupOpenStrings` | [157](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L157) |
| class | `GroupManagementStrings` | [161](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L161) |
| class | `AppStrings` | [214](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L214) |
| fun | `t` | [629](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L629) |
| fun | `formatCountOfTotal` | [634](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L634) |
| fun | `formatAyahCount` | [637](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L637) |
| fun | `formatHizb` | [640](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L640) |
| fun | `formatJuz` | [643](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L643) |
| fun | `formatSurah` | [646](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L646) |
| object | `AppText` | [702](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L702) |
| fun | `strings` | [703](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L703) |
| fun | `languageLabel` | [709](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L709) |
| fun | `dutchUi` | [1966](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L1966) |
| fun | `englishUi` | [2799](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L2799) |
| fun | `arabicUi` | [3632](../../../app/src/main/java/com/Ameender/qurantracker/ui/AppText.kt#L3632) |

### app/src/main/java/com/Ameender/qurantracker/ui/AsbabAvailability.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/AsbabAvailability.kt), 52 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AsbabAvailability` | [12](../../../app/src/main/java/com/Ameender/qurantracker/ui/AsbabAvailability.kt#L12) |
| fun | `ayahs` | [13](../../../app/src/main/java/com/Ameender/qurantracker/ui/AsbabAvailability.kt#L13) |
| fun | `has` | [14](../../../app/src/main/java/com/Ameender/qurantracker/ui/AsbabAvailability.kt#L14) |
| object | `AsbabIndex` | [17](../../../app/src/main/java/com/Ameender/qurantracker/ui/AsbabAvailability.kt#L17) |
| fun | `load` | [22](../../../app/src/main/java/com/Ameender/qurantracker/ui/AsbabAvailability.kt#L22) |

### app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt), 1385 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `NoteStrings` | [123](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L123) |
| fun | `noteStrings` | [156](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L156) |
| object | `NoteLayoutColors` | [245](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L245) |
| fun | `AyahNotesScreen` | [263](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L263) |
| fun | `label` | [270](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L270) |
| fun | `fingerprint` | [324](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L324) |
| fun | `leaveEditor` | [326](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L326) |
| fun | `openNote` | [330](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L330) |
| fun | `noteReference` | [700](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L700) |
| fun | `noteDisplayTitle` | [703](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L703) |
| fun | `CompactNoteRow` | [708](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L708) |
| fun | `NotesFilterSheet` | [752](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L752) |
| fun | `NoteTagChipRow` | [777](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L777) |
| fun | `NoteFilterChip` | [797](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L797) |
| fun | `noteTagCategories` | [816](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L816) |
| fun | `noteTagList` | [822](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L822) |
| fun | `toggleTagText` | [828](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L828) |
| fun | `buildNotesExportJson` | [839](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L839) |
| fun | `notesExportFileName` | [883](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L883) |
| fun | `epochMillisToIso` | [888](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L888) |
| fun | `EditorToolbar` | [892](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L892) |
| fun | `FormatChip` | [961](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L961) |
| fun | `ColorChip` | [977](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L977) |
| fun | `FormattedNoteText` | [999](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L999) |
| fun | `FormattedListLine` | [1084](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1084) |
| fun | `noteDisplayFontSize` | [1110](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1110) |
| fun | `noteTextDecoration` | [1117](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1117) |
| class | `NoteTextColor` | [1124](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1124) |
| fun | `noteTextColors` | [1126](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1126) |
| fun | `noteTextColor` | [1135](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1135) |
| class | `ActiveNoteFormat` | [1138](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1138) |
| class | `NoteFormatSpan` | [1157](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1157) |
| class | `NoteFormatVisualTransformation` | [1169](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1169) |
| fun | `filter` | [1172](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1172) |
| fun | `buildFormattedNoteString` | [1177](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1177) |
| fun | `updateFormatSpansForTextChange` | [1199](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1199) |
| fun | `mergeAdjacentFormatSpans` | [1263](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1263) |
| fun | `encodeFormatSpans` | [1287](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1287) |
| fun | `decodeFormatSpans` | [1302](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1302) |
| fun | `isTodoChecked` | [1321](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1321) |
| fun | `cleanTodoLine` | [1323](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1323) |
| fun | `toggleTodoLine` | [1332](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1332) |
| fun | `noteTextFieldColors` | [1346](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1346) |
| fun | `NotesChip` | [1361](../../../app/src/main/java/com/Ameender/qurantracker/ui/AyahNotesScreen.kt#L1361) |

### app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt), 833 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `BookDefinition` | [67](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L67) |
| class | `BookPage` | [79](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L79) |
| class | `BookChapter` | [85](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L85) |
| class | `BookContent` | [90](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L90) |
| class | `BookSearchResult` | [95](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L95) |
| class | `BookMenuStrings` | [101](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L101) |
| class | `BookReaderStrings` | [106](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L106) |
| fun | `BookReaderScreen` | [204](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L204) |
| fun | `BookNavigationCard` | [388](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L388) |
| fun | `BookSearchCard` | [533](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L533) |
| fun | `SearchResultRow` | [592](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L592) |
| object | `BookDatabase` | [617](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L617) |
| fun | `loadBook` | [621](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L621) |
| fun | `loadPageText` | [663](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L663) |
| fun | `search` | [677](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L677) |
| fun | `openDatabase` | [714](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L714) |
| fun | `searchPreview` | [726](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L726) |
| fun | `cleanBookText` | [735](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L735) |
| fun | `bookMenuStrings` | [747](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L747) |
| fun | `BookDefinition.summaryFor` | [756](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L756) |
| fun | `bookReaderStrings` | [765](../../../app/src/main/java/com/Ameender/qurantracker/ui/BookReaderScreen.kt#L765) |

### app/src/main/java/com/Ameender/qurantracker/ui/DailyGoalNumbers.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/DailyGoalNumbers.kt), 12 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `dailyGoalNumber` | [3](../../../app/src/main/java/com/Ameender/qurantracker/ui/DailyGoalNumbers.kt#L3) |
| fun | `dailyGoalCountLabel` | [8](../../../app/src/main/java/com/Ameender/qurantracker/ui/DailyGoalNumbers.kt#L8) |

### app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt), 2368 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `DashboardScreen` | [47](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L47) |
| fun | `TodayFocusCard` | [385](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L385) |
| fun | `TodayGoalPie` | [505](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L505) |
| fun | `ReadingJourneyCard` | [579](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L579) |
| fun | `ReadingJourneyViewChip` | [744](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L744) |
| fun | `JourneyProgressSummary` | [764](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L764) |
| fun | `JourneyProgressDetails` | [799](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L799) |
| class | `ReadingJourneyProgressView` | [827](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L827) |
| fun | `JourneyProgressPie` | [833](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L833) |
| fun | `TodayPlanRow` | [892](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L892) |
| class | `PointsPopupState` | [938](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L938) |
| fun | `PointsEarnedPopup` | [945](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L945) |
| fun | `QuickCheckInDialog` | [979](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L979) |
| fun | `QuickCheckSelectedInfo` | [1124](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1124) |
| fun | `QuickCheckStepper` | [1159](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1159) |
| fun | `PeriodProgressCard` | [1226](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1226) |
| fun | `MotivationPointsCard` | [1297](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1297) |
| fun | `DashboardReadingStatsCard` | [1393](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1393) |
| fun | `DashboardStatTile` | [1466](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1466) |
| fun | `StreakFireBar` | [1488](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1488) |
| fun | `SimpleProgressBar` | [1533](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1533) |
| fun | `PeriodStatTile` | [1556](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1556) |
| fun | `HifzOverviewCard` | [1583](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1583) |
| fun | `HifzBrowseScoreTile` | [1707](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1707) |
| fun | `HifzRecommendationSection` | [1739](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1739) |
| fun | `HifzScoreRow` | [1757](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1757) |
| fun | `ReviewDueCard` | [1785](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1785) |
| fun | `ReviewDueRow` | [1837](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1837) |
| class | `HifzOverview` | [1889](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1889) |
| class | `HifzBrowseScore` | [1905](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1905) |
| class | `HifzScoreItem` | [1911](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1911) |
| class | `ReviewDueItem` | [1921](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1921) |
| class | `HifzRawScore` | [1930](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1930) |
| fun | `calculateHifzOverview` | [1937](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L1937) |
| fun | `HifzScoreItem.toReviewDueItem` | [2035](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2035) |
| fun | `reviewIntervalDays` | [2048](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2048) |
| fun | `reviewDateKey` | [2056](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2056) |
| class | `DashboardPeriodStats` | [2063](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2063) |
| class | `MotivationPointsStats` | [2070](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2070) |
| fun | `calculatePeriodStats` | [2084](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2084) |
| fun | `calculateMotivationPoints` | [2107](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2107) |
| fun | `readingMotivationPoints` | [2149](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2149) |
| fun | `motivationBonusPoints` | [2155](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2155) |
| fun | `motivationHistoryLabel` | [2166](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2166) |
| fun | `quickCheckInPoints` | [2173](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2173) |
| fun | `quickCheckInLabel` | [2181](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2181) |
| fun | `localizedGoalUnitLabel` | [2189](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2189) |
| class | `MotivationLevel` | [2198](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2198) |
| fun | `motivationLevel` | [2200](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2200) |
| fun | `startOfDay` | [2209](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2209) |
| fun | `startOfWeek` | [2217](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2217) |
| fun | `startOfMonth` | [2223](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2223) |
| class | `ReadingJourneyProgress` | [2228](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2228) |
| class | `JourneyStatus` | [2241](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2241) |
| fun | `calculateReadingJourneyProgress` | [2247](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2247) |
| fun | `plannedJourneyParts` | [2293](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2293) |
| fun | `completedHizbCountFromRub` | [2315](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2315) |
| fun | `completedJuzCountFromRub` | [2322](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2322) |
| fun | `StatCard` | [2334](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2334) |
| fun | `ProgressBar` | [2353](../../../app/src/main/java/com/Ameender/qurantracker/ui/DashboardScreen.kt#L2353) |

### app/src/main/java/com/Ameender/qurantracker/ui/FocusDemoTimer.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusDemoTimer.kt), 21 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `FocusDemoTimer` | [4](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusDemoTimer.kt#L4) |
| fun | `sample` | [11](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusDemoTimer.kt#L11) |
| fun | `pause` | [16](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusDemoTimer.kt#L16) |
| fun | `toggle` | [17](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusDemoTimer.kt#L17) |

### app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt), 470 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `FocusGoal` | [52](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L52) |
| class | `FocusStrings` | [54](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L54) |
| fun | `focusStrings` | [74](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L74) |
| fun | `FocusSessionScreen` | [194](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L194) |
| fun | `FocusFloatingTimer` | [359](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L359) |
| fun | `FocusPanel` | [383](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L383) |
| fun | `FocusGoalRow` | [397](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L397) |
| fun | `FocusDurationChip` | [416](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L416) |
| fun | `FocusTimerCard` | [437](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L437) |
| fun | `formatFocusTime` | [465](../../../app/src/main/java/com/Ameender/qurantracker/ui/FocusSessionScreen.kt#L465) |

### app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt), 1117 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AudioTrack` | [83](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L83) |
| class | `AudioPlaybackState` | [94](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L94) |
| class | `AudioErrorType` | [104](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L104) |
| class | `GlobalAudioPlayer` | [110](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L110) |
| fun | `playSelection` | [136](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L136) |
| fun | `run` | [180](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L180) |
| fun | `completeTrack` | [190](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L190) |
| fun | `play` | [251](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L251) |
| fun | `playInternal` | [258](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L258) |
| fun | `ready` | [287](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L287) |
| fun | `pause` | [326](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L326) |
| fun | `resume` | [336](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L336) |
| fun | `togglePlayPause` | [367](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L367) |
| fun | `retry` | [375](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L375) |
| fun | `stop` | [380](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L380) |
| fun | `seekTo` | [400](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L400) |
| fun | `skipBack` | [407](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L407) |
| fun | `skipForward` | [409](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L409) |
| fun | `skipBy` | [411](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L411) |
| fun | `updatePlaybackSpeed` | [415](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L415) |
| fun | `updateSkipInterval` | [422](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L422) |
| fun | `updateRepeat` | [428](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L428) |
| fun | `updateAutoplay` | [434](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L434) |
| fun | `setSleepTimer` | [439](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L439) |
| fun | `replaceCurrentTrack` | [445](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L445) |
| fun | `updatePosition` | [449](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L449) |
| fun | `release` | [461](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L461) |
| fun | `applyPlaybackSpeed` | [466](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L466) |
| fun | `normalizePlaybackSpeed` | [473](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L473) |
| fun | `normalizeSkipInterval` | [476](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L476) |
| fun | `rememberGlobalAudioPlayer` | [480](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L480) |
| fun | `GlobalMiniPlayer` | [518](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L518) |
| fun | `MiniPlayerPlayButton` | [648](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L648) |
| fun | `MiniPlayerIconButton` | [681](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L681) |
| fun | `ExpandedAudioPlayerSheet` | [689](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L689) |
| fun | `AudioStateMessage` | [915](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L915) |
| fun | `ExpandedSkipButton` | [950](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L950) |
| fun | `AudioPreferenceSection` | [969](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L969) |
| fun | `AudioChoiceButton` | [994](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L994) |
| fun | `AudioToggleRow` | [1020](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1020) |
| fun | `AudioSpeedDropdown` | [1051](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1051) |
| fun | `replayIcon` | [1070](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1070) |
| fun | `forwardIcon` | [1073](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1073) |
| fun | `audioSurahTitle` | [1076](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1076) |
| fun | `audioMiniMeta` | [1079](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1079) |
| fun | `audioStateLabel` | [1091](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1091) |
| fun | `audioProgress` | [1105](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1105) |
| fun | `formatPlaybackSpeed` | [1108](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1108) |
| fun | `formatAudioPlayerTime` | [1111](../../../app/src/main/java/com/Ameender/qurantracker/ui/GlobalAudioPlayer.kt#L1111) |

### app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt), 362 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `goalLabel` | [21](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L21) |
| fun | `goalUnitLabel` | [26](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L26) |
| fun | `goalText` | [32](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L32) |
| fun | `GoalHubPanel` | [38](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L38) |
| fun | `defaultGoalContentType` | [250](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L250) |
| fun | `contentTypeLabel` | [256](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L256) |
| fun | `contentNumberLabel` | [262](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L262) |
| fun | `sessionContent` | [268](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L268) |
| fun | `contentDisplayName` | [274](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L274) |
| fun | `validPlannedContent` | [281](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L281) |
| fun | `GoalManagementCard` | [289](../../../app/src/main/java/com/Ameender/qurantracker/ui/GoalHubPanel.kt#L289) |

### app/src/main/java/com/Ameender/qurantracker/ui/GroupCommentsSheet.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupCommentsSheet.kt), 97 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `GroupCommentsSheet` | [24](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupCommentsSheet.kt#L24) |

### app/src/main/java/com/Ameender/qurantracker/ui/GroupErrors.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupErrors.kt), 39 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `localizedGroupError` | [3](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupErrors.kt#L3) |

### app/src/main/java/com/Ameender/qurantracker/ui/GroupFeedPresentation.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupFeedPresentation.kt), 25 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `feedCommentLabel` | [9](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupFeedPresentation.kt#L9) |
| fun | `feedTimestamp` | [15](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupFeedPresentation.kt#L15) |

### app/src/main/java/com/Ameender/qurantracker/ui/GroupJoinRouting.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupJoinRouting.kt), 10 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `requiresGroupAccessRequest` | [4](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupJoinRouting.kt#L4) |

### app/src/main/java/com/Ameender/qurantracker/ui/GroupLogo.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupLogo.kt), 140 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `GroupLogo` | [32](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupLogo.kt#L32) |

### app/src/main/java/com/Ameender/qurantracker/ui/GroupMemberReadingSheet.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupMemberReadingSheet.kt), 110 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `groupReadingLabel` | [26](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupMemberReadingSheet.kt#L26) |
| fun | `groupReadingAyahRange` | [41](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupMemberReadingSheet.kt#L41) |
| fun | `label` | [59](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupMemberReadingSheet.kt#L59) |
| fun | `groupReadingDate` | [67](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupMemberReadingSheet.kt#L67) |
| fun | `GroupMemberReadingSheet` | [76](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupMemberReadingSheet.kt#L76) |

### app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt), 411 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `GroupsOverviewScreen` | [57](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt#L57) |
| fun | `GroupsOverviewLoading` | [193](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt#L193) |
| fun | `GroupsOverviewTabs` | [214](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt#L214) |
| fun | `GroupsSectionTitle` | [248](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt#L248) |
| fun | `ActiveGroupCard` | [268](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt#L268) |
| fun | `GroupsEmptyCard` | [313](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt#L313) |
| fun | `InvitationCard` | [339](../../../app/src/main/java/com/Ameender/qurantracker/ui/GroupsOverviewScreen.kt#L339) |

### app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt), 10964 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `SelectorOption` | [136](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L136) |
| class | `PendingGroupMediaUpload` | [143](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L143) |
| class | `MembershipAdminSnapshot` | [150](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L150) |
| class | `PermissionToggleOption` | [157](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L157) |
| fun | `HamburgerMenu` | [222](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L222) |
| fun | `GroupsSettingsPage` | [726](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L726) |
| fun | `AuthenticatedGroupsSettingsPage` | [767](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L767) |
| fun | `friendlyGroupError` | [862](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L862) |
| fun | `invitationLanguage` | [958](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L958) |
| fun | `groupInviteLink` | [960](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L960) |
| fun | `groupAppInviteLink` | [961](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L961) |
| fun | `loadStoredGoalConfig` | [963](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L963) |
| fun | `loadStoredPrivacy` | [975](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L975) |
| fun | `saveStoredGoalConfig` | [981](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L981) |
| fun | `saveStoredPrivacy` | [997](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L997) |
| fun | `validateGroupForm` | [1005](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1005) |
| fun | `applyGroupDetails` | [1012](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1012) |
| fun | `openGroup` | [1028](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1028) |
| fun | `startCreatingGroup` | [1090](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1090) |
| fun | `cancelCreatingGroup` | [1117](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1117) |
| fun | `openGroup` | [1123](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1123) |
| fun | `loadGroupMembers` | [1141](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1141) |
| fun | `loadGroupMedia` | [1155](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1155) |
| fun | `loadGroupTasks` | [1173](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1173) |
| fun | `loadGroupEvents` | [1189](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1189) |
| fun | `openMyGroupProfile` | [1205](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1205) |
| fun | `saveMyGroupProfile` | [1215](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1215) |
| fun | `uploadPendingGroupMedia` | [1250](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1250) |
| fun | `createGroupTask` | [1278](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1278) |
| fun | `updateTaskProgress` | [1322](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1322) |
| fun | `applyTaskStatusChange` | [1349](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1349) |
| fun | `createGroupEvent` | [1372](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1372) |
| fun | `respondToGroupEvent` | [1406](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1406) |
| fun | `applyEventStatusChange` | [1420](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1420) |
| fun | `confirmDeleteGroupMedia` | [1436](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1436) |
| fun | `loadMembershipAdminData` | [1457](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1457) |
| fun | `secureInvitationLinks` | [1480](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1480) |
| fun | `copySecureInvitation` | [1487](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1487) |
| fun | `shareSecureInvitation` | [1494](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1494) |
| fun | `createSecureInvitation` | [1506](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1506) |
| fun | `revokeInvitation` | [1526](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1526) |
| fun | `saveMemberRole` | [1539](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1539) |
| fun | `confirmRemoveMember` | [1554](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1554) |
| fun | `reviewJoinRequest` | [1569](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1569) |
| fun | `submitJoinRequest` | [1585](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1585) |
| fun | `shareActiveGroupCode` | [1608](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1608) |
| fun | `copyActiveGroupCode` | [1624](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1624) |
| fun | `handleCreateGroup` | [1634](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1634) |
| fun | `saveGroupSettings` | [1673](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1673) |
| fun | `deleteActiveGroup` | [1709](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1709) |
| fun | `loadGroupFeed` | [1773](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1773) |
| fun | `shareGroupProgress` | [1795](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1795) |
| fun | `sendFeedMessage` | [1834](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1834) |
| fun | `reactToFeedPost` | [1863](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1863) |
| fun | `nextCounts` | [1867](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1867) |
| fun | `updateFeedPost` | [1905](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1905) |
| fun | `toggleFeedPostPinned` | [1931](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1931) |
| fun | `confirmDeleteFeedPost` | [1949](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1949) |
| fun | `submitFeedPostReport` | [1964](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1964) |
| fun | `confirmDeleteFeedComment` | [1985](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L1985) |
| fun | `submitFeedComment` | [2010](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L2010) |
| fun | `loadLeaderboard` | [2056](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L2056) |
| fun | `joinOnlineGroup` | [2074](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L2074) |
| fun | `GroupCommunityContent` | [2640](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L2640) |
| fun | `GroupDialogSystemBars` | [2985](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L2985) |
| fun | `GroupCreateWizard` | [3001](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3001) |
| fun | `GroupCreateProgress` | [3198](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3198) |
| fun | `GroupWizardChoiceChip` | [3255](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3255) |
| fun | `GroupEmptyStateCard` | [3285](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3285) |
| fun | `JoinGroupCard` | [3401](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3401) |
| fun | `GroupHomeScreen` | [3452](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3452) |
| fun | `PremiumGroupHeader` | [3736](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3736) |
| fun | `GroupHeaderIconButton` | [3863](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3863) |
| fun | `GroupMetaPill` | [3882](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3882) |
| fun | `GroupHeaderStat` | [3897](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3897) |
| fun | `GroupInlineStatus` | [3913](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3913) |
| fun | `GroupFeatureEmptyState` | [3929](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3929) |
| fun | `GroupMediaTab` | [3951](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L3951) |
| fun | `GroupTasksTab` | [4058](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4058) |
| fun | `GroupTaskFilterChip` | [4150](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4150) |
| fun | `GroupTasksSkeleton` | [4167](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4167) |
| fun | `GroupTaskCard` | [4191](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4191) |
| fun | `GroupTaskStatusBadge` | [4331](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4331) |
| fun | `GroupTaskMeta` | [4350](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4350) |
| fun | `GroupMediaSkeleton` | [4358](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4358) |
| fun | `GroupMediaTile` | [4384](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4384) |
| fun | `UploadGroupMediaDialog` | [4453](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4453) |
| fun | `GroupMediaPreviewDialog` | [4530](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4530) |
| fun | `groupPrivacyLabel` | [4619](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4619) |
| fun | `groupRoleLabel` | [4625](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4625) |
| fun | `canManageGroupMembership` | [4632](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4632) |
| fun | `canCreateGroupTasks` | [4635](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4635) |
| fun | `canUploadGroupMedia` | [4638](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4638) |
| fun | `GroupEventsTab` | [4642](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4642) |
| fun | `GroupEventCard` | [4698](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4698) |
| fun | `canCreateGroupEvents` | [4790](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4790) |
| fun | `groupTaskTypeIcon` | [4792](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4792) |
| fun | `groupTaskTypeLabel` | [4799](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4799) |
| fun | `groupTaskUnitLabel` | [4802](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4802) |
| fun | `groupTaskDueLabel` | [4812](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4812) |
| fun | `groupRoleRank` | [4816](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4816) |
| fun | `groupLanguageLabel` | [4823](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4823) |
| fun | `GroupSummaryCard` | [4831](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4831) |
| fun | `GroupTabs` | [4911](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4911) |
| fun | `GroupLeaderboardTab` | [4966](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4966) |
| fun | `GroupDashboardTab` | [4991](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L4991) |
| fun | `GroupDashboardMetric` | [5063](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5063) |
| fun | `GroupFeedTab` | [5078](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5078) |
| fun | `GroupFeedSectionTitle` | [5187](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5187) |
| fun | `FeedComposer` | [5195](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5195) |
| fun | `GroupMembersTab` | [5276](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5276) |
| fun | `GroupMembershipEmptyState` | [5493](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5493) |
| fun | `JoinRequestCard` | [5510](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5510) |
| fun | `InvitationStatusCard` | [5559](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5559) |
| fun | `GroupMemberAvatar` | [5593](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5593) |
| fun | `MemberListItem` | [5612](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5612) |
| fun | `MemberRoleBadge` | [5680](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5680) |
| fun | `GroupProgressTab` | [5700](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5700) |
| fun | `GroupProgressCard` | [5784](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5784) |
| fun | `PersonalProgressCard` | [5830](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5830) |
| fun | `AddProgressCard` | [5849](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5849) |
| class | `GroupProgressPreview` | [5920](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5920) |
| fun | `GroupProgressPreviewCard` | [5929](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5929) |
| fun | `GroupLeaderboardStat` | [5957](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5957) |
| fun | `GroupMetricPill` | [5972](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5972) |
| fun | `GroupFormHeader` | [5986](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L5986) |
| fun | `AdminOnlyGuard` | [6018](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6018) |
| fun | `FormSectionCard` | [6055](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6055) |
| fun | `GroupDetailsCard` | [6074](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6074) |
| fun | `GroupFormTextField` | [6117](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6117) |
| fun | `GroupSettingsScreen` | [6160](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6160) |
| fun | `GroupSettingsForm` | [6251](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6251) |
| fun | `GroupDangerZone` | [6386](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6386) |
| fun | `GroupPrimaryActionButton` | [6502](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6502) |
| fun | `GroupLeaderboardSection` | [6535](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6535) |
| fun | `GroupNoActivityCard` | [6559](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6559) |
| fun | `GroupTypeSelector` | [6568](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6568) |
| fun | `ProgressUnitSelector` | [6610](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6610) |
| fun | `GroupGoalCard` | [6652](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6652) |
| fun | `PrivacyAccessCard` | [6708](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6708) |
| fun | `MemberPermissionsCard` | [6784](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6784) |
| fun | `GoalPeriodSelector` | [6838](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6838) |
| fun | `GoalValueInput` | [6871](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6871) |
| fun | `GoalSummary` | [6941](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6941) |
| fun | `SelectionOptionCard` | [6966](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L6966) |
| fun | `GroupUnitChips` | [7012](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7012) |
| fun | `GroupBadge` | [7032](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7032) |
| fun | `groupGoalTypeLabel` | [7042](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7042) |
| fun | `GroupLeaderboardRow` | [7047](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7047) |
| fun | `FeedPostCard` | [7116](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7116) |
| fun | `FeedActions` | [7281](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7281) |
| fun | `GroupPostMenuItem` | [7366](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7366) |
| fun | `groupRoleCanModerateContent` | [7379](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7379) |
| fun | `groupRoleCanPinPosts` | [7382](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7382) |
| fun | `groupReactionIcon` | [7384](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7384) |
| fun | `groupReactionColor` | [7391](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7391) |
| fun | `groupReactionLabel` | [7398](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7398) |
| fun | `MemberRoleDialog` | [7402](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7402) |
| fun | `RemoveGroupMemberDialog` | [7466](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7466) |
| fun | `GroupInvitationManagerDialog` | [7521](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7521) |
| fun | `CreateJoinRequestDialog` | [7630](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7630) |
| fun | `EditGroupPostDialog` | [7687](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7687) |
| fun | `CreateGroupTaskDialog` | [7744](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7744) |
| fun | `GroupTaskProgressDialog` | [7908](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7908) |
| fun | `GroupTaskDialogLabel` | [7976](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7976) |
| fun | `GroupTaskChoiceChip` | [7981](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L7981) |
| fun | `groupDialogTextFieldColors` | [8005](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8005) |
| fun | `CreateGroupEventDialog` | [8016](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8016) |
| fun | `ConfirmGroupEventStatusDialog` | [8113](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8113) |
| fun | `GroupProfileDialog` | [8140](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8140) |
| fun | `ConfirmGroupTaskStatusDialog` | [8202](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8202) |
| fun | `ConfirmFeedDeleteDialog` | [8258](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8258) |
| fun | `ReportGroupPostDialog` | [8302](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8302) |
| class | `AccountStrings` | [8390](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8390) |
| fun | `accountStrings` | [8433](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8433) |
| fun | `AccountMenuRow` | [8605](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8605) |
| fun | `AccountSettingsPage` | [8651](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8651) |
| fun | `label` | [8660](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8660) |
| fun | `requireSupabase` | [8760](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8760) |
| fun | `validateEmailLogin` | [8768](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8768) |
| fun | `validateSignup` | [8783](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8783) |
| fun | `authError` | [8793](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L8793) |
| fun | `AccountProfilePanel` | [9146](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9146) |
| fun | `ProfileAvatar` | [9268](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9268) |
| fun | `MediaSettingsPage` | [9303](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9303) |
| class | `MushafLibraryOption` | [9412](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9412) |
| fun | `MushafSettingsPage` | [9474](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9474) |
| fun | `MushafLibraryRow` | [9632](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9632) |
| fun | `MushafLibraryOption.isInstalled` | [9692](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9692) |
| fun | `downloadedMushafPdfFile` | [9698](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9698) |
| fun | `internalMushafPdfFile` | [9702](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9702) |
| fun | `externalMushafPdfFile` | [9705](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9705) |
| fun | `downloadedMushafPageFile` | [9708](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9708) |
| fun | `downloadedMushafPageCount` | [9714](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9714) |
| fun | `downloadedMushafPageExtension` | [9720](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9720) |
| fun | `downloadMushafPdf` | [9723](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9723) |
| fun | `downloadMaknoonPages` | [9748](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9748) |
| fun | `downloadSizeLabel` | [9792](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9792) |
| fun | `SettingsHeader` | [9819](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9819) |
| fun | `SettingsCard` | [9836](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9836) |
| fun | `SettingsGap` | [9848](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9848) |
| fun | `SettingsDivider` | [9853](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9853) |
| fun | `SettingsTextField` | [9858](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9858) |
| fun | `SettingsActionRow` | [9885](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9885) |
| fun | `SettingsSmallNavRow` | [9919](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9919) |
| fun | `SettingsBookmarkRow` | [9941](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9941) |
| fun | `SettingsReciterRow` | [9968](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L9968) |
| fun | `SettingsChoiceChip` | [10017](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10017) |
| fun | `SettingsSwatch` | [10054](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10054) |
| fun | `MenuSwitchRow` | [10071](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10071) |
| fun | `MenuItemExpandableRow` | [10107](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10107) |
| fun | `HifzRangeEditor` | [10138](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10138) |
| fun | `HifzRangeField` | [10204](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10204) |
| fun | `DailyGoalEditor` | [10253](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10253) |
| fun | `ReadingJourneyEditor` | [10345](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10345) |
| fun | `StepperRow` | [10464](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10464) |
| fun | `EditableStepperRow` | [10508](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10508) |
| fun | `dailyGoalMaxForUnit` | [10586](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10586) |
| fun | `dailyGoalUnitLabel` | [10595](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10595) |
| fun | `todayDateKey` | [10604](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10604) |
| fun | `hifzRangeMax` | [10607](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10607) |
| fun | `appLanguageLabel` | [10613](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10613) |
| fun | `themeModeLabel` | [10620](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10620) |
| fun | `mushafDisplayName` | [10635](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10635) |
| fun | `rewayaFilterLabel` | [10638](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10638) |
| fun | `buildGroupCode` | [10652](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10652) |
| fun | `formatGroupCodeInput` | [10665](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10665) |
| fun | `isValidGroupCode` | [10674](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10674) |
| fun | `contentUriDisplayName` | [10677](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10677) |
| fun | `formatGroupMediaSize` | [10698](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10698) |
| fun | `defaultGroupEventDate` | [10704](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10704) |
| fun | `parseGroupEventWindow` | [10709](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10709) |
| fun | `groupEventDateLabel` | [10719](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10719) |
| fun | `normalizeGroupType` | [10736](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10736) |
| fun | `normalizeProgressUnit` | [10746](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10746) |
| fun | `normalizeGoalPeriod` | [10757](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10757) |
| fun | `normalizeGroupPrivacy` | [10765](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10765) |
| fun | `groupPrivacyBackendValue` | [10771](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10771) |
| fun | `formatGoalSummary` | [10777](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10777) |
| fun | `formatGoalUnit` | [10794](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10794) |
| fun | `Int.toGoalUnitAmount` | [10805](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10805) |
| fun | `goalPeriodPhrase` | [10808](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10808) |
| fun | `groupUnitLabel` | [10816](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10816) |
| fun | `groupProgressLabel` | [10825](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10825) |
| fun | `groupProgressPreview` | [10845](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10845) |
| fun | `groupFeedTimeLabel` | [10899](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10899) |
| fun | `profileAvatarInitial` | [10907](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10907) |
| class | `ReaderBookmarkSummary` | [10910](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10910) |
| fun | `loadAllReaderBookmarkSummaries` | [10919](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10919) |
| fun | `translationMenuStrings` | [10955](../../../app/src/main/java/com/Ameender/qurantracker/ui/HamburgerMenu.kt#L10955) |

### app/src/main/java/com/Ameender/qurantracker/ui/HizbMultiSelect.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbMultiSelect.kt), 54 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `HizbMultiSelect` | [19](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbMultiSelect.kt#L19) |
| fun | `HizbSelectionSheet` | [33](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbMultiSelect.kt#L33) |

### app/src/main/java/com/Ameender/qurantracker/ui/HizbOverviewCard.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbOverviewCard.kt), 121 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `HizbOverviewCard` | [30](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbOverviewCard.kt#L30) |
| fun | `HizbBars` | [98](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbOverviewCard.kt#L98) |

### app/src/main/java/com/Ameender/qurantracker/ui/HizbOverviewText.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbOverviewText.kt), 31 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `hizbText` | [3](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbOverviewText.kt#L3) |

### app/src/main/java/com/Ameender/qurantracker/ui/HizbScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbScreen.kt), 352 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `HizbScreen` | [30](../../../app/src/main/java/com/Ameender/qurantracker/ui/HizbScreen.kt#L30) |

### app/src/main/java/com/Ameender/qurantracker/ui/IrabRepository.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/IrabRepository.kt), 35 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `IrabFragment` | [9](../../../app/src/main/java/com/Ameender/qurantracker/ui/IrabRepository.kt#L9) |
| class | `IrabResult` | [10](../../../app/src/main/java/com/Ameender/qurantracker/ui/IrabRepository.kt#L10) |
| class | `IrabRateLimit` | [11](../../../app/src/main/java/com/Ameender/qurantracker/ui/IrabRepository.kt#L11) |
| object | `IrabRepository` | [13](../../../app/src/main/java/com/Ameender/qurantracker/ui/IrabRepository.kt#L13) |
| fun | `load` | [14](../../../app/src/main/java/com/Ameender/qurantracker/ui/IrabRepository.kt#L14) |

### app/src/main/java/com/Ameender/qurantracker/ui/IrabScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/IrabScreen.kt), 185 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `IrabScreen` | [25](../../../app/src/main/java/com/Ameender/qurantracker/ui/IrabScreen.kt#L25) |

### app/src/main/java/com/Ameender/qurantracker/ui/JuzzScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/JuzzScreen.kt), 351 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `JuzStartInfo` | [28](../../../app/src/main/java/com/Ameender/qurantracker/ui/JuzzScreen.kt#L28) |
| fun | `JuzzScreen` | [71](../../../app/src/main/java/com/Ameender/qurantracker/ui/JuzzScreen.kt#L71) |

### app/src/main/java/com/Ameender/qurantracker/ui/LanguageSelectionScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/LanguageSelectionScreen.kt), 71 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `LanguageSelectionScreen` | [22](../../../app/src/main/java/com/Ameender/qurantracker/ui/LanguageSelectionScreen.kt#L22) |

### app/src/main/java/com/Ameender/qurantracker/ui/LocalizedDialogContext.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/LocalizedDialogContext.kt), 15 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `localizedDialogContext` | [9](../../../app/src/main/java/com/Ameender/qurantracker/ui/LocalizedDialogContext.kt#L9) |

### app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt), 332 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `MutashabihatText` | [62](../../../app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt#L62) |
| fun | `mutashabihatText` | [75](../../../app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt#L75) |
| fun | `MutashabihatScreen` | [103](../../../app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt#L103) |
| fun | `MutashabihatCard` | [226](../../../app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt#L226) |
| fun | `SequenceRow` | [269](../../../app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt#L269) |
| fun | `MutashabihatGroup.searchTerms` | [307](../../../app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt#L307) |
| fun | `MutashabihatSequence.referenceLabel` | [319](../../../app/src/main/java/com/Ameender/qurantracker/ui/MutashabihatScreen.kt#L319) |

### app/src/main/java/com/Ameender/qurantracker/ui/NoteTargetComponents.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/NoteTargetComponents.kt), 175 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `noteScopeLabel` | [29](../../../app/src/main/java/com/Ameender/qurantracker/ui/NoteTargetComponents.kt#L29) |
| fun | `noteTargetTitle` | [36](../../../app/src/main/java/com/Ameender/qurantracker/ui/NoteTargetComponents.kt#L36) |
| fun | `NoteCountButton` | [44](../../../app/src/main/java/com/Ameender/qurantracker/ui/NoteTargetComponents.kt#L44) |
| fun | `NoteTargetSummary` | [53](../../../app/src/main/java/com/Ameender/qurantracker/ui/NoteTargetComponents.kt#L53) |
| fun | `NoteTargetSelector` | [91](../../../app/src/main/java/com/Ameender/qurantracker/ui/NoteTargetComponents.kt#L91) |
| fun | `label` | [94](../../../app/src/main/java/com/Ameender/qurantracker/ui/NoteTargetComponents.kt#L94) |

### app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt), 191 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `NotificationsScreen` | [30](../../../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt#L30) |
| fun | `notificationsAllowed` | [34](../../../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt#L34) |
| fun | `t` | [40](../../../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt#L40) |
| fun | `NotificationSection` | [134](../../../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt#L134) |
| fun | `NotificationSettingsCard` | [138](../../../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt#L138) |
| fun | `NotificationToggle` | [145](../../../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt#L145) |
| fun | `NotificationTime` | [155](../../../app/src/main/java/com/Ameender/qurantracker/ui/NotificationsScreen.kt#L155) |

### app/src/main/java/com/Ameender/qurantracker/ui/OnboardingFocusPreview.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingFocusPreview.kt), 75 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `OnboardingFocusPreview` | [20](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingFocusPreview.kt#L20) |

### app/src/main/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreview.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreview.kt), 61 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `OnboardingGroupsPreview` | [18](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingGroupsPreview.kt#L18) |

### app/src/main/java/com/Ameender/qurantracker/ui/OnboardingHifzPreview.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingHifzPreview.kt), 87 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `OnboardingHifzPreview` | [21](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingHifzPreview.kt#L21) |

### app/src/main/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreview.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreview.kt), 101 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PlanningDemoItem` | [20](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreview.kt#L20) |
| fun | `validAt` | [21](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreview.kt#L21) |
| fun | `planningDemoDate` | [25](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreview.kt#L25) |
| fun | `OnboardingPlanningPreview` | [30](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingPlanningPreview.kt#L30) |

### app/src/main/java/com/Ameender/qurantracker/ui/OnboardingReadingPreview.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingReadingPreview.kt), 65 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingDemoUnit` | [17](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingReadingPreview.kt#L17) |
| fun | `OnboardingReadingPreview` | [22](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingReadingPreview.kt#L22) |

### app/src/main/java/com/Ameender/qurantracker/ui/OnboardingReplay.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingReplay.kt), 20 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `OnboardingReplay` | [11](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingReplay.kt#L11) |

### app/src/main/java/com/Ameender/qurantracker/ui/OnboardingShell.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingShell.kt), 88 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `OnboardingShell` | [23](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingShell.kt#L23) |

### app/src/main/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreview.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreview.kt), 49 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `DemoReadCount` | [12](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreview.kt#L12) |
| fun | `OnboardingStatisticsPreview` | [21](../../../app/src/main/java/com/Ameender/qurantracker/ui/OnboardingStatisticsPreview.kt#L21) |

### app/src/main/java/com/Ameender/qurantracker/ui/PlanningScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/PlanningScreen.kt), 20 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `PlanningScreen` | [14](../../../app/src/main/java/com/Ameender/qurantracker/ui/PlanningScreen.kt#L14) |

### app/src/main/java/com/Ameender/qurantracker/ui/QuickCheckTags.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuickCheckTags.kt), 5 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `Modifier.quickCheckTypeTag` | [4](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuickCheckTags.kt#L4) |

### app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt), 3493 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `SurahAudioOption` | [78](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L78) |
| class | `QuranWord` | [84](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L84) |
| class | `WordByWordAyah` | [91](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L91) |
| class | `ReaderAyahAction` | [97](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L97) |
| class | `WarshAyahPosition` | [107](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L107) |
| class | `HafsAyahPosition` | [115](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L115) |
| fun | `QuranReaderScreen` | [127](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L127) |
| fun | `ChapterListScreen` | [233](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L233) |
| fun | `QuranSearchBox` | [294](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L294) |
| fun | `SearchResultItem` | [357](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L357) |
| fun | `ChapterListItem` | [387](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L387) |
| fun | `ChapterReaderScreen` | [442](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L442) |
| fun | `playAudio` | [816](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L816) |
| fun | `TransparentWarshAudioBar` | [1571](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L1571) |
| fun | `AudioSkipButton` | [1676](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L1676) |
| fun | `SurahAudioControls` | [1691](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L1691) |
| fun | `formatAudioTime` | [1778](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L1778) |
| fun | `ayahListIndexOffset` | [1785](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L1785) |
| fun | `ReaderBookmarkDialog` | [1792](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L1792) |
| fun | `AudioPickerDialog` | [1866](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L1866) |
| fun | `warshPagesForSurah` | [1926](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L1926) |
| fun | `hafsMadinaPagesForSurah` | [2044](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2044) |
| fun | `loadWordByWordAyahs` | [2162](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2162) |
| fun | `loadWordInfoByKey` | [2190](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2190) |
| fun | `loadSurahAudioOptions` | [2209](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2209) |
| fun | `loadWarshPagePositions` | [2228](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2228) |
| fun | `buildWarshOverlayPositions` | [2245](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2245) |
| fun | `addSegment` | [2267](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2267) |
| fun | `loadAyahBookmarks` | [2302](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2302) |
| fun | `saveAyahBookmarks` | [2309](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2309) |
| fun | `loadWarshPageBookmarks` | [2316](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2316) |
| fun | `saveWarshPageBookmarks` | [2323](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2323) |
| fun | `loadLastReadAyah` | [2330](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2330) |
| fun | `saveLastReadAyah` | [2337](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2337) |
| fun | `loadReaderArabicFontSize` | [2345](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2345) |
| fun | `saveReaderArabicFontSize` | [2350](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2350) |
| fun | `Set` | [2357](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2357) |
| fun | `loadHafsMadinaPagePositions` | [2361](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2361) |
| fun | `ensureHafsAyahInfoDatabase` | [2406](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2406) |
| fun | `downloadedPdfPagesForSurah` | [2418](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2418) |
| fun | `downloadedMaknoonPagesForSurah` | [2429](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2429) |
| fun | `File.pdfPageCount` | [2432](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2432) |
| class | `PdfCropProfile` | [2441](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2441) |
| fun | `sizeOf` | [2449](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2449) |
| fun | `pdfCropProfileForMushaf` | [2452](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2452) |
| fun | `renderPdfPage` | [2473](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2473) |
| fun | `hafsSurahStartScrollFraction` | [2503](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2503) |
| fun | `warshSurahStartScrollFraction` | [2514](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2514) |
| class | `MushafAyahTarget` | [2525](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2525) |
| fun | `findHafsAyahMushafTarget` | [2530](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2530) |
| fun | `findWarshAyahMushafTarget` | [2550](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2550) |
| fun | `DownloadedPdfMushafPage` | [2571](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2571) |
| fun | `MaknoonWarshMushafPage` | [2620](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2620) |
| fun | `renderMaknoonPage` | [2736](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2736) |
| fun | `renderMaknoonSvgPage` | [2743](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2743) |
| fun | `readSvgzText` | [2761](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2761) |
| fun | `HafsMadinaMushafPage` | [2775](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2775) |
| fun | `WarshMushafPage` | [2847](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2847) |
| fun | `WordByWordAyahCard` | [2921](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2921) |
| fun | `WordInfoDialog` | [2986](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L2986) |
| fun | `AyahInfoDialog` | [3037](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3037) |
| fun | `ReaderInfoSectionTitle` | [3124](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3124) |
| fun | `I3rabTextBox` | [3135](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3135) |
| fun | `AyahSelectionToolbar` | [3157](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3157) |
| fun | `label` | [3174](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3174) |
| fun | `SelectionToolbarButton` | [3246](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3246) |
| fun | `AyahActionDialog` | [3272](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3272) |
| fun | `AyahActionButton` | [3361](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3361) |
| fun | `BookmarkIconButton` | [3388](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3388) |
| fun | `AyahItem` | [3412](../../../app/src/main/java/com/Ameender/qurantracker/ui/QuranReaderScreen.kt#L3412) |

### app/src/main/java/com/Ameender/qurantracker/ui/ReadingCelebrationDialog.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingCelebrationDialog.kt), 175 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `CelebrationLevel` | [36](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingCelebrationDialog.kt#L36) |
| class | `ReadingCelebration` | [47](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingCelebrationDialog.kt#L47) |
| class | `ConfettiPiece` | [52](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingCelebrationDialog.kt#L52) |
| fun | `ReadingCelebrationDialog` | [63](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingCelebrationDialog.kt#L63) |
| fun | `ConfettiBurst` | [105](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingCelebrationDialog.kt#L105) |

### app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt), 199 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `ReadingChecklistScreen` | [30](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt#L30) |
| fun | `update` | [40](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt#L40) |
| fun | `ReadingChecklistContent` | [64](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt#L64) |
| fun | `t` | [70](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt#L70) |
| fun | `n` | [83](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt#L83) |
| fun | `point` | [84](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt#L84) |
| fun | `name` | [88](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt#L88) |
| fun | `ChecklistRow` | [168](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistScreen.kt#L168) |

### app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistText.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistText.kt), 33 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `checklistText` | [3](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingChecklistText.kt#L3) |

### app/src/main/java/com/Ameender/qurantracker/ui/ReadingJourneyDialog.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingJourneyDialog.kt), 98 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `ReadingJourneyDialog` | [22](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingJourneyDialog.kt#L22) |
| fun | `label` | [44](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingJourneyDialog.kt#L44) |

### app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt), 136 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingPlan` | [24](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L24) |
| fun | `SharedPreferences.plan` | [25](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L25) |
| fun | `rememberPlan` | [27](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L27) |
| fun | `ReadingPlan.logged` | [38](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L38) |
| fun | `ReadingPlan.done` | [41](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L41) |
| fun | `quantity` | [42](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L42) |
| fun | `planUnit` | [43](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L43) |
| fun | `ReadingPlanHomeCard` | [50](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L50) |
| fun | `t` | [51](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L51) |
| fun | `ReadingPlanScreen` | [71](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L71) |
| fun | `t` | [72](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanScreen.kt#L72) |

### app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanText.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanText.kt), 42 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `readingPlanText` | [3](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanText.kt#L3) |
| fun | `normalizePlanNumber` | [39](../../../app/src/main/java/com/Ameender/qurantracker/ui/ReadingPlanText.kt#L39) |

### app/src/main/java/com/Ameender/qurantracker/ui/RepeatPageRange.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatPageRange.kt), 21 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `validRepeatPageRange` | [5](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatPageRange.kt#L5) |
| fun | `loadRepeatPageReferences` | [12](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatPageRange.kt#L12) |

### app/src/main/java/com/Ameender/qurantracker/ui/RepeatReciters.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatReciters.kt), 29 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RepeatReciter` | [5](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatReciters.kt#L5) |
| fun | `ayahUrl` | [7](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatReciters.kt#L7) |
| fun | `displayName` | [10](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatReciters.kt#L10) |
| fun | `repeatReciterOptions` | [28](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatReciters.kt#L28) |

### app/src/main/java/com/Ameender/qurantracker/ui/RepeatSelectionSheet.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatSelectionSheet.kt), 191 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `RepeatSelectionSheet` | [28](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatSelectionSheet.kt#L28) |

### app/src/main/java/com/Ameender/qurantracker/ui/RepeatSequence.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatSequence.kt), 12 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `nextRepeatStep` | [4](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatSequence.kt#L4) |

### app/src/main/java/com/Ameender/qurantracker/ui/RepeatTimings.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatTimings.kt), 35 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RepeatTiming` | [8](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatTimings.kt#L8) |
| fun | `validateRepeatTimings` | [10](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatTimings.kt#L10) |
| fun | `loadRepeatTimings` | [18](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatTimings.kt#L18) |
| fun | `RepeatReciter.surahAudioUrl` | [33](../../../app/src/main/java/com/Ameender/qurantracker/ui/RepeatTimings.kt#L33) |

### app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt), 101 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RubReaderTarget` | [15](../../../app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt#L15) |
| class | `RubReaderAvailability` | [17](../../../app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt#L17) |
| fun | `loadWarshRubTarget` | [20](../../../app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt#L20) |
| fun | `loadRubReaderTarget` | [41](../../../app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt#L41) |
| fun | `RubReaderAction` | [75](../../../app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt#L75) |
| fun | `RubReaderActionContent` | [88](../../../app/src/main/java/com/Ameender/qurantracker/ui/RubReaderAction.kt#L88) |

### app/src/main/java/com/Ameender/qurantracker/ui/StatsDrilldown.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsDrilldown.kt), 54 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `StatsReadingPeriod` | [9](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsDrilldown.kt#L9) |
| class | `StatsDistribution` | [10](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsDrilldown.kt#L10) |
| class | `StatsReadingBucket` | [11](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsDrilldown.kt#L11) |
| fun | `statsPeriodHistory` | [13](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsDrilldown.kt#L13) |
| fun | `statsReadingBuckets` | [25](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsDrilldown.kt#L25) |
| fun | `statsRingSegment` | [39](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsDrilldown.kt#L39) |

### app/src/main/java/com/Ameender/qurantracker/ui/StatsReadingDetails.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsReadingDetails.kt), 79 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `statsReadingPeriodLabel` | [14](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsReadingDetails.kt#L14) |
| fun | `StatsReadingDetailsSheet` | [22](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsReadingDetails.kt#L22) |

### app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt), 1127 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `statsPieColor` | [42](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L42) |
| class | `RingEntry` | [44](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L44) |
| fun | `StatsDistributionRingCard` | [49](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L49) |
| fun | `StatsRingPanel` | [73](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L73) |
| fun | `StatsScreen` | [155](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L155) |
| class | `HistoryGroupMode` | [403](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L403) |
| fun | `label` | [408](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L408) |
| class | `HistoryGroup` | [415](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L415) |
| interface | `HistoryDisplayItem` | [421](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L421) |
| class | `SingleHistoryItem` | [425](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L425) |
| class | `HizbDaySummaryItem` | [431](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L431) |
| fun | `StatsFilterChip` | [439](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L439) |
| fun | `CollapsibleStatsGroup` | [461](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L461) |
| fun | `ReadingHistoryItemRow` | [503](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L503) |
| fun | `ReadingHistoryRow` | [511](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L511) |
| fun | `HizbSummaryRow` | [570](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L570) |
| fun | `LegendRow` | [651](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L651) |
| fun | `EmptyText` | [664](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L664) |
| fun | `StreakStatsCard` | [669](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L669) |
| fun | `QuranProgressStatsCard` | [714](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L714) |
| fun | `QuranProgressBarRow` | [725](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L725) |
| fun | `ReadingStatsOverviewCard` | [736](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L736) |
| fun | `StatMiniTile` | [814](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L814) |
| fun | `calculateStatsStreak` | [835](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L835) |
| fun | `historyDateKey` | [859](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L859) |
| fun | `groupReadingHistory` | [865](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L865) |
| fun | `buildHistoryDisplayItems` | [900](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L900) |
| class | `RubHistoryEntry` | [927](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L927) |
| fun | `statsTypeLabel` | [932](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L932) |
| fun | `statsHistoryAyahRange` | [940](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L940) |
| fun | `statsHistoryOpening` | [953](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L953) |
| fun | `statsHistoryTitle` | [960](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L960) |
| fun | `readableHizbRubNameSafe` | [967](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L967) |
| fun | `rubNumberFromHistoryNameSafe` | [978](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L978) |
| fun | `rubFractionLabel` | [986](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L986) |
| fun | `readableHizbRubName` | [993](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L993) |
| fun | `String.hasRubMarker` | [1004](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L1004) |
| fun | `TypePieChart` | [1010](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L1010) |
| fun | `HizbPieChart` | [1031](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L1031) |
| fun | `SurahPieChart` | [1052](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L1052) |
| fun | `BarChart` | [1075](../../../app/src/main/java/com/Ameender/qurantracker/ui/StatsScreen.kt#L1075) |

### app/src/main/java/com/Ameender/qurantracker/ui/SurahScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/SurahScreen.kt), 377 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `Surah` | [22](../../../app/src/main/java/com/Ameender/qurantracker/ui/SurahScreen.kt#L22) |
| fun | `SurahScreen` | [143](../../../app/src/main/java/com/Ameender/qurantracker/ui/SurahScreen.kt#L143) |

### app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt), 502 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `TafsirPageState` | [65](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L65) |
| object | `Loading` | [66](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L66) |
| class | `Loaded` | [67](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L67) |
| class | `Error` | [68](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L68) |
| class | `ArabicTafsirOption` | [71](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L71) |
| fun | `TafsirScreen` | [89](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L89) |
| fun | `TranslationTextPanel` | [431](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L431) |
| fun | `TafsirTextPanel` | [455](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L455) |
| fun | `loadArabicTafsir` | [479](../../../app/src/main/java/com/Ameender/qurantracker/ui/TafsirScreen.kt#L479) |

### app/src/main/java/com/Ameender/qurantracker/ui/TopLevelNavigation.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/TopLevelNavigation.kt), 16 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `NavHostController.navigateToTopLevel` | [7](../../../app/src/main/java/com/Ameender/qurantracker/ui/TopLevelNavigation.kt#L7) |

### app/src/main/java/com/Ameender/qurantracker/ui/TranslationScreen.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/TranslationScreen.kt), 347 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `TranslationScreen` | [55](../../../app/src/main/java/com/Ameender/qurantracker/ui/TranslationScreen.kt#L55) |
| class | `TranslationScreenStrings` | [269](../../../app/src/main/java/com/Ameender/qurantracker/ui/TranslationScreen.kt#L269) |
| fun | `translationScreenStrings` | [278](../../../app/src/main/java/com/Ameender/qurantracker/ui/TranslationScreen.kt#L278) |
| fun | `TranslationRangeField` | [316](../../../app/src/main/java/com/Ameender/qurantracker/ui/TranslationScreen.kt#L316) |
| fun | `TranslationAyahCard` | [342](../../../app/src/main/java/com/Ameender/qurantracker/ui/TranslationScreen.kt#L342) |

### app/src/main/java/com/Ameender/qurantracker/ui/WarshAyahReferences.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshAyahReferences.kt), 53 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `WarshAyahReferences` | [10](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshAyahReferences.kt#L10) |
| fun | `hafsAyahs` | [14](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshAyahReferences.kt#L14) |
| class | `MushafSelectionContent` | [32](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshAyahReferences.kt#L32) |
| fun | `resolveMushafSelection` | [39](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshAyahReferences.kt#L39) |

### app/src/main/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometry.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometry.kt), 55 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `WarshMaknoonGeometry` | [7](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometry.kt#L7) |
| object | `WarshMaknoonPages` | [13](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometry.kt#L13) |
| fun | `load` | [18](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometry.kt#L18) |
| fun | `pagesForSurah` | [42](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometry.kt#L42) |
| fun | `findAyah` | [45](../../../app/src/main/java/com/Ameender/qurantracker/ui/WarshMaknoonGeometry.kt#L45) |

### app/src/main/java/com/Ameender/qurantracker/ui/WirdnaBrand.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/WirdnaBrand.kt), 35 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| fun | `WirdnaBrand` | [21](../../../app/src/main/java/com/Ameender/qurantracker/ui/WirdnaBrand.kt#L21) |

### app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt), 871 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `AppSpacing` | [148](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L148) |
| object | `AppShape` | [169](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L169) |
| object | `AppBorder` | [191](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L191) |
| object | `AppElevation` | [199](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L199) |
| object | `AppShadow` | [207](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L207) |
| object | `AppIcon` | [214](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L214) |
| object | `AppFont` | [229](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L229) |
| object | `AppTextStyle` | [234](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L234) |
| object | `AppColor` | [246](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L246) |
| object | `AppThemeSwatchColor` | [265](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L265) |
| object | `AppChartSize` | [280](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L280) |
| object | `ReaderOverlayStyle` | [301](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L301) |
| object | `ReaderSearchStyle` | [313](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L313) |
| object | `ReaderInfoStyle` | [319](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L319) |
| object | `BookReaderStyle` | [331](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L331) |
| object | `AgendaKhatmaStyle` | [351](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L351) |
| object | `SettingsMenuStyle` | [357](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L357) |
| object | `AppComponentDefaults` | [368](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L368) |
| fun | `QuranTrackerTheme` | [380](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L380) |
| fun | `applyThemeColors` | [413](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L413) |
| fun | `applyMatteDarkPalette` | [712](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L712) |
| fun | `applySoftLightPalette` | [768](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L768) |
| fun | `hifzScoreBucket` | [852](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L852) |
| fun | `hifzScoreSurface` | [868](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L868) |
| fun | `hifzScoreBorder` | [870](../../../app/src/main/java/com/Ameender/qurantracker/ui/theme/AppStyle.kt#L870) |

### app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt), 75 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AyahNoteViewModel` | [12](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt#L12) |
| fun | `persistNote` | [19](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt#L19) |
| fun | `removeNote` | [21](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt#L21) |
| fun | `saveNote` | [23](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt#L23) |
| fun | `deleteNote` | [63](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt#L63) |
| fun | `updateNote` | [69](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/AyahNoteViewModel.kt#L69) |

### app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt), 87 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GoalViewModel` | [15](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L15) |
| fun | `saveDefinition` | [30](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L30) |
| fun | `saveJourneyPlan` | [31](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L31) |
| fun | `record` | [40](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L40) |
| fun | `resolve` | [42](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L42) |
| fun | `schedule` | [43](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L43) |
| fun | `perform` | [45](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L45) |
| fun | `saveGoal` | [63](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L63) |
| fun | `saveReadingJourney` | [69](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L69) |
| fun | `unitLabel` | [75](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L75) |
| fun | `deriveDailyGoalFromJourney` | [85](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/GoalViewModel.kt#L85) |

### app/src/main/java/com/Ameender/qurantracker/viewmodel/HizbOverviewViewModel.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/HizbOverviewViewModel.kt), 34 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `HizbOverviewState` | [10](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/HizbOverviewViewModel.kt#L10) |
| object | `Loading` | [11](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/HizbOverviewViewModel.kt#L11) |
| object | `Error` | [12](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/HizbOverviewViewModel.kt#L12) |
| class | `Ready` | [13](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/HizbOverviewViewModel.kt#L13) |
| class | `HizbOverviewViewModel` | [16](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/HizbOverviewViewModel.kt#L16) |
| fun | `retry` | [20](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/HizbOverviewViewModel.kt#L20) |

### app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt), 92 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PlanningViewModel` | [15](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L15) |
| fun | `getItemsForDate` | [30](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L30) |
| fun | `addItem` | [33](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L33) |
| fun | `addKhatmaPlan` | [46](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L46) |
| fun | `toggleDone` | [52](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L52) |
| fun | `deleteItem` | [58](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L58) |
| fun | `setReminder` | [64](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L64) |
| fun | `saveGoal` | [70](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L70) |
| fun | `unitLabel` | [76](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L76) |
| fun | `typeIcon` | [85](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/PlanningViewModel.kt#L85) |

### app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranTrackerViewModelFactory.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranTrackerViewModelFactory.kt), 61 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranTrackerViewModelFactory` | [13](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranTrackerViewModelFactory.kt#L13) |
| fun | `create` | [47](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranTrackerViewModelFactory.kt#L47) |

### app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt

[Volledige bron](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt), 152 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranViewModel` | [11](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L11) |
| fun | `quickCheckIn` | [16](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L16) |
| fun | `confirmToggleJuz` | [65](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L65) |
| fun | `confirmToggleJuz` | [71](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L71) |
| fun | `removeJuz` | [73](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L73) |
| fun | `confirmToggleRub` | [79](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L79) |
| fun | `removeRub` | [85](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L85) |
| fun | `confirmToggleSurah` | [91](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L91) |
| fun | `removeSurah` | [97](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L97) |
| fun | `updateSurahHifzScore` | [103](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L103) |
| fun | `updateJuzHifzScore` | [109](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L109) |
| fun | `updateHizbHifzScore` | [115](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L115) |
| fun | `updateHifzScoreRange` | [121](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L121) |
| fun | `dismissHistoryResetResult` | [130](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L130) |
| fun | `resetHistory` | [134](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L134) |
| class | `HistoryResetState` | [151](../../../app/src/main/java/com/Ameender/qurantracker/viewmodel/QuranViewModel.kt#L151) |

### app/src/test/java/com/Ameender/qurantracker/ExampleUnitTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ExampleUnitTest.kt), 36 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ExampleUnitTest` | [12](../../../app/src/test/java/com/Ameender/qurantracker/ExampleUnitTest.kt#L12) |
| fun | `deriveDailyGoalFromJourney_usesJuzWhenPartsDivideByEight` | [14](../../../app/src/test/java/com/Ameender/qurantracker/ExampleUnitTest.kt#L14) |
| fun | `deriveDailyGoalFromJourney_usesHizbWhenPartsDivideByFour` | [19](../../../app/src/test/java/com/Ameender/qurantracker/ExampleUnitTest.kt#L19) |
| fun | `deriveDailyGoalFromJourney_usesRubForSmallestUnit` | [24](../../../app/src/test/java/com/Ameender/qurantracker/ExampleUnitTest.kt#L24) |
| fun | `progressIds_areStable` | [29](../../../app/src/test/java/com/Ameender/qurantracker/ExampleUnitTest.kt#L29) |

### app/src/test/java/com/Ameender/qurantracker/data/AccountManagementPolicyTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/AccountManagementPolicyTest.kt), 32 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AccountManagementPolicyTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/data/AccountManagementPolicyTest.kt#L6) |
| fun | `passwordsHaveExplicitBounds` | [7](../../../app/src/test/java/com/Ameender/qurantracker/data/AccountManagementPolicyTest.kt#L7) |
| fun | `passwordConfirmationIsExactIncludingWhitespace` | [14](../../../app/src/test/java/com/Ameender/qurantracker/data/AccountManagementPolicyTest.kt#L14) |
| fun | `emailChangeRejectsInvalidAndUnchangedAddresses` | [19](../../../app/src/test/java/com/Ameender/qurantracker/data/AccountManagementPolicyTest.kt#L19) |
| fun | `deletionRequiresExactAccountEmailNotAnEmptyOrPartialConfirmation` | [25](../../../app/src/test/java/com/Ameender/qurantracker/data/AccountManagementPolicyTest.kt#L25) |

### app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt), 67 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AuthenticationStateTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt#L6) |
| fun | `signedOutUserSeesLoginRequirement` | [13](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt#L13) |
| fun | `sessionRestoreShowsLoadingUntilAuthenticationIsKnown` | [21](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt#L21) |
| fun | `emailLoginUnlocksProtectedContentImmediately` | [34](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt#L34) |
| fun | `emailRegistrationWithSessionUnlocksProtectedContentImmediately` | [39](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt#L39) |
| fun | `googleCallbackUnlocksContentAfterOAuthCheck` | [44](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt#L44) |
| fun | `refreshFailureKeepsLoginMessageHiddenWhileSessionIsChecked` | [49](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt#L49) |
| fun | `assertLoginTransition` | [56](../../../app/src/test/java/com/Ameender/qurantracker/data/AuthenticationStateTest.kt#L56) |

### app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt), 74 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AyahNotePersistenceTest` | [9](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L9) |
| class | `MemoryDao` | [10](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L10) |
| fun | `getAll` | [13](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L13) |
| fun | `getNote` | [14](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L14) |
| fun | `insert` | [16](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L16) |
| fun | `update` | [20](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L20) |
| fun | `deleteForAyah` | [26](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L26) |
| fun | `delete` | [29](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L29) |
| fun | `editingExistingNoteDoesNotCreateDuplicateAndPreservesMetadata` | [32](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L32) |
| fun | `separateNotesCanReferenceSameAyah` | [44](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L44) |
| fun | `failedSavePropagatesAndLeavesOriginalIntact` | [54](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L54) |
| fun | `blankNotesAreRejected` | [65](../../../app/src/test/java/com/Ameender/qurantracker/data/AyahNotePersistenceTest.kt#L65) |

### app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt), 54 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GoalHubRulesTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt#L6) |
| fun | `entry` | [8](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt#L8) |
| fun | `differentActivitiesStaySeparateAndUseAmounts` | [11](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt#L11) |
| fun | `selectedContentCountsAsOneWholeSurahHizbOrJuz` | [18](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt#L18) |
| fun | `moreThanFiftyActivitiesAndExactUnitConversions` | [25](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt#L25) |
| fun | `minutesNeverPretendToBePages` | [31](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt#L31) |
| fun | `targetCarryOverIsNotCompletedActivityAndPercentClamps` | [39](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt#L39) |
| fun | `journeyUsesSameActivityAndTwoPagesMeans302Days` | [47](../../../app/src/test/java/com/Ameender/qurantracker/data/GoalHubRulesTest.kt#L47) |

### app/src/test/java/com/Ameender/qurantracker/data/GroupAuthorNameTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupAuthorNameTest.kt), 18 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupAuthorNameTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupAuthorNameTest.kt#L6) |
| fun | `currentProfileReplacesOldOfficialName` | [7](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupAuthorNameTest.kt#L7) |
| fun | `explicitGroupNameAlsoWins` | [10](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupAuthorNameTest.kt#L10) |
| fun | `absentMemberKeepsHistoricalAttribution` | [13](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupAuthorNameTest.kt#L13) |

### app/src/test/java/com/Ameender/qurantracker/data/GroupMemberPermissionsTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupMemberPermissionsTest.kt), 25 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupMemberPermissionsTest` | [9](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupMemberPermissionsTest.kt#L9) |
| fun | `defaultValuesAreSentExplicitly` | [10](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupMemberPermissionsTest.kt#L10) |
| fun | `allSwitchCombinationsRoundTrip` | [17](../../../app/src/test/java/com/Ameender/qurantracker/data/GroupMemberPermissionsTest.kt#L17) |

### app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt), 143 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `HifzScoresTest` | [14](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L14) |
| fun | `score` | [15](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L15) |
| fun | `overview` | [16](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L16) |
| fun | `derivedScoresDoNotDoubleCount` | [19](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L19) |
| fun | `zeroAndUnassessedDoNotCount` | [26](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L26) |
| fun | `explicitJuzIsAnIndependentAssessment` | [33](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L33) |
| fun | `latestDuplicateWinsAndInvalidIdsAreIgnored` | [40](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L40) |
| fun | `independentCategoriesAndNonBlockingHint` | [46](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L46) |
| fun | `latestClearCannotResurrectAnOlderScore` | [57](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L57) |
| fun | `zeroHasNeutralColors` | [66](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L66) |
| fun | `arabicOverviewUsesArabicSurahNamesIncludingReviews` | [70](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L70) |
| fun | `averagesRoundAndClamp` | [76](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L76) |
| fun | `juzNeedsTwoRealHizbScores` | [80](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L80) |
| fun | `inconsistentJuzScoresNeedConfirmation` | [87](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L87) |
| fun | `readActionsPreserveJuzAssessmentAndTimestamp` | [93](../../../app/src/test/java/com/Ameender/qurantracker/data/HifzScoresTest.kt#L93) |

### app/src/test/java/com/Ameender/qurantracker/data/HizbAnalyticsTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/HizbAnalyticsTest.kt), 30 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `HizbAnalyticsTest` | [8](../../../app/src/test/java/com/Ameender/qurantracker/data/HizbAnalyticsTest.kt#L8) |
| fun | `periodsUseInclusiveCalendarDates` | [9](../../../app/src/test/java/com/Ameender/qurantracker/data/HizbAnalyticsTest.kt#L9) |
| fun | `zeroFillIncludesExactlySixtyOrderedHizbs` | [15](../../../app/src/test/java/com/Ameender/qurantracker/data/HizbAnalyticsTest.kt#L15) |
| fun | `reversedRangeIsRejected` | [21](../../../app/src/test/java/com/Ameender/qurantracker/data/HizbAnalyticsTest.kt#L21) |
| fun | `dstDayUsesLocalMidnightNotFixedTwentyFourHours` | [24](../../../app/src/test/java/com/Ameender/qurantracker/data/HizbAnalyticsTest.kt#L24) |

### app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt), 31 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `LanguageEntryTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt#L6) |
| fun | `freshInstallStartsWithLanguage` | [7](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt#L7) |
| fun | `existingUsersBypassLanguage` | [10](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt#L10) |
| fun | `interruptedSelectionDoesNotBecomeExistingUser` | [13](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt#L13) |
| fun | `continueKeepsPhaseTwoPendingOnRestart` | [16](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt#L16) |
| fun | `existingUserMarkerSurvivesRestart` | [19](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt#L19) |
| fun | `invalidStateConservativelyPreservesExistingUser` | [22](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt#L22) |
| fun | `allSupportedLanguagesRoundTrip` | [25](../../../app/src/test/java/com/Ameender/qurantracker/data/LanguageEntryTest.kt#L25) |

### app/src/test/java/com/Ameender/qurantracker/data/OnboardingStepTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/OnboardingStepTest.kt), 27 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingStepTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/data/OnboardingStepTest.kt#L6) |
| fun | `sixStepsHaveStableUniqueIdsAndBoundedNavigation` | [7](../../../app/src/test/java/com/Ameender/qurantracker/data/OnboardingStepTest.kt#L7) |
| fun | `unknownSavedStepFallsBackSafely` | [17](../../../app/src/test/java/com/Ameender/qurantracker/data/OnboardingStepTest.kt#L17) |
| fun | `completedAndLegacyUsersRemainOutsideIntroduction` | [21](../../../app/src/test/java/com/Ameender/qurantracker/data/OnboardingStepTest.kt#L21) |

### app/src/test/java/com/Ameender/qurantracker/data/QuranNoteTargetTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/QuranNoteTargetTest.kt), 52 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `QuranNoteTargetTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/data/QuranNoteTargetTest.kt#L6) |
| fun | `allBoundariesAreOrderedAndValid` | [7](../../../app/src/test/java/com/Ameender/qurantracker/data/QuranNoteTargetTest.kt#L7) |
| fun | `knownReferencesAndQuarterNumberingAreCorrect` | [15](../../../app/src/test/java/com/Ameender/qurantracker/data/QuranNoteTargetTest.kt#L15) |
| fun | `nonAyahNotesHaveNoArtificialAyah` | [24](../../../app/src/test/java/com/Ameender/qurantracker/data/QuranNoteTargetTest.kt#L24) |
| fun | `invalidOrConflictingFieldsAreRejected` | [35](../../../app/src/test/java/com/Ameender/qurantracker/data/QuranNoteTargetTest.kt#L35) |
| fun | `parentFiltersKeepOwnAndChildNotesDistinct` | [44](../../../app/src/test/java/com/Ameender/qurantracker/data/QuranNoteTargetTest.kt#L44) |

### app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt), 61 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReadingChecklistTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L6) |
| fun | `clearingPositionAndChecklistAreIndependent` | [7](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L7) |
| fun | `rub` | [16](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L16) |
| fun | `everyPartitionCoversTheSameQuranWithoutGaps` | [17](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L17) |
| fun | `markingLaterPartDoesNotMarkEarlierPartsOrMovePosition` | [23](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L23) |
| fun | `wholeHizbAndUndoStayConsistentWithoutLosingResumePoint` | [30](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L30) |
| fun | `savingPositionDoesNotCheckPreviousPartsAndHandlesEnd` | [40](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L40) |
| fun | `surahCompletionDoesNotRoundToWholeRub` | [47](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L47) |
| fun | `allHizbAndJuzBoundariesMatchExistingData` | [53](../../../app/src/test/java/com/Ameender/qurantracker/data/ReadingChecklistTest.kt#L53) |

### app/src/test/java/com/Ameender/qurantracker/notifications/GroupPushPayloadTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/notifications/GroupPushPayloadTest.kt), 21 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupPushPayloadTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/notifications/GroupPushPayloadTest.kt#L6) |
| fun | `rejectsUntrustedRoutesAndMalformedIdentifiers` | [7](../../../app/src/test/java/com/Ameender/qurantracker/notifications/GroupPushPayloadTest.kt#L7) |
| fun | `notificationCopyIsTranslated` | [12](../../../app/src/test/java/com/Ameender/qurantracker/notifications/GroupPushPayloadTest.kt#L12) |

### app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt), 67 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `NotificationPolicyTest` | [7](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L7) |
| fun | `completedGoalStillReminds` | [12](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L12) |
| fun | `unfinishedGoalReminds` | [16](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L16) |
| fun | `noGoalStillReminds` | [17](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L17) |
| fun | `masterSwitchOverridesCategories` | [18](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L18) |
| fun | `extraReminderIsOptIn` | [22](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L22) |
| fun | `deletedCompletedAndCancelledItemsNeverRemind` | [23](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L23) |
| fun | `overnightQuietHoursDeferToTomorrow` | [29](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L29) |
| fun | `quietEndIsExclusive` | [33](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L33) |
| fun | `springDstUsesActualZoneOffset` | [37](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L37) |
| fun | `autumnDstUsesActualZoneOffset` | [41](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L41) |
| fun | `daytimeQuietWindowIsSupported` | [45](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L45) |
| fun | `travelReevaluatesLocalQuietWindow` | [49](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L49) |
| fun | `equalQuietTimesDisableWindow` | [54](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L54) |
| fun | `globalGroupSwitchAlwaysWins` | [55](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L55) |
| fun | `mutedGroupNeverDelivers` | [56](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L56) |
| fun | `mentionsModeExcludesOtherEvents` | [57](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L57) |
| fun | `importantModeExcludesOrdinaryPosts` | [61](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L61) |
| fun | `departedMembersNeverReceivePush` | [65](../../../app/src/test/java/com/Ameender/qurantracker/notifications/NotificationPolicyTest.kt#L65) |

### app/src/test/java/com/Ameender/qurantracker/ui/AccountManagementTextTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/AccountManagementTextTest.kt), 28 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AccountManagementTextTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/AccountManagementTextTest.kt#L6) |
| fun | `allActionsAndSafetyMessagesHaveTranslations` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/AccountManagementTextTest.kt#L7) |
| fun | `accountProviderLabelsAreDifferent` | [22](../../../app/src/test/java/com/Ameender/qurantracker/ui/AccountManagementTextTest.kt#L22) |

### app/src/test/java/com/Ameender/qurantracker/ui/AgendaCalendarTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/AgendaCalendarTest.kt), 46 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AgendaCalendarTest` | [9](../../../app/src/test/java/com/Ameender/qurantracker/ui/AgendaCalendarTest.kt#L9) |
| fun | `selectedWeekCrossesYearBoundary` | [12](../../../app/src/test/java/com/Ameender/qurantracker/ui/AgendaCalendarTest.kt#L12) |
| fun | `movingAWeekChangesVisibleDatesAcrossMonths` | [21](../../../app/src/test/java/com/Ameender/qurantracker/ui/AgendaCalendarTest.kt#L21) |
| fun | `dateOffsetHandlesLeapDay` | [28](../../../app/src/test/java/com/Ameender/qurantracker/ui/AgendaCalendarTest.kt#L28) |
| fun | `todayShowsActualPlanningStatus` | [33](../../../app/src/test/java/com/Ameender/qurantracker/ui/AgendaCalendarTest.kt#L33) |

### app/src/test/java/com/Ameender/qurantracker/ui/DailyGoalNumbersTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/DailyGoalNumbersTest.kt), 14 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `DailyGoalNumbersTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/DailyGoalNumbersTest.kt#L6) |
| fun | `localizedDailyGoalCounts` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/DailyGoalNumbersTest.kt#L7) |

### app/src/test/java/com/Ameender/qurantracker/ui/FocusDemoTimerTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/FocusDemoTimerTest.kt), 31 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `FocusDemoTimerTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/FocusDemoTimerTest.kt#L6) |
| fun | `startsAtTwentyFiveMinutes` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/FocusDemoTimerTest.kt#L7) |
| fun | `monotonicElapsedTimePauseAndResume` | [11](../../../app/src/test/java/com/Ameender/qurantracker/ui/FocusDemoTimerTest.kt#L11) |
| fun | `delayedTickFinishesAtZeroAndDoesNotStartAutomaticBreak` | [18](../../../app/src/test/java/com/Ameender/qurantracker/ui/FocusDemoTimerTest.kt#L18) |
| fun | `rapidTogglesNeverCreateAdditionalElapsedTime` | [24](../../../app/src/test/java/com/Ameender/qurantracker/ui/FocusDemoTimerTest.kt#L24) |

### app/src/test/java/com/Ameender/qurantracker/ui/GroupErrorsTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupErrorsTest.kt), 47 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupErrorsTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupErrorsTest.kt#L6) |
| fun | `allMessagesTranslated` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupErrorsTest.kt#L7) |
| fun | `backendReasonsAndNestedErrorsAreMapped` | [20](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupErrorsTest.kt#L20) |
| fun | `unknownErrorNeverLeaksDetailsOrClaimsMembership` | [34](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupErrorsTest.kt#L34) |
| fun | `networkAndSessionHaveRecoveryAdvice` | [41](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupErrorsTest.kt#L41) |

### app/src/test/java/com/Ameender/qurantracker/ui/GroupFeedPresentationTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupFeedPresentationTest.kt), 22 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupFeedPresentationTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupFeedPresentationTest.kt#L6) |
| fun | `commentCountsUseCorrectLanguageAndNumber` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupFeedPresentationTest.kt#L7) |
| fun | `invalidTimestampDoesNotCrash` | [13](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupFeedPresentationTest.kt#L13) |
| fun | `validTimestampIsLocalized` | [17](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupFeedPresentationTest.kt#L17) |

### app/src/test/java/com/Ameender/qurantracker/ui/GroupJoinRoutingTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupJoinRoutingTest.kt), 26 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupJoinRoutingTest` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupJoinRoutingTest.kt#L7) |
| fun | `privateGroupOffersRequest` | [8](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupJoinRoutingTest.kt#L8) |
| fun | `wrappedPrivateGroupOffersRequest` | [12](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupJoinRoutingTest.kt#L12) |
| fun | `secureInvitationNeverFallsBackToRequest` | [16](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupJoinRoutingTest.kt#L16) |
| fun | `otherFailuresDoNotOfferRequest` | [20](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupJoinRoutingTest.kt#L20) |

### app/src/test/java/com/Ameender/qurantracker/ui/GroupMemberReadingTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupMemberReadingTest.kt), 39 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `GroupMemberReadingTest` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupMemberReadingTest.kt#L7) |
| fun | `ayahRangesUseExactPartitionBoundaries` | [8](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupMemberReadingTest.kt#L8) |
| fun | `range` | [10](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupMemberReadingTest.kt#L10) |
| fun | `referencesAndQuantitiesAreNotConfused` | [25](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupMemberReadingTest.kt#L25) |
| fun | `translatedReferencesAndDates` | [31](../../../app/src/test/java/com/Ameender/qurantracker/ui/GroupMemberReadingTest.kt#L31) |

### app/src/test/java/com/Ameender/qurantracker/ui/IrabTextTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/IrabTextTest.kt), 31 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `IrabTextTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/IrabTextTest.kt#L6) |
| fun | `asbabStringsAreAvailable` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/IrabTextTest.kt#L7) |
| fun | `screenStringsExistInEveryLanguage` | [16](../../../app/src/test/java/com/Ameender/qurantracker/ui/IrabTextTest.kt#L16) |

### app/src/test/java/com/Ameender/qurantracker/ui/LanguageSelectionTextTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/LanguageSelectionTextTest.kt), 21 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `LanguageSelectionTextTest` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/LanguageSelectionTextTest.kt#L7) |
| fun | `allScreenCopyIsTranslated` | [8](../../../app/src/test/java/com/Ameender/qurantracker/ui/LanguageSelectionTextTest.kt#L8) |

### app/src/test/java/com/Ameender/qurantracker/ui/MushafSelectionContentTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/MushafSelectionContentTest.kt), 40 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `MushafSelectionContentTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/MushafSelectionContentTest.kt#L6) |
| fun | `words` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/MushafSelectionContentTest.kt#L7) |
| fun | `shiftedReferenceIsUsedForBothTextAndWords` | [11](../../../app/src/test/java/com/Ameender/qurantracker/ui/MushafSelectionContentTest.kt#L11) |
| fun | `mergedWarshVerseIncludesBothAppVerses` | [20](../../../app/src/test/java/com/Ameender/qurantracker/ui/MushafSelectionContentTest.kt#L20) |
| fun | `missingWordDataDoesNotDisplayOnlyPartOfTheSelection` | [30](../../../app/src/test/java/com/Ameender/qurantracker/ui/MushafSelectionContentTest.kt#L30) |
| fun | `hafsIdentityReferenceStaysUnchanged` | [34](../../../app/src/test/java/com/Ameender/qurantracker/ui/MushafSelectionContentTest.kt#L34) |

### app/src/test/java/com/Ameender/qurantracker/ui/OnboardingGroupsTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingGroupsTest.kt), 21 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingGroupsTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingGroupsTest.kt#L6) |
| fun | `fictitiousLeaderboardIsOrderedAndLocalized` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingGroupsTest.kt#L7) |

### app/src/test/java/com/Ameender/qurantracker/ui/OnboardingStatisticsTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingStatisticsTest.kt), 26 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingStatisticsTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingStatisticsTest.kt#L6) |
| fun | `fixedExamplesHaveExpectedCounts` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingStatisticsTest.kt#L7) |
| fun | `copyAndNamesReuseExistingTranslations` | [11](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingStatisticsTest.kt#L11) |

### app/src/test/java/com/Ameender/qurantracker/ui/OnboardingTextTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingTextTest.kt), 27 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `OnboardingTextTest` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingTextTest.kt#L7) |
| fun | `allThreeLanguagesContainAllStepAndControlTranslations` | [8](../../../app/src/test/java/com/Ameender/qurantracker/ui/OnboardingTextTest.kt#L8) |

### app/src/test/java/com/Ameender/qurantracker/ui/PlanningDemoTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/PlanningDemoTest.kt), 25 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PlanningDemoTest` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/PlanningDemoTest.kt#L7) |
| fun | `pastDatesAndPastReminderTimesAreRejected` | [9](../../../app/src/test/java/com/Ameender/qurantracker/ui/PlanningDemoTest.kt#L9) |
| fun | `dateAndCopyAreLocalized` | [15](../../../app/src/test/java/com/Ameender/qurantracker/ui/PlanningDemoTest.kt#L15) |

### app/src/test/java/com/Ameender/qurantracker/ui/ReaderMenuTextTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/ReaderMenuTextTest.kt), 32 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReaderMenuTextTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/ReaderMenuTextTest.kt#L6) |
| fun | `everyMenuLabelHasItsOwnTranslation` | [10](../../../app/src/test/java/com/Ameender/qurantracker/ui/ReaderMenuTextTest.kt#L10) |
| fun | `dynamicMenuLabelsFormatInAllLanguages` | [18](../../../app/src/test/java/com/Ameender/qurantracker/ui/ReaderMenuTextTest.kt#L18) |

### app/src/test/java/com/Ameender/qurantracker/ui/RepeatPageRangeTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatPageRangeTest.kt), 16 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RepeatPageRangeTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatPageRangeTest.kt#L6) |
| fun | `validRangesIncludeSinglePageAndEndpoints` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatPageRangeTest.kt#L7) |
| fun | `invalidRangesAreRejected` | [11](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatPageRangeTest.kt#L11) |

### app/src/test/java/com/Ameender/qurantracker/ui/RepeatRecitersTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatRecitersTest.kt), 27 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RepeatRecitersTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatRecitersTest.kt#L6) |
| fun | `husaryMurattalUsesHafsAudioOnly` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatRecitersTest.kt#L7) |
| fun | `reciterSetsAndAyahUrls` | [14](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatRecitersTest.kt#L14) |

### app/src/test/java/com/Ameender/qurantracker/ui/RepeatSequenceTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatSequenceTest.kt), 27 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RepeatSequenceTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatSequenceTest.kt#L6) |
| fun | `twoRoundsPlayExactlyTwiceAndStop` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatSequenceTest.kt#L7) |
| fun | `singleAyahRestartsAndStops` | [16](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatSequenceTest.kt#L16) |
| fun | `continuousHasNoFiniteStop` | [20](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatSequenceTest.kt#L20) |
| fun | `emptySelectionIsRejected` | [23](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatSequenceTest.kt#L23) |

### app/src/test/java/com/Ameender/qurantracker/ui/RepeatTimingsTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatTimingsTest.kt), 29 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `RepeatTimingsTest` | [6](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatTimingsTest.kt#L6) |
| fun | `completeWarshSequenceAccepted` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatTimingsTest.kt#L7) |
| fun | `rejectsWrongNumberingMissingOrInvalidBoundaries` | [11](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatTimingsTest.kt#L11) |
| fun | `newSourcesAreWarshOnlyAndUseSurahFiles` | [21](../../../app/src/test/java/com/Ameender/qurantracker/ui/RepeatTimingsTest.kt#L21) |

### app/src/test/java/com/Ameender/qurantracker/ui/StatsAyahRangeTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsAyahRangeTest.kt), 39 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `StatsAyahRangeTest` | [7](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsAyahRangeTest.kt#L7) |
| fun | `hizbAndPartialRegistrationsShowTheHizbScreenOpening` | [8](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsAyahRangeTest.kt#L8) |
| fun | `registrationTitleUsesContentIdentityInsteadOfAyahTextOrMeasurementUnit` | [18](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsAyahRangeTest.kt#L18) |
| fun | `historyShowsExactRangesIncludingPartialHizb` | [28](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsAyahRangeTest.kt#L28) |
| fun | `history` | [30](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsAyahRangeTest.kt#L30) |

### app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt

[Volledige bron](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt), 62 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `StatsDrilldownTest` | [9](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt#L9) |
| fun | `row` | [10](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt#L10) |
| fun | `countsRegistrationsAndKeepsOriginalAmountsAndContentTypes` | [15](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt#L15) |
| fun | `hizbDetailIncludesRubAndContentTypeRowsButNotAnotherHizb` | [25](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt#L25) |
| fun | `topEightKeepsItsExactUnderlyingRegistrations` | [33](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt#L33) |
| fun | `sevenCalendarDaysRespectDstAndExclusiveEnd` | [41](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt#L41) |
| fun | `segmentHitTestingUsesClockwiseAnglesAndRejectsCenterOutsideAndEmpty` | [52](../../../app/src/test/java/com/Ameender/qurantracker/ui/StatsDrilldownTest.kt#L52) |

### commonMain/io/github/jan/supabase/auth/user/UserInfo.kt

[Volledige bron](../../../commonMain/io/github/jan/supabase/auth/user/UserInfo.kt), 75 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `UserInfo` | [10](../../../commonMain/io/github/jan/supabase/auth/user/UserInfo.kt#L10) |
| class | `UserMfaFactor` | [59](../../../commonMain/io/github/jan/supabase/auth/user/UserInfo.kt#L59) |

## React Native en ondersteunende code

### App.tsx

[Volledige bron](../../App.tsx), 13 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `App` | [6](../../App.tsx#L6) |

### app.config.ts

[Volledige bron](../../app.config.ts), 77 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### docs/recheck-2026-11-18/reader-provider-probe.ts

[Volledige bron](../../docs/recheck-2026-11-18/reader-provider-probe.ts), 72 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `probe` | [10](../../docs/recheck-2026-11-18/reader-provider-probe.ts#L10) |
| function | `main` | [25](../../docs/recheck-2026-11-18/reader-provider-probe.ts#L25) |

### eslint.config.mjs

[Volledige bron](../../eslint.config.mjs), 35 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### index.ts

[Volledige bron](../../index.ts), 8 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### metro.config.js

[Volledige bron](../../metro.config.js), 36 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### plugins/backgroundMushafDownloads/BackgroundMushafDownloads.h

[Volledige bron](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.h), 7 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `BackgroundMushafDownloads` | [4](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.h#L4) |

### plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt

[Volledige bron](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt), 287 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `MushafBackgroundEngine` | [29](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L29) |
| fun | `catalog` | [34](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L34) |
| fun | `store` | [37](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L37) |
| fun | `read` | [38](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L38) |
| fun | `save` | [46](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L46) |
| fun | `dm` | [52](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L52) |
| fun | `marker` | [53](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L53) |
| fun | `destination` | [54](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L54) |
| fun | `staging` | [63](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L63) |
| fun | `source` | [68](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L68) |
| fun | `svg` | [75](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L75) |
| fun | `read` | [79](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L79) |
| fun | `read` | [80](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L80) |
| fun | `valid` | [97](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L97) |
| fun | `schedule` | [112](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L112) |
| fun | `deferLargeInstall` | [120](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L120) |
| fun | `finish` | [137](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L137) |
| fun | `reconcile` | [144](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L144) |
| fun | `snapshot` | [224](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L224) |
| fun | `inspect` | [238](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L238) |
| fun | `start` | [241](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L241) |
| fun | `cancel` | [249](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L249) |
| class | `BackgroundMushafDownloads` | [256](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L256) |
| fun | `getName` | [257](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L257) |
| fun | `action` | [258](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L258) |
| fun | `inspect` | [259](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L259) |
| fun | `start` | [260](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L260) |
| fun | `cancel` | [261](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L261) |
| class | `BackgroundMushafDownloadsPackage` | [263](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L263) |
| fun | `createNativeModules` | [264](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L264) |
| fun | `createViewManagers` | [265](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L265) |
| class | `MushafDownloadReceiver` | [267](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L267) |
| fun | `onReceive` | [268](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L268) |
| class | `MushafDownloadJob` | [279](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L279) |
| fun | `onStartJob` | [281](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L281) |
| fun | `onStopJob` | [285](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.kt#L285) |

### plugins/backgroundMushafDownloads/BackgroundMushafDownloads.m

[Volledige bron](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.m), 281 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `MushafSVGValidator` | [8](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.m#L8) |
| implementation | `MushafSVGValidator` | [12](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.m#L12) |
| interface | `BackgroundMushafDownloads` | [18](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.m#L18) |
| implementation | `BackgroundMushafDownloads` | [33](../../plugins/backgroundMushafDownloads/BackgroundMushafDownloads.m#L33) |

### plugins/mushafPdfCrop/template/src/main/cpp/PdfCropBridge.cpp

[Volledige bron](../../plugins/mushafPdfCrop/template/src/main/cpp/PdfCropBridge.cpp), 56 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt

[Volledige bron](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt), 139 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| object | `PdfCropBridge` | [21](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L21) |
| fun | `setBoxes` | [23](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L23) |
| class | `CropCancelled` | [26](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L26) |
| class | `MushafPdfCrop` | [28](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L28) |
| fun | `getName` | [31](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L31) |
| fun | `getConstants` | [32](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L32) |
| fun | `prepare` | [35](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L35) |
| fun | `checkCancelled` | [49](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L49) |
| fun | `WriteBlock` | [89](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L89) |
| fun | `cancel` | [125](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L125) |
| fun | `invalidate` | [127](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L127) |
| class | `MushafPdfCropPackage` | [135](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L135) |
| fun | `createNativeModules` | [136](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L136) |
| fun | `createViewManagers` | [137](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/MushafPdfCrop.kt#L137) |

### plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/PdfCropCore.kt

[Volledige bron](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/PdfCropCore.kt), 43 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PdfBounds` | [6](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/PdfCropCore.kt#L6) |
| fun | `valid` | [7](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/PdfCropCore.kt#L7) |
| object | `PdfCropCore` | [10](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/PdfCropCore.kt#L10) |
| fun | `crop` | [12](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/PdfCropCore.kt#L12) |
| fun | `scopedFile` | [27](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/PdfCropCore.kt#L27) |
| fun | `destination` | [39](../../plugins/mushafPdfCrop/template/src/main/java/com/Ameender/qurantracker/pdfcrop/PdfCropCore.kt#L39) |

### plugins/mushafPdfCrop/template/src/test/java/com/Ameender/qurantracker/pdfcrop/PdfCropCoreTest.kt

[Volledige bron](../../plugins/mushafPdfCrop/template/src/test/java/com/Ameender/qurantracker/pdfcrop/PdfCropCoreTest.kt), 47 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `PdfCropCoreTest` | [8](../../plugins/mushafPdfCrop/template/src/test/java/com/Ameender/qurantracker/pdfcrop/PdfCropCoreTest.kt#L8) |
| fun | `rotatedMarginsMatchTheExistingPdfCrop` | [9](../../plugins/mushafPdfCrop/template/src/test/java/com/Ameender/qurantracker/pdfcrop/PdfCropCoreTest.kt#L9) |
| fun | `invalidBoundsAndRotationRejectBeforeNativeCalls` | [26](../../plugins/mushafPdfCrop/template/src/test/java/com/Ameender/qurantracker/pdfcrop/PdfCropCoreTest.kt#L26) |
| fun | `fileScopeRejectsNetworkTraversalSiblingPrefixAndNonTemporaryOutput` | [33](../../plugins/mushafPdfCrop/template/src/test/java/com/Ameender/qurantracker/pdfcrop/PdfCropCoreTest.kt#L33) |

### plugins/mushafTextGestures/MushafTextGestures.kt

[Volledige bron](../../plugins/mushafTextGestures/MushafTextGestures.kt), 311 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `MushafTextGestures` | [26](../../plugins/mushafTextGestures/MushafTextGestures.kt#L26) |
| fun | `getName` | [30](../../plugins/mushafTextGestures/MushafTextGestures.kt#L30) |
| fun | `getConstants` | [31](../../plugins/mushafTextGestures/MushafTextGestures.kt#L31) |
| fun | `emit` | [33](../../plugins/mushafTextGestures/MushafTextGestures.kt#L33) |
| class | `Binding` | [51](../../plugins/mushafTextGestures/MushafTextGestures.kt#L51) |
| fun | `hasSelection` | [76](../../plugins/mushafTextGestures/MushafTextGestures.kt#L76) |
| fun | `recordSample` | [83](../../plugins/mushafTextGestures/MushafTextGestures.kt#L83) |
| fun | `recordMotion` | [100](../../plugins/mushafTextGestures/MushafTextGestures.kt#L100) |
| fun | `pageUnchanged` | [127](../../plugins/mushafTextGestures/MushafTextGestures.kt#L127) |
| fun | `begin` | [136](../../plugins/mushafTextGestures/MushafTextGestures.kt#L136) |
| fun | `continueTouch` | [165](../../plugins/mushafTextGestures/MushafTextGestures.kt#L165) |
| class | `ScrollObserver` | [214](../../plugins/mushafTextGestures/MushafTextGestures.kt#L214) |
| fun | `observe` | [217](../../plugins/mushafTextGestures/MushafTextGestures.kt#L217) |
| fun | `verticalScroll` | [226](../../plugins/mushafTextGestures/MushafTextGestures.kt#L226) |
| fun | `attach` | [236](../../plugins/mushafTextGestures/MushafTextGestures.kt#L236) |
| fun | `run` | [241](../../plugins/mushafTextGestures/MushafTextGestures.kt#L241) |
| fun | `attachMounted` | [264](../../plugins/mushafTextGestures/MushafTextGestures.kt#L264) |
| fun | `detachNow` | [286](../../plugins/mushafTextGestures/MushafTextGestures.kt#L286) |
| fun | `detach` | [299](../../plugins/mushafTextGestures/MushafTextGestures.kt#L299) |
| fun | `invalidate` | [301](../../plugins/mushafTextGestures/MushafTextGestures.kt#L301) |
| class | `MushafTextGesturesPackage` | [307](../../plugins/mushafTextGestures/MushafTextGestures.kt#L307) |
| fun | `createNativeModules` | [308](../../plugins/mushafTextGestures/MushafTextGestures.kt#L308) |
| fun | `createViewManagers` | [309](../../plugins/mushafTextGestures/MushafTextGestures.kt#L309) |

### plugins/pdfRuntime/LeadingPdfTiles.java

[Volledige bron](../../plugins/pdfRuntime/LeadingPdfTiles.java), 58 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `LeadingPdfTiles` | [9](../../plugins/pdfRuntime/LeadingPdfTiles.java#L9) |

### plugins/pdfRuntime/patchPdf.js

[Volledige bron](../../plugins/pdfRuntime/patchPdf.js), 350 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `normalized` | [15](../../plugins/pdfRuntime/patchPdf.js#L15) |
| function-variable | `sha256` | [16](../../plugins/pdfRuntime/patchPdf.js#L16) |
| function | `replaceOnce` | [18](../../plugins/pdfRuntime/patchPdf.js#L18) |
| function | `replaceMethod` | [24](../../plugins/pdfRuntime/patchPdf.js#L24) |
| function | `applyCenteredScale` | [39](../../plugins/pdfRuntime/patchPdf.js#L39) |
| function | `applyStablePageSnap` | [60](../../plugins/pdfRuntime/patchPdf.js#L60) |
| function | `applyGuardedRestore` | [112](../../plugins/pdfRuntime/patchPdf.js#L112) |
| function | `applyLeadingTiles` | [125](../../plugins/pdfRuntime/patchPdf.js#L125) |
| function | `transformPdfSources` | [140](../../plugins/pdfRuntime/patchPdf.js#L140) |
| function | `patchPdfSources` | [279](../../plugins/pdfRuntime/patchPdf.js#L279) |

### plugins/withBackgroundMushafDownloads.js

[Volledige bron](../../plugins/withBackgroundMushafDownloads.js), 155 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `patchApplication` | [15](../../plugins/withBackgroundMushafDownloads.js#L15) |
| function | `patchDelegate` | [22](../../plugins/withBackgroundMushafDownloads.js#L22) |
| function | `configureManifest` | [44](../../plugins/withBackgroundMushafDownloads.js#L44) |
| function | `configureIos` | [76](../../plugins/withBackgroundMushafDownloads.js#L76) |

### plugins/withLegacyMushafPaths.js

[Volledige bron](../../plugins/withLegacyMushafPaths.js), 57 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### plugins/withMushafPdfCrop.js

[Volledige bron](../../plugins/withMushafPdfCrop.js), 60 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `patchApplication` | [11](../../plugins/withMushafPdfCrop.js#L11) |
| function | `patchSettings` | [17](../../plugins/withMushafPdfCrop.js#L17) |
| function | `patchBuild` | [22](../../plugins/withMushafPdfCrop.js#L22) |
| function | `installSources` | [27](../../plugins/withMushafPdfCrop.js#L27) |

### plugins/withMushafTextGestures.js

[Volledige bron](../../plugins/withMushafTextGestures.js), 42 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### plugins/withPdfRuntime.js

[Volledige bron](../../plugins/withPdfRuntime.js), 62 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### plugins/withSourceAndroidBackup.ts

[Volledige bron](../../plugins/withSourceAndroidBackup.ts), 70 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `sourceBackupXml` | [16](../../plugins/withSourceAndroidBackup.ts#L16) |
| function-variable | `sourceBackupXml.exclusions` | [23](../../plugins/withSourceAndroidBackup.ts#L23) |
| function | `applySourceBackupManifest` | [35](../../plugins/withSourceAndroidBackup.ts#L35) |
| function-variable | `withSourceAndroidBackup` | [41](../../plugins/withSourceAndroidBackup.ts#L41) |

### plugins/withWindowsCmakePaths.ts

[Volledige bron](../../plugins/withWindowsCmakePaths.ts), 15 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `withWindowsCmakePaths` | [4](../../plugins/withWindowsCmakePaths.ts#L4) |

### scripts/audit-rendered-copy.ts

[Volledige bron](../../scripts/audit-rendered-copy.ts), 251 regels, rol: tooling.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Entry` | [23](../../scripts/audit-rendered-copy.ts#L23) |
| function | `files` | [43](../../scripts/audit-rendered-copy.ts#L43) |
| function | `add` | [75](../../scripts/audit-rendered-copy.ts#L75) |
| function | `literals` | [104](../../scripts/audit-rendered-copy.ts#L104) |
| function | `walk` | [146](../../scripts/audit-rendered-copy.ts#L146) |

### scripts/build-code-reference.mjs

[Volledige bron](../../scripts/build-code-reference.mjs), 280 regels, rol: tooling.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `slash` | [13](../../scripts/build-code-reference.mjs#L13) |
| function | `list` | [14](../../scripts/build-code-reference.mjs#L14) |
| function | `maskKotlin` | [35](../../scripts/build-code-reference.mjs#L35) |
| function-variable | `maskKotlin.blank` | [40](../../scripts/build-code-reference.mjs#L40) |
| function | `kotlinDeclarations` | [95](../../scripts/build-code-reference.mjs#L95) |
| function | `typescriptDeclarations` | [112](../../scripts/build-code-reference.mjs#L112) |
| function | `typescriptDeclarations.visit` | [115](../../scripts/build-code-reference.mjs#L115) |
| function | `nativeTypeDeclarations` | [144](../../scripts/build-code-reference.mjs#L144) |
| function | `entry` | [158](../../scripts/build-code-reference.mjs#L158) |
| function | `typeProperties` | [197](../../scripts/build-code-reference.mjs#L197) |
| function-variable | `escape` | [229](../../scripts/build-code-reference.mjs#L229) |
| function-variable | `sourceLink` | [230](../../scripts/build-code-reference.mjs#L230) |

### scripts/build-warsh-page-manifest.mjs

[Volledige bron](../../scripts/build-warsh-page-manifest.mjs), 50 regels, rol: tooling.

Geen benoemde declaraties in deze index; zie de volledige bron.

### scripts/check-config.mjs

[Volledige bron](../../scripts/check-config.mjs), 104 regels, rol: tooling.

Geen benoemde declaraties in deze index; zie de volledige bron.

### scripts/check-realtime-readiness.mjs

[Volledige bron](../../scripts/check-realtime-readiness.mjs), 161 regels, rol: tooling.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `publicRealtimeConfig` | [16](../../scripts/check-realtime-readiness.mjs#L16) |
| function | `redactRealtimeError` | [48](../../scripts/check-realtime-readiness.mjs#L48) |
| function | `probeRealtimeTable` | [60](../../scripts/check-realtime-readiness.mjs#L60) |
| function | `main` | [94](../../scripts/check-realtime-readiness.mjs#L94) |

### scripts/eslint-architecture.mjs

[Volledige bron](../../scripts/eslint-architecture.mjs), 76 regels, rol: tooling.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `normalized` | [3](../../scripts/eslint-architecture.mjs#L3) |
| function | `dependencyViolation` | [6](../../scripts/eslint-architecture.mjs#L6) |
| method | `create` | [56](../../scripts/eslint-architecture.mjs#L56) |
| function | `create.check` | [57](../../scripts/eslint-architecture.mjs#L57) |

### scripts/local-backend-qa/prepare.mjs

[Volledige bron](../../scripts/local-backend-qa/prepare.mjs), 161 regels, rol: tooling.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `sha` | [17](../../scripts/local-backend-qa/prepare.mjs#L17) |

### scripts/local-backend-qa/progress-parity.mjs

[Volledige bron](../../scripts/local-backend-qa/progress-parity.mjs), 41 regels, rol: tooling.

Geen benoemde declaraties in deze index; zie de volledige bron.

### scripts/local-backend-qa/scope.mjs

[Volledige bron](../../scripts/local-backend-qa/scope.mjs), 10 regels, rol: tooling.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `assertLocalQaScope` | [4](../../scripts/local-backend-qa/scope.mjs#L4) |

### scripts/local-backend-qa/source-sql.mjs

[Volledige bron](../../scripts/local-backend-qa/source-sql.mjs), 59 regels, rol: tooling.

Geen benoemde declaraties in deze index; zie de volledige bron.

### scripts/local-backend-qa/typing-sql.mjs

[Volledige bron](../../scripts/local-backend-qa/typing-sql.mjs), 51 regels, rol: tooling.

Geen benoemde declaraties in deze index; zie de volledige bron.

### scripts/prepare-ios-submit.mjs

[Volledige bron](../../scripts/prepare-ios-submit.mjs), 19 regels, rol: tooling.

Geen benoemde declaraties in deze index; zie de volledige bron.

### scripts/prepare-reader-assets.ts

[Volledige bron](../../scripts/prepare-reader-assets.ts), 119 regels, rol: tooling.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `sha256` | [9](../../scripts/prepare-reader-assets.ts#L9) |
| function-variable | `write` | [10](../../scripts/prepare-reader-assets.ts#L10) |
| function | `prepareWarsh` | [37](../../scripts/prepare-reader-assets.ts#L37) |

### src/app/components/AppErrorBoundary.tsx

[Volledige bron](../../src/app/components/AppErrorBoundary.tsx), 65 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ErrorBoundary` | [6](../../src/app/components/AppErrorBoundary.tsx#L6) |
| method | `ErrorBoundary.getDerivedStateFromError` | [11](../../src/app/components/AppErrorBoundary.tsx#L11) |
| method | `ErrorBoundary.render` | [14](../../src/app/components/AppErrorBoundary.tsx#L14) |
| function | `ErrorFallback` | [19](../../src/app/components/AppErrorBoundary.tsx#L19) |

### src/app/navigation/AppNavigator.tsx

[Volledige bron](../../src/app/navigation/AppNavigator.tsx), 270 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `AppNavigator` | [59](../../src/app/navigation/AppNavigator.tsx#L59) |

### src/app/navigation/DockGlyph.tsx

[Volledige bron](../../src/app/navigation/DockGlyph.tsx), 63 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `DockSymbol` | [4](../../src/app/navigation/DockGlyph.tsx#L4) |
| function | `DockGlyph` | [6](../../src/app/navigation/DockGlyph.tsx#L6) |

### src/app/navigation/MainTabs.tsx

[Volledige bron](../../src/app/navigation/MainTabs.tsx), 31 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `MainTabs` | [10](../../src/app/navigation/MainTabs.tsx#L10) |
| function | `JuzScreen` | [25](../../src/app/navigation/MainTabs.tsx#L25) |
| function | `HizbScreen` | [28](../../src/app/navigation/MainTabs.tsx#L28) |

### src/app/navigation/NavigationDock.tsx

[Volledige bron](../../src/app/navigation/NavigationDock.tsx), 361 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NavigationDock` | [24](../../src/app/navigation/NavigationDock.tsx#L24) |
| function-variable | `NavigationDock.destinationLabel` | [30](../../src/app/navigation/NavigationDock.tsx#L30) |
| function | `NavigationDock.goTab` | [44](../../src/app/navigation/NavigationDock.tsx#L44) |
| function | `NavigationDock.go` | [54](../../src/app/navigation/NavigationDock.tsx#L54) |
| function | `NavigationDock.toggle` | [87](../../src/app/navigation/NavigationDock.tsx#L87) |
| function-variable | `NavigationDock.dockItem` | [95](../../src/app/navigation/NavigationDock.tsx#L95) |

### src/app/navigation/dockDestinations.ts

[Volledige bron](../../src/app/navigation/dockDestinations.ts), 53 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `DockDestination` | [5](../../src/app/navigation/dockDestinations.ts#L5) |

### src/app/navigation/linking.ts

[Volledige bron](../../src/app/navigation/linking.ts), 18 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/app/navigation/navigationCopy.ts

[Volledige bron](../../src/app/navigation/navigationCopy.ts), 28 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/app/navigation/types.ts

[Volledige bron](../../src/app/navigation/types.ts), 62 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `RootStack` | [6](../../src/app/navigation/types.ts#L6) |
| function-variable | `useAppNavigation` | [61](../../src/app/navigation/types.ts#L61) |

### src/app/providers/AppChromeContext.ts

[Volledige bron](../../src/app/providers/AppChromeContext.ts), 15 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `useAppChrome` | [7](../../src/app/providers/AppChromeContext.ts#L7) |

### src/app/providers/AppProviders.tsx

[Volledige bron](../../src/app/providers/AppProviders.tsx), 67 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `RuntimeProviders` | [18](../../src/app/providers/AppProviders.tsx#L18) |
| function | `AppProviders` | [29](../../src/app/providers/AppProviders.tsx#L29) |

### src/app/providers/readerChromeOwners.ts

[Volledige bron](../../src/app/providers/readerChromeOwners.ts), 10 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `createReaderChromeOwners` | [2](../../src/app/providers/readerChromeOwners.ts#L2) |

### src/config/runtime.ts

[Volledige bron](../../src/config/runtime.ts), 21 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `getBackend` | [6](../../src/config/runtime.ts#L6) |

### src/content/audioCatalog.ts

[Volledige bron](../../src/content/audioCatalog.ts), 125 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `loadAudioCatalogAsset` | [120](../../src/content/audioCatalog.ts#L120) |

### src/content/bundledAsset.ts

[Volledige bron](../../src/content/bundledAsset.ts), 16 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `readBundledJson` | [5](../../src/content/bundledAsset.ts#L5) |

### src/content/fontAssets.d.ts

[Volledige bron](../../src/content/fontAssets.d.ts), 5 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/content/generated/loaders.ts

[Volledige bron](../../src/content/generated/loaders.ts), 119 regels, rol: generated-content.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/content/generated/printedPages.ts

[Volledige bron](../../src/content/generated/printedPages.ts), 1251 regels, rol: generated-content.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/content/generated/study-loaders.ts

[Volledige bron](../../src/content/generated/study-loaders.ts), 118 regels, rol: generated-content.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/content/generated/warsh-page-assets.ts

[Volledige bron](../../src/content/generated/warsh-page-assets.ts), 608 regels, rol: generated-content.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/content/hizb.ts

[Volledige bron](../../src/content/hizb.ts), 15 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `getHizbOpening` | [8](../../src/content/hizb.ts#L8) |

### src/content/mushafGeometry.ts

[Volledige bron](../../src/content/mushafGeometry.ts), 108 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Segment` | [11](../../src/content/mushafGeometry.ts#L11) |
| type | `Edition` | [19](../../src/content/mushafGeometry.ts#L19) |
| type | `Scan` | [24](../../src/content/mushafGeometry.ts#L24) |
| function | `printedHafsPage` | [35](../../src/content/mushafGeometry.ts#L35) |
| function | `printedPageRatio` | [42](../../src/content/mushafGeometry.ts#L42) |
| function-variable | `toSegment` | [47](../../src/content/mushafGeometry.ts#L47) |
| function | `hafsReferences` | [56](../../src/content/mushafGeometry.ts#L56) |
| function | `pageSegments` | [62](../../src/content/mushafGeometry.ts#L62) |
| function | `findMushafAyah` | [82](../../src/content/mushafGeometry.ts#L82) |
| function | `maknoonRatio` | [104](../../src/content/mushafGeometry.ts#L104) |

### src/content/mushafPageMetrics.ts

[Volledige bron](../../src/content/mushafPageMetrics.ts), 113 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Profile` | [7](../../src/content/mushafPageMetrics.ts#L7) |
| function | `countAyahs` | [16](../../src/content/mushafPageMetrics.ts#L16) |
| function | `profileFor` | [22](../../src/content/mushafPageMetrics.ts#L22) |
| function | `mushafPageAyahCount` | [76](../../src/content/mushafPageMetrics.ts#L76) |
| function | `mushafPageDensity` | [90](../../src/content/mushafPageMetrics.ts#L90) |

### src/content/quran.ts

[Volledige bron](../../src/content/quran.ts), 32 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `getAyahs` | [8](../../src/content/quran.ts#L8) |
| function-variable | `chapterById` | [13](../../src/content/quran.ts#L13) |
| function | `normalizeSearch` | [14](../../src/content/quran.ts#L14) |
| function | `divisionEnd` | [25](../../src/content/quran.ts#L25) |

### src/content/study.ts

[Volledige bron](../../src/content/study.ts), 43 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `parseStudyAyahs` | [7](../../src/content/study.ts#L7) |
| function | `getStudyAyahs` | [24](../../src/content/study.ts#L24) |
| function | `getStudyAyah` | [40](../../src/content/study.ts#L40) |

### src/content/translations.ts

[Volledige bron](../../src/content/translations.ts), 30 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `TranslationLanguage` | [9](../../src/content/translations.ts#L9) |
| type | `TranslationChoice` | [10](../../src/content/translations.ts#L10) |
| function | `resolveTranslationLanguage` | [13](../../src/content/translations.ts#L13) |
| function | `isTranslationChoice` | [21](../../src/content/translations.ts#L21) |
| function | `getAyahTranslation` | [26](../../src/content/translations.ts#L26) |

### src/content/types.ts

[Volledige bron](../../src/content/types.ts), 26 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Word` | [1](../../src/content/types.ts#L1) |
| type | `Ayah` | [7](../../src/content/types.ts#L7) |
| type | `StudyAyah` | [8](../../src/content/types.ts#L8) |
| type | `Chapter` | [9](../../src/content/types.ts#L9) |
| type | `Division` | [17](../../src/content/types.ts#L17) |

### src/domain/agenda.ts

[Volledige bron](../../src/domain/agenda.ts), 65 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AgendaDayStatus` | [4](../../src/domain/agenda.ts#L4) |
| type | `AgendaReminderPreset` | [5](../../src/domain/agenda.ts#L5) |
| function | `agendaReminderPreset` | [8](../../src/domain/agenda.ts#L8) |
| function | `agendaWeekDates` | [16](../../src/domain/agenda.ts#L16) |
| function | `agendaDayStatus` | [21](../../src/domain/agenda.ts#L21) |
| function | `moveAgendaPeriod` | [38](../../src/domain/agenda.ts#L38) |
| function | `orderedAgendaPlans` | [52](../../src/domain/agenda.ts#L52) |

### src/domain/asbabDiscovery.ts

[Volledige bron](../../src/domain/asbabDiscovery.ts), 38 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AsbabAvailability` | [2](../../src/domain/asbabDiscovery.ts#L2) |
| type | `StudyReference` | [4](../../src/domain/asbabDiscovery.ts#L4) |
| function | `hasAsbab` | [5](../../src/domain/asbabDiscovery.ts#L5) |
| function | `availableAsbabBooks` | [15](../../src/domain/asbabDiscovery.ts#L15) |
| function | `availableAsbabSurahs` | [25](../../src/domain/asbabDiscovery.ts#L25) |
| function | `availableAsbabAyahs` | [31](../../src/domain/asbabDiscovery.ts#L31) |

### src/domain/audioPlayback.ts

[Volledige bron](../../src/domain/audioPlayback.ts), 22 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `normalizePlaybackSpeed` | [2](../../src/domain/audioPlayback.ts#L2) |
| function | `normalizeSkipInterval` | [9](../../src/domain/audioPlayback.ts#L9) |
| function | `clipWindow` | [12](../../src/domain/audioPlayback.ts#L12) |
| function | `clipSeekPosition` | [19](../../src/domain/audioPlayback.ts#L19) |

### src/domain/ayahSelection.ts

[Volledige bron](../../src/domain/ayahSelection.ts), 26 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `SelectedVerse` | [4](../../src/domain/ayahSelection.ts#L4) |
| function | `selectionVerses` | [7](../../src/domain/ayahSelection.ts#L7) |
| function | `selectionQuote` | [20](../../src/domain/ayahSelection.ts#L20) |

### src/domain/bookPresentation.ts

[Volledige bron](../../src/domain/bookPresentation.ts), 207 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `BookEntryState` | [7](../../src/domain/bookPresentation.ts#L7) |
| type | `ResolvedBookEntry` | [8](../../src/domain/bookPresentation.ts#L8) |
| function | `normalizeBookPresentation` | [15](../../src/domain/bookPresentation.ts#L15) |
| function | `preferredMushafEdition` | [19](../../src/domain/bookPresentation.ts#L19) |
| function | `canonicalHafsPage` | [23](../../src/domain/bookPresentation.ts#L23) |
| function | `verifiedHafsPage` | [29](../../src/domain/bookPresentation.ts#L29) |
| function | `resolveBookEntry` | [41](../../src/domain/bookPresentation.ts#L41) |
| function | `beginBookSelection` | [121](../../src/domain/bookPresentation.ts#L121) |
| function | `restoreBookSelection` | [147](../../src/domain/bookPresentation.ts#L147) |
| function | `bookSelectionReturnDistance` | [196](../../src/domain/bookPresentation.ts#L196) |

### src/domain/bookTranslation.ts

[Volledige bron](../../src/domain/bookTranslation.ts), 30 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `BookTranslationVerse` | [6](../../src/domain/bookTranslation.ts#L6) |
| function | `bookTranslationVerses` | [9](../../src/domain/bookTranslation.ts#L9) |

### src/domain/checklist.ts

[Volledige bron](../../src/domain/checklist.ts), 111 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `verseIndex` | [5](../../src/domain/checklist.ts#L5) |
| function | `versePoint` | [17](../../src/domain/checklist.ts#L17) |
| function | `checklistRange` | [27](../../src/domain/checklist.ts#L27) |
| function | `checklistRange.start` | [40](../../src/domain/checklist.ts#L40) |
| function | `checklistAnchor` | [50](../../src/domain/checklist.ts#L50) |
| function | `checklistChildren` | [61](../../src/domain/checklist.ts#L61) |
| function | `toggleCoverage` | [69](../../src/domain/checklist.ts#L69) |
| type | `ChecklistState` | [82](../../src/domain/checklist.ts#L82) |
| function | `decodeChecklistState` | [84](../../src/domain/checklist.ts#L84) |
| function | `clearChecklistCoverage` | [105](../../src/domain/checklist.ts#L105) |
| function | `clearChecklistPosition` | [108](../../src/domain/checklist.ts#L108) |

### src/domain/dockPreferences.ts

[Volledige bron](../../src/domain/dockPreferences.ts), 41 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `DockDestinationId` | [18](../../src/domain/dockPreferences.ts#L18) |
| function | `visibleDockDestinations` | [23](../../src/domain/dockPreferences.ts#L23) |
| function | `normalizeDockDestinations` | [28](../../src/domain/dockPreferences.ts#L28) |

### src/domain/focus.ts

[Volledige bron](../../src/domain/focus.ts), 115 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `FocusGoal` | [3](../../src/domain/focus.ts#L3) |
| type | `FocusTimer` | [4](../../src/domain/focus.ts#L4) |
| type | `FocusAction` | [14](../../src/domain/focus.ts#L14) |
| function | `initialFocus` | [21](../../src/domain/focus.ts#L21) |
| function | `focusReducer` | [33](../../src/domain/focus.ts#L33) |
| function | `decodeFocus` | [81](../../src/domain/focus.ts#L81) |

### src/domain/goalRegistration.ts

[Volledige bron](../../src/domain/goalRegistration.ts), 24 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `goalRegistrationTimestamp` | [5](../../src/domain/goalRegistration.ts#L5) |

### src/domain/goals.ts

[Volledige bron](../../src/domain/goals.ts), 181 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `unitQuranFraction` | [7](../../src/domain/goals.ts#L7) |
| function | `historyQuranFraction` | [20](../../src/domain/goals.ts#L20) |
| function | `progressForGoal` | [26](../../src/domain/goals.ts#L26) |
| function | `recordGoalSession` | [44](../../src/domain/goals.ts#L44) |
| function | `refreshGoalDays` | [81](../../src/domain/goals.ts#L81) |
| function | `saveGoalDefinition` | [103](../../src/domain/goals.ts#L103) |
| function | `resolveGoalDay` | [148](../../src/domain/goals.ts#L148) |

### src/domain/hifz.ts

[Volledige bron](../../src/domain/hifz.ts), 61 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AssessmentKind` | [3](../../src/domain/hifz.ts#L3) |
| type | `Assessment` | [4](../../src/domain/hifz.ts#L4) |
| function | `averageAssessmentScore` | [12](../../src/domain/hifz.ts#L12) |
| function | `explicitAssessments` | [17](../../src/domain/hifz.ts#L17) |
| function | `reviewIntervalDays` | [34](../../src/domain/hifz.ts#L34) |
| function | `reviewDue` | [37](../../src/domain/hifz.ts#L37) |
| function | `inconsistentJuz` | [44](../../src/domain/hifz.ts#L44) |

### src/domain/hifzPresentation.ts

[Volledige bron](../../src/domain/hifzPresentation.ts), 32 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `hifzCardColors` | [17](../../src/domain/hifzPresentation.ts#L17) |

### src/domain/hifzSlider.ts

[Volledige bron](../../src/domain/hifzSlider.ts), 6 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `hifzSliderValue` | [1](../../src/domain/hifzSlider.ts#L1) |

### src/domain/hizbAnalytics.ts

[Volledige bron](../../src/domain/hizbAnalytics.ts), 73 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `HizbPeriod` | [4](../../src/domain/hizbAnalytics.ts#L4) |
| type | `HizbDateRange` | [5](../../src/domain/hizbAnalytics.ts#L5) |
| type | `HizbReadingCount` | [6](../../src/domain/hizbAnalytics.ts#L6) |
| function | `subtractCalendarMonths` | [8](../../src/domain/hizbAnalytics.ts#L8) |
| function | `hizbDateRange` | [18](../../src/domain/hizbAnalytics.ts#L18) |
| function | `hizbDateBounds` | [31](../../src/domain/hizbAnalytics.ts#L31) |
| function-variable | `hizbDateBounds.localMidnight` | [35](../../src/domain/hizbAnalytics.ts#L35) |
| function | `completeHizbCounts` | [41](../../src/domain/hizbAnalytics.ts#L41) |
| function | `countHizbReadings` | [49](../../src/domain/hizbAnalytics.ts#L49) |

### src/domain/journey.ts

[Volledige bron](../../src/domain/journey.ts), 59 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `parseDateKey` | [4](../../src/domain/journey.ts#L4) |
| function | `addDays` | [11](../../src/domain/journey.ts#L11) |
| function | `buildJourneyPlans` | [16](../../src/domain/journey.ts#L16) |

### src/domain/layoutDirection.ts

[Volledige bron](../../src/domain/layoutDirection.ts), 24 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LayoutDirection` | [1](../../src/domain/layoutDirection.ts#L1) |
| function | `layoutDirection` | [4](../../src/domain/layoutDirection.ts#L4) |
| function | `mirroredIconScale` | [9](../../src/domain/layoutDirection.ts#L9) |
| function | `selectedOptionScrollX` | [14](../../src/domain/layoutDirection.ts#L14) |

### src/domain/localDate.ts

[Volledige bron](../../src/domain/localDate.ts), 5 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `localDate` | [2](../../src/domain/localDate.ts#L2) |

### src/domain/motivation.ts

[Volledige bron](../../src/domain/motivation.ts), 71 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `motivationLevel` | [6](../../src/domain/motivation.ts#L6) |
| function | `motivationBonusPoints` | [25](../../src/domain/motivation.ts#L25) |
| function | `motivationStats` | [28](../../src/domain/motivation.ts#L28) |
| function-variable | `motivationStats.points` | [45](../../src/domain/motivation.ts#L45) |
| function-variable | `motivationStats.sum` | [49](../../src/domain/motivation.ts#L49) |

### src/domain/mushafBookmarks.ts

[Volledige bron](../../src/domain/mushafBookmarks.ts), 43 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `bookmarkPresentation` | [9](../../src/domain/mushafBookmarks.ts#L9) |
| function | `matchesMushafBookmarkPage` | [17](../../src/domain/mushafBookmarks.ts#L17) |
| function | `legacyWarshBookmarks` | [31](../../src/domain/mushafBookmarks.ts#L31) |

### src/domain/mushafReading.ts

[Volledige bron](../../src/domain/mushafReading.ts), 155 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `mushafPageRange` | [5](../../src/domain/mushafReading.ts#L5) |
| function | `mushafSpread` | [25](../../src/domain/mushafReading.ts#L25) |
| function | `mushafPageEntry` | [31](../../src/domain/mushafReading.ts#L31) |
| function | `mushafPageMarkKey` | [60](../../src/domain/mushafReading.ts#L60) |
| function | `mushafPageMark` | [70](../../src/domain/mushafReading.ts#L70) |
| type | `MushafPageMarkChange` | [94](../../src/domain/mushafReading.ts#L94) |
| function | `setMushafPageMarks` | [105](../../src/domain/mushafReading.ts#L105) |

### src/domain/mushafResume.ts

[Volledige bron](../../src/domain/mushafResume.ts), 42 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `SavedPositions` | [8](../../src/domain/mushafResume.ts#L8) |
| function | `savedMushafPage` | [11](../../src/domain/mushafResume.ts#L11) |
| function | `mushafResume` | [22](../../src/domain/mushafResume.ts#L22) |

### src/domain/mutashabihat.ts

[Volledige bron](../../src/domain/mutashabihat.ts), 107 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `SimilarChapter` | [1](../../src/domain/mutashabihat.ts#L1) |
| type | `SimilarAyah` | [2](../../src/domain/mutashabihat.ts#L2) |
| type | `SimilarSequence` | [3](../../src/domain/mutashabihat.ts#L3) |
| type | `SimilarGroup` | [4](../../src/domain/mutashabihat.ts#L4) |
| function | `location` | [14](../../src/domain/mutashabihat.ts#L14) |
| function | `sequence` | [23](../../src/domain/mutashabihat.ts#L23) |
| function | `parseMutashabihatGroups` | [35](../../src/domain/mutashabihat.ts#L35) |
| function | `filterMutashabihatGroups` | [74](../../src/domain/mutashabihat.ts#L74) |
| function | `similarReferenceLabel` | [87](../../src/domain/mutashabihat.ts#L87) |
| function | `similarSequenceText` | [101](../../src/domain/mutashabihat.ts#L101) |

### src/domain/noteCounts.ts

[Volledige bron](../../src/domain/noteCounts.ts), 22 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `countNotesForTarget` | [5](../../src/domain/noteCounts.ts#L5) |

### src/domain/notesLibrary.ts

[Volledige bron](../../src/domain/notesLibrary.ts), 182 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `normalizeNoteFolder` | [4](../../src/domain/notesLibrary.ts#L4) |
| function | `nextFreeNoteId` | [9](../../src/domain/notesLibrary.ts#L9) |
| function | `mergeImportedNotes` | [22](../../src/domain/notesLibrary.ts#L22) |
| function-variable | `mergeImportedNotes.fingerprint` | [26](../../src/domain/notesLibrary.ts#L26) |
| type | `DropBounds` | [57](../../src/domain/notesLibrary.ts#L57) |
| type | `FolderDropRect` | [63](../../src/domain/notesLibrary.ts#L63) |
| function | `folderAtPoint` | [64](../../src/domain/notesLibrary.ts#L64) |
| function-variable | `folderAtPoint.contains` | [70](../../src/domain/notesLibrary.ts#L70) |
| function | `parseNotesImport` | [84](../../src/domain/notesLibrary.ts#L84) |
| function-variable | `parseNotesImport.record` | [87](../../src/domain/notesLibrary.ts#L87) |
| function-variable | `parseNotesImport.str` | [101](../../src/domain/notesLibrary.ts#L101) |
| function-variable | `parseNotesImport.num` | [105](../../src/domain/notesLibrary.ts#L105) |
| function-variable | `parseNotesImport.nullable` | [110](../../src/domain/notesLibrary.ts#L110) |
| function-variable | `parseNotesImport.bool` | [112](../../src/domain/notesLibrary.ts#L112) |

### src/domain/notificationPreferences.ts

[Volledige bron](../../src/domain/notificationPreferences.ts), 61 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LocalNotificationPreferences` | [1](../../src/domain/notificationPreferences.ts#L1) |
| function | `decodeNotificationPreferences` | [23](../../src/domain/notificationPreferences.ts#L23) |
| function | `nextAllowedReminder` | [47](../../src/domain/notificationPreferences.ts#L47) |

### src/domain/onboarding.ts

[Volledige bron](../../src/domain/onboarding.ts), 54 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `OnboardingStep` | [9](../../src/domain/onboarding.ts#L9) |
| function | `resolveOnboardingStep` | [10](../../src/domain/onboarding.ts#L10) |
| function | `adjacentStep` | [14](../../src/domain/onboarding.ts#L14) |
| type | `DemoTimer` | [19](../../src/domain/onboarding.ts#L19) |
| function-variable | `freshDemoTimer` | [20](../../src/domain/onboarding.ts#L20) |
| function | `sampleDemoTimer` | [25](../../src/domain/onboarding.ts#L25) |
| function | `toggleDemoTimer` | [30](../../src/domain/onboarding.ts#L30) |
| function | `validDemoPlan` | [34](../../src/domain/onboarding.ts#L34) |

### src/domain/plannedPassage.ts

[Volledige bron](../../src/domain/plannedPassage.ts), 43 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `rubPassage` | [5](../../src/domain/plannedPassage.ts#L5) |
| function | `rubPassageLabel` | [25](../../src/domain/plannedPassage.ts#L25) |
| function-variable | `rubPassageLabel.name` | [28](../../src/domain/plannedPassage.ts#L28) |
| function | `plannedPassageTitle` | [35](../../src/domain/plannedPassage.ts#L35) |

### src/domain/planning.ts

[Volledige bron](../../src/domain/planning.ts), 51 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `planIdentity` | [5](../../src/domain/planning.ts#L5) |
| type | `GoalUnit` | [11](../../src/domain/planning.ts#L11) |
| function | `deriveDailyGoalFromJourney` | [14](../../src/domain/planning.ts#L14) |
| function | `goalAction` | [22](../../src/domain/planning.ts#L22) |
| interface | `GoalDaySnapshot` | [26](../../src/domain/planning.ts#L26) |
| interface | `GoalDayProgress` | [34](../../src/domain/planning.ts#L34) |
| function | `goalDayProgress` | [41](../../src/domain/planning.ts#L41) |

### src/domain/progressActions.ts

[Volledige bron](../../src/domain/progressActions.ts), 168 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `partitionReadStatus` | [5](../../src/domain/progressActions.ts#L5) |
| function | `firstUnreadPartition` | [29](../../src/domain/progressActions.ts#L29) |
| function | `sourceRubName` | [41](../../src/domain/progressActions.ts#L41) |
| function | `removeReadMark` | [44](../../src/domain/progressActions.ts#L44) |
| function | `markSurahMemorized` | [111](../../src/domain/progressActions.ts#L111) |

### src/domain/quickCheckIn.ts

[Volledige bron](../../src/domain/quickCheckIn.ts), 39 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `QuickCheckDraft` | [3](../../src/domain/quickCheckIn.ts#L3) |
| function | `quickCheckTargets` | [11](../../src/domain/quickCheckIn.ts#L11) |

### src/domain/quran.ts

[Volledige bron](../../src/domain/quran.ts), 94 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `QuranProgressKind` | [9](../../src/domain/quran.ts#L9) |
| function-variable | `juzProgressId` | [11](../../src/domain/quran.ts#L11) |
| function-variable | `hizbProgressId` | [12](../../src/domain/quran.ts#L12) |
| function-variable | `rubProgressId` | [13](../../src/domain/quran.ts#L13) |
| function-variable | `surahProgressId` | [15](../../src/domain/quran.ts#L15) |
| type | `NoteScope` | [25](../../src/domain/quran.ts#L25) |
| interface | `QuranNoteTarget` | [26](../../src/domain/quran.ts#L26) |
| function | `validateNoteTarget` | [40](../../src/domain/quran.ts#L40) |
| function | `targetHizbNumber` | [56](../../src/domain/quran.ts#L56) |
| function | `targetQuarter` | [62](../../src/domain/quran.ts#L62) |
| function | `noteTargetIncludes` | [66](../../src/domain/quran.ts#L66) |
| function | `switchNoteScope` | [84](../../src/domain/quran.ts#L84) |

### src/domain/quranNavigation.ts

[Volledige bron](../../src/domain/quranNavigation.ts), 93 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `RubStart` | [8](../../src/domain/quranNavigation.ts#L8) |
| function | `resolveRubStart` | [11](../../src/domain/quranNavigation.ts#L11) |
| function | `resolveReaderEntry` | [45](../../src/domain/quranNavigation.ts#L45) |
| type | `QuranSearchResult` | [67](../../src/domain/quranNavigation.ts#L67) |
| function | `searchQuran` | [73](../../src/domain/quranNavigation.ts#L73) |

### src/domain/readerTypography.ts

[Volledige bron](../../src/domain/readerTypography.ts), 8 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `stepArabicFontSize` | [5](../../src/domain/readerTypography.ts#L5) |

### src/domain/readingContext.ts

[Volledige bron](../../src/domain/readingContext.ts), 44 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `BookView` | [4](../../src/domain/readingContext.ts#L4) |
| type | `BookSelectionOrigin` | [5](../../src/domain/readingContext.ts#L5) |
| type | `ReadingContext` | [18](../../src/domain/readingContext.ts#L18) |
| type | `MushafReadingContext` | [41](../../src/domain/readingContext.ts#L41) |

### src/domain/readingJourney.ts

[Volledige bron](../../src/domain/readingJourney.ts), 98 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ReadingJourneyConfiguration` | [5](../../src/domain/readingJourney.ts#L5) |
| function | `readingJourneyProgress` | [20](../../src/domain/readingJourney.ts#L20) |
| function | `readingJourneyForecast` | [38](../../src/domain/readingJourney.ts#L38) |
| function | `journeyDialogTarget` | [58](../../src/domain/readingJourney.ts#L58) |
| function | `saveReadingJourneyConfiguration` | [72](../../src/domain/readingJourney.ts#L72) |

### src/domain/readingMetrics.ts

[Volledige bron](../../src/domain/readingMetrics.ts), 53 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ayahEquivalent` | [7](../../src/domain/readingMetrics.ts#L7) |
| function | `historyAyahEquivalent` | [33](../../src/domain/readingMetrics.ts#L33) |
| function | `pageEquivalent` | [50](../../src/domain/readingMetrics.ts#L50) |

### src/domain/readingPlan.ts

[Volledige bron](../../src/domain/readingPlan.ts), 118 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ReadingPlanUnit` | [6](../../src/domain/readingPlan.ts#L6) |
| type | `IndependentReadingPlan` | [7](../../src/domain/readingPlan.ts#L7) |
| function | `readingPlanLogged` | [23](../../src/domain/readingPlan.ts#L23) |
| function | `readingPlanDone` | [37](../../src/domain/readingPlan.ts#L37) |
| function | `normalizePlanNumber` | [43](../../src/domain/readingPlan.ts#L43) |
| function | `decodeReadingPlan` | [49](../../src/domain/readingPlan.ts#L49) |
| function | `validateReadingPlan` | [62](../../src/domain/readingPlan.ts#L62) |
| function | `saveReadingPlan` | [75](../../src/domain/readingPlan.ts#L75) |
| function | `correctReadingPlan` | [92](../../src/domain/readingPlan.ts#L92) |
| function | `readingPlanPace` | [101](../../src/domain/readingPlan.ts#L101) |

### src/domain/readingUnit.ts

[Volledige bron](../../src/domain/readingUnit.ts), 17 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `readingUnitLabelKey` | [14](../../src/domain/readingUnit.ts#L14) |

### src/domain/repeat.ts

[Volledige bron](../../src/domain/repeat.ts), 147 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `RepeatTiming` | [1](../../src/domain/repeat.ts#L1) |
| type | `AudioSelection` | [6](../../src/domain/repeat.ts#L6) |
| function | `validRepeatPageRange` | [10](../../src/domain/repeat.ts#L10) |
| function | `nextRepeatStep` | [18](../../src/domain/repeat.ts#L18) |
| function | `validateRepeatTimings` | [43](../../src/domain/repeat.ts#L43) |
| interface | `RepeatReciter` | [58](../../src/domain/repeat.ts#L58) |
| function | `repeatReciterOptions` | [128](../../src/domain/repeat.ts#L128) |
| function | `normalizedRepeatReciter` | [132](../../src/domain/repeat.ts#L132) |
| function | `normalizedRepeatRounds` | [137](../../src/domain/repeat.ts#L137) |
| function | `repeatAyahUrl` | [141](../../src/domain/repeat.ts#L141) |

### src/domain/selectableMushaf.ts

[Volledige bron](../../src/domain/selectableMushaf.ts), 229 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `CanonicalMushafWord` | [12](../../src/domain/selectableMushaf.ts#L12) |
| type | `SelectableMushafEdition` | [13](../../src/domain/selectableMushaf.ts#L13) |
| type | `MushafWordAlignment` | [14](../../src/domain/selectableMushaf.ts#L14) |
| type | `SelectableMushafToken` | [20](../../src/domain/selectableMushaf.ts#L20) |
| type | `SelectableMushafLine` | [32](../../src/domain/selectableMushaf.ts#L32) |
| type | `SelectableMushafPageData` | [40](../../src/domain/selectableMushaf.ts#L40) |
| type | `SourceWord` | [56](../../src/domain/selectableMushaf.ts#L56) |
| type | `SourceMushafVerse` | [66](../../src/domain/selectableMushaf.ts#L66) |
| function | `record` | [68](../../src/domain/selectableMushaf.ts#L68) |
| function | `integer` | [73](../../src/domain/selectableMushaf.ts#L73) |
| function | `unicodeText` | [76](../../src/domain/selectableMushaf.ts#L76) |
| function | `parseMushafResponse` | [86](../../src/domain/selectableMushaf.ts#L86) |
| function | `buildSelectableMushafPage` | [134](../../src/domain/selectableMushaf.ts#L134) |
| function | `verifyMushafWord` | [220](../../src/domain/selectableMushaf.ts#L220) |

### src/domain/selectableMushafText.ts

[Volledige bron](../../src/domain/selectableMushafText.ts), 136 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `SelectablePagePart` | [10](../../src/domain/selectableMushafText.ts#L10) |
| type | `SelectablePageTextLine` | [16](../../src/domain/selectableMushafText.ts#L16) |
| type | `SelectablePageText` | [24](../../src/domain/selectableMushafText.ts#L24) |
| function | `selectablePageLayoutKey` | [27](../../src/domain/selectableMushafText.ts#L27) |
| function | `selectablePageText` | [38](../../src/domain/selectableMushafText.ts#L38) |
| type | `MeasuredSelectableLine` | [105](../../src/domain/selectableMushafText.ts#L105) |
| function | `fitSelectablePageText` | [108](../../src/domain/selectableMushafText.ts#L108) |

### src/domain/selectableWarsh.ts

[Volledige bron](../../src/domain/selectableWarsh.ts), 255 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `printedWarshPageAyahs` | [10](../../src/domain/selectableWarsh.ts#L10) |
| function | `sourceReference` | [30](../../src/domain/selectableWarsh.ts#L30) |
| type | `WarshSourceWord` | [52](../../src/domain/selectableWarsh.ts#L52) |
| function-variable | `integer` | [61](../../src/domain/selectableWarsh.ts#L61) |
| function-variable | `referenceKey` | [63](../../src/domain/selectableWarsh.ts#L63) |
| function | `parseWarshMushafResponse` | [66](../../src/domain/selectableWarsh.ts#L66) |
| function | `warshBasmallah` | [162](../../src/domain/selectableWarsh.ts#L162) |
| function | `warshNeedsBasmallah` | [167](../../src/domain/selectableWarsh.ts#L167) |
| function | `buildSelectableWarshPage` | [172](../../src/domain/selectableWarsh.ts#L172) |
| function-variable | `buildSelectableWarshPage.addLine` | [184](../../src/domain/selectableWarsh.ts#L184) |
| function-variable | `buildSelectableWarshPage.addToken` | [196](../../src/domain/selectableWarsh.ts#L196) |

### src/domain/statistics.ts

[Volledige bron](../../src/domain/statistics.ts), 352 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `StatsReadingPeriod` | [8](../../src/domain/statistics.ts#L8) |
| type | `StatsDistribution` | [9](../../src/domain/statistics.ts#L9) |
| type | `StatsReadingBucket` | [10](../../src/domain/statistics.ts#L10) |
| function | `weeklyHistoryActivity` | [13](../../src/domain/statistics.ts#L13) |
| function | `statsPeriodHistory` | [27](../../src/domain/statistics.ts#L27) |
| function | `newestFirst` | [42](../../src/domain/statistics.ts#L42) |
| function | `statsReadingBuckets` | [49](../../src/domain/statistics.ts#L49) |
| function | `statsRingSegment` | [70](../../src/domain/statistics.ts#L70) |
| function | `historyQuarter` | [93](../../src/domain/statistics.ts#L93) |
| function | `statsHistoryRange` | [100](../../src/domain/statistics.ts#L100) |
| type | `StatsHistoryGroupMode` | [136](../../src/domain/statistics.ts#L136) |
| type | `StatsHistoryDisplayItem` | [137](../../src/domain/statistics.ts#L137) |
| type | `StatsHistoryGroup` | [147](../../src/domain/statistics.ts#L147) |
| function | `statsIsoWeek` | [150](../../src/domain/statistics.ts#L150) |
| function | `statsHistoryDisplayItems` | [159](../../src/domain/statistics.ts#L159) |
| function | `statsHistoryGroups` | [192](../../src/domain/statistics.ts#L192) |
| function | `statsDateKey` | [230](../../src/domain/statistics.ts#L230) |
| function | `statsOverview` | [238](../../src/domain/statistics.ts#L238) |
| function-variable | `statsOverview.pagesSince` | [251](../../src/domain/statistics.ts#L251) |
| function-variable | `statsOverview.hizbFromRub` | [262](../../src/domain/statistics.ts#L262) |
| function-variable | `statsOverview.marked` | [264](../../src/domain/statistics.ts#L264) |
| function-variable | `statsOverview.dateKey` | [274](../../src/domain/statistics.ts#L274) |
| function | `statsHistoryOpening` | [314](../../src/domain/statistics.ts#L314) |
| function | `statsHistoryTitle` | [343](../../src/domain/statistics.ts#L343) |

### src/domain/study.ts

[Volledige bron](../../src/domain/study.ts), 38 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `AyahReference` | [3](../../src/domain/study.ts#L3) |
| function | `absoluteAyahLocation` | [9](../../src/domain/study.ts#L9) |
| function | `absoluteAyahId` | [22](../../src/domain/study.ts#L22) |

### src/domain/themePreferences.ts

[Volledige bron](../../src/domain/themePreferences.ts), 35 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ThemeMode` | [21](../../src/domain/themePreferences.ts#L21) |
| type | `FixedThemeMode` | [22](../../src/domain/themePreferences.ts#L22) |
| function | `isThemeMode` | [24](../../src/domain/themePreferences.ts#L24) |
| function | `normalizeThemeMode` | [28](../../src/domain/themePreferences.ts#L28) |
| function | `resolvedThemeMode` | [32](../../src/domain/themePreferences.ts#L32) |

### src/exporting/notesExport.ts

[Volledige bron](../../src/exporting/notesExport.ts), 156 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `ExportableNote` | [5](../../src/exporting/notesExport.ts#L5) |
| interface | `NotesExportEntry` | [31](../../src/exporting/notesExport.ts#L31) |
| interface | `NotesExport` | [61](../../src/exporting/notesExport.ts#L61) |
| function | `noteTagList` | [71](../../src/exporting/notesExport.ts#L71) |
| function | `isoInstant` | [83](../../src/exporting/notesExport.ts#L83) |
| function | `buildNotesExport` | [93](../../src/exporting/notesExport.ts#L93) |
| function | `stringifyNotesExport` | [143](../../src/exporting/notesExport.ts#L143) |
| function | `notesExportFileName` | [151](../../src/exporting/notesExport.ts#L151) |

### src/features/account/appearanceCopy.ts

[Volledige bron](../../src/features/account/appearanceCopy.ts), 99 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AppearanceCopy` | [4](../../src/features/account/appearanceCopy.ts#L4) |

### src/features/account/components/AppleSignInButton.ios.tsx

[Volledige bron](../../src/features/account/components/AppleSignInButton.ios.tsx), 46 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `AppleSignInButton` | [8](../../src/features/account/components/AppleSignInButton.ios.tsx#L8) |

### src/features/account/components/AppleSignInButton.tsx

[Volledige bron](../../src/features/account/components/AppleSignInButton.tsx), 11 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AppleSignInButtonProps` | [1](../../src/features/account/components/AppleSignInButton.tsx#L1) |
| method | `AppleSignInButtonProps.onPress` | [4](../../src/features/account/components/AppleSignInButton.tsx#L4) |
| function | `AppleSignInButton` | [8](../../src/features/account/components/AppleSignInButton.tsx#L8) |

### src/features/account/components/AuthLinkHandler.tsx

[Volledige bron](../../src/features/account/components/AuthLinkHandler.tsx), 78 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `AuthLinkHandler` | [9](../../src/features/account/components/AuthLinkHandler.tsx#L9) |
| function-variable | `AuthLinkHandler.failure` | [21](../../src/features/account/components/AuthLinkHandler.tsx#L21) |
| function-variable | `AuthLinkHandler.syncRefresh` | [34](../../src/features/account/components/AuthLinkHandler.tsx#L34) |
| function | `AuthLinkHandler.handleUrl` | [41](../../src/features/account/components/AuthLinkHandler.tsx#L41) |

### src/features/account/components/KeyboardFormScreen.tsx

[Volledige bron](../../src/features/account/components/KeyboardFormScreen.tsx), 122 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `KeyboardFormScreen` | [17](../../src/features/account/components/KeyboardFormScreen.tsx#L17) |
| function-variable | `KeyboardFormScreen.update` | [62](../../src/features/account/components/KeyboardFormScreen.tsx#L62) |

### src/features/account/components/LocalRemindersPanel.tsx

[Volledige bron](../../src/features/account/components/LocalRemindersPanel.tsx), 230 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `TimeKey` | [25](../../src/features/account/components/LocalRemindersPanel.tsx#L25) |
| function-variable | `clock` | [26](../../src/features/account/components/LocalRemindersPanel.tsx#L26) |
| function | `LocalRemindersPanel` | [29](../../src/features/account/components/LocalRemindersPanel.tsx#L29) |
| function | `LocalRemindersPanel.save` | [60](../../src/features/account/components/LocalRemindersPanel.tsx#L60) |
| function-variable | `LocalRemindersPanel.toggle` | [115](../../src/features/account/components/LocalRemindersPanel.tsx#L115) |
| function | `LocalRemindersPanel.time` | [131](../../src/features/account/components/LocalRemindersPanel.tsx#L131) |

### src/features/account/components/NotificationSystemPanel.tsx

[Volledige bron](../../src/features/account/components/NotificationSystemPanel.tsx), 78 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NotificationSystemPanel` | [14](../../src/features/account/components/NotificationSystemPanel.tsx#L14) |
| function-variable | `NotificationSystemPanel.copy` | [16](../../src/features/account/components/NotificationSystemPanel.tsx#L16) |

### src/features/account/components/PushNotificationHandler.tsx

[Volledige bron](../../src/features/account/components/PushNotificationHandler.tsx), 206 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `PendingTap` | [25](../../src/features/account/components/PushNotificationHandler.tsx#L25) |
| function | `PushNotificationHandler` | [28](../../src/features/account/components/PushNotificationHandler.tsx#L28) |
| function-variable | `PushNotificationHandler.handleResponse` | [88](../../src/features/account/components/PushNotificationHandler.tsx#L88) |
| function-variable | `PushNotificationHandler.handleUrl` | [110](../../src/features/account/components/PushNotificationHandler.tsx#L110) |
| function-variable | `PushNotificationHandler.reconcileSession` | [136](../../src/features/account/components/PushNotificationHandler.tsx#L136) |

### src/features/account/hooks/useAccountProfile.ts

[Volledige bron](../../src/features/account/hooks/useAccountProfile.ts), 118 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Feedback` | [5](../../src/features/account/hooks/useAccountProfile.ts#L5) |
| function | `useAccountProfile` | [12](../../src/features/account/hooks/useAccountProfile.ts#L12) |
| function | `useAccountProfile.changeProfileName` | [58](../../src/features/account/hooks/useAccountProfile.ts#L58) |
| function | `useAccountProfile.updateProfile` | [63](../../src/features/account/hooks/useAccountProfile.ts#L63) |

### src/features/account/model/accountCopy.ts

[Volledige bron](../../src/features/account/model/accountCopy.ts), 338 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AccountCopy` | [1](../../src/features/account/model/accountCopy.ts#L1) |

### src/features/account/model/authLinkState.ts

[Volledige bron](../../src/features/account/model/authLinkState.ts), 18 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AuthLinkState` | [1](../../src/features/account/model/authLinkState.ts#L1) |
| function | `getAuthLinkState` | [5](../../src/features/account/model/authLinkState.ts#L5) |
| function | `subscribeAuthLinkState` | [8](../../src/features/account/model/authLinkState.ts#L8) |
| function | `updateAuthLinkState` | [14](../../src/features/account/model/authLinkState.ts#L14) |

### src/features/account/model/notificationSystemCopy.ts

[Volledige bron](../../src/features/account/model/notificationSystemCopy.ts), 53 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `notificationSystemText` | [51](../../src/features/account/model/notificationSystemCopy.ts#L51) |

### src/features/account/screens/AccountScreen.tsx

[Volledige bron](../../src/features/account/screens/AccountScreen.tsx), 865 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Action` | [29](../../src/features/account/screens/AccountScreen.tsx#L29) |
| function | `validEmail` | [31](../../src/features/account/screens/AccountScreen.tsx#L31) |
| function | `validPassword` | [35](../../src/features/account/screens/AccountScreen.tsx#L35) |
| function | `authErrorText` | [38](../../src/features/account/screens/AccountScreen.tsx#L38) |
| function | `emailConfirmationRequired` | [46](../../src/features/account/screens/AccountScreen.tsx#L46) |
| function | `errorCopy` | [50](../../src/features/account/screens/AccountScreen.tsx#L50) |
| function | `AccountScreen` | [71](../../src/features/account/screens/AccountScreen.tsx#L71) |
| function | `AccountScreen.clearForm` | [197](../../src/features/account/screens/AccountScreen.tsx#L197) |
| function | `AccountScreen.openAction` | [207](../../src/features/account/screens/AccountScreen.tsx#L207) |
| function | `AccountScreen.signInWithGoogle` | [241](../../src/features/account/screens/AccountScreen.tsx#L241) |
| function | `AccountScreen.signInWithApple` | [258](../../src/features/account/screens/AccountScreen.tsx#L258) |
| function | `AccountScreen.submitAuth` | [297](../../src/features/account/screens/AccountScreen.tsx#L297) |
| function | `AccountScreen.changeAuthEmail` | [335](../../src/features/account/screens/AccountScreen.tsx#L335) |
| function | `AccountScreen.resendConfirmation` | [342](../../src/features/account/screens/AccountScreen.tsx#L342) |
| function | `AccountScreen.performAction` | [357](../../src/features/account/screens/AccountScreen.tsx#L357) |
| function | `AccountScreen.requestChangeCode` | [408](../../src/features/account/screens/AccountScreen.tsx#L408) |
| function | `AccountScreen.signOut` | [422](../../src/features/account/screens/AccountScreen.tsx#L422) |

### src/features/account/screens/NotificationsScreen.tsx

[Volledige bron](../../src/features/account/screens/NotificationsScreen.tsx), 498 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Override` | [208](../../src/features/account/screens/NotificationsScreen.tsx#L208) |
| function | `NotificationsScreen` | [210](../../src/features/account/screens/NotificationsScreen.tsx#L210) |
| function | `NotificationsScreen.saveGlobal` | [284](../../src/features/account/screens/NotificationsScreen.tsx#L284) |
| function | `NotificationsScreen.saveGroup` | [304](../../src/features/account/screens/NotificationsScreen.tsx#L304) |
| function | `NotificationsScreen.registerDevice` | [331](../../src/features/account/screens/NotificationsScreen.tsx#L331) |
| function | `NotificationsScreen.unregisterDevice` | [358](../../src/features/account/screens/NotificationsScreen.tsx#L358) |
| function-variable | `NotificationsScreen.level` | [373](../../src/features/account/screens/NotificationsScreen.tsx#L373) |

### src/features/account/screens/SettingsScreen.tsx

[Volledige bron](../../src/features/account/screens/SettingsScreen.tsx), 377 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `SettingsScreen` | [138](../../src/features/account/screens/SettingsScreen.tsx#L138) |

### src/features/audio/components/AudioPlayerSheet.tsx

[Volledige bron](../../src/features/audio/components/AudioPlayerSheet.tsx), 214 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `AudioPlayerSheet` | [23](../../src/features/audio/components/AudioPlayerSheet.tsx#L23) |

### src/features/audio/components/AudioSeekBar.tsx

[Volledige bron](../../src/features/audio/components/AudioSeekBar.tsx), 39 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `AudioSeekBar` | [8](../../src/features/audio/components/AudioSeekBar.tsx#L8) |

### src/features/audio/components/MediaSettings.tsx

[Volledige bron](../../src/features/audio/components/MediaSettings.tsx), 244 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `MediaSettings` | [27](../../src/features/audio/components/MediaSettings.tsx#L27) |
| function | `MediaSettings.choose` | [68](../../src/features/audio/components/MediaSettings.tsx#L68) |
| function | `MediaSettings.download` | [89](../../src/features/audio/components/MediaSettings.tsx#L89) |
| function | `MediaSettingsSheet` | [228](../../src/features/audio/components/MediaSettings.tsx#L228) |

### src/features/audio/components/MiniPlayer.tsx

[Volledige bron](../../src/features/audio/components/MiniPlayer.tsx), 150 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `MiniPlayer` | [13](../../src/features/audio/components/MiniPlayer.tsx#L13) |
| function-variable | `MiniPlayer.claim` | [22](../../src/features/audio/components/MiniPlayer.tsx#L22) |

### src/features/audio/components/RepeatSheet.tsx

[Volledige bron](../../src/features/audio/components/RepeatSheet.tsx), 376 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `RepeatSheet` | [29](../../src/features/audio/components/RepeatSheet.tsx#L29) |
| function | `RepeatSheet.downloadSelection` | [106](../../src/features/audio/components/RepeatSheet.tsx#L106) |
| function | `RepeatSheet.start` | [156](../../src/features/audio/components/RepeatSheet.tsx#L156) |

### src/features/audio/model/audioCopy.ts

[Volledige bron](../../src/features/audio/model/audioCopy.ts), 60 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `audioCopy` | [57](../../src/features/audio/model/audioCopy.ts#L57) |

### src/features/audio/model/audioLabels.ts

[Volledige bron](../../src/features/audio/model/audioLabels.ts), 21 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `audioTime` | [4](../../src/features/audio/model/audioLabels.ts#L4) |
| function | `selectionTitle` | [9](../../src/features/audio/model/audioLabels.ts#L9) |

### src/features/audio/providers/AudioProvider.tsx

[Volledige bron](../../src/features/audio/providers/AudioProvider.tsx), 440 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `delay` | [26](../../src/features/audio/providers/AudioProvider.tsx#L26) |
| type | `PlaybackRequest` | [27](../../src/features/audio/providers/AudioProvider.tsx#L27) |
| function | `validateTrack` | [41](../../src/features/audio/providers/AudioProvider.tsx#L41) |
| function | `AudioProvider` | [55](../../src/features/audio/providers/AudioProvider.tsx#L55) |
| function-variable | `AudioProvider.sample` | [98](../../src/features/audio/providers/AudioProvider.tsx#L98) |
| function | `AudioProvider.playQueue` | [270](../../src/features/audio/providers/AudioProvider.tsx#L270) |
| method | `AudioProvider.play` | [306](../../src/features/audio/providers/AudioProvider.tsx#L306) |
| method | `AudioProvider.replaceTrack` | [319](../../src/features/audio/providers/AudioProvider.tsx#L319) |
| method | `AudioProvider.download` | [339](../../src/features/audio/providers/AudioProvider.tsx#L339) |
| method | `AudioProvider.pause` | [342](../../src/features/audio/providers/AudioProvider.tsx#L342) |
| method | `AudioProvider.resume` | [347](../../src/features/audio/providers/AudioProvider.tsx#L347) |
| method | `AudioProvider.stop` | [368](../../src/features/audio/providers/AudioProvider.tsx#L368) |
| method | `AudioProvider.seek` | [383](../../src/features/audio/providers/AudioProvider.tsx#L383) |
| method | `AudioProvider.setRate` | [399](../../src/features/audio/providers/AudioProvider.tsx#L399) |
| method | `AudioProvider.setSkipInterval` | [405](../../src/features/audio/providers/AudioProvider.tsx#L405) |
| method | `AudioProvider.setRepeat` | [411](../../src/features/audio/providers/AudioProvider.tsx#L411) |
| method | `AudioProvider.setAutoplay` | [414](../../src/features/audio/providers/AudioProvider.tsx#L414) |
| method | `AudioProvider.setSleepTimer` | [417](../../src/features/audio/providers/AudioProvider.tsx#L417) |

### src/features/audio/providers/audioContext.ts

[Volledige bron](../../src/features/audio/providers/audioContext.ts), 46 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AudioPlaybackState` | [6](../../src/features/audio/providers/audioContext.ts#L6) |
| type | `AudioControls` | [7](../../src/features/audio/providers/audioContext.ts#L7) |
| method | `AudioControls.play` | [25](../../src/features/audio/providers/audioContext.ts#L25) |
| method | `AudioControls.replaceTrack` | [27](../../src/features/audio/providers/audioContext.ts#L27) |
| method | `AudioControls.playQueue` | [28](../../src/features/audio/providers/audioContext.ts#L28) |
| method | `AudioControls.download` | [29](../../src/features/audio/providers/audioContext.ts#L29) |
| method | `AudioControls.pause` | [30](../../src/features/audio/providers/audioContext.ts#L30) |
| method | `AudioControls.resume` | [31](../../src/features/audio/providers/audioContext.ts#L31) |
| method | `AudioControls.stop` | [32](../../src/features/audio/providers/audioContext.ts#L32) |
| method | `AudioControls.seek` | [33](../../src/features/audio/providers/audioContext.ts#L33) |
| method | `AudioControls.setRate` | [34](../../src/features/audio/providers/audioContext.ts#L34) |
| method | `AudioControls.setSkipInterval` | [35](../../src/features/audio/providers/audioContext.ts#L35) |
| method | `AudioControls.setRepeat` | [36](../../src/features/audio/providers/audioContext.ts#L36) |
| method | `AudioControls.setAutoplay` | [37](../../src/features/audio/providers/audioContext.ts#L37) |
| method | `AudioControls.setSleepTimer` | [38](../../src/features/audio/providers/audioContext.ts#L38) |
| function | `useAudio` | [41](../../src/features/audio/providers/audioContext.ts#L41) |

### src/features/bookmarks/bookmarkCopy.ts

[Volledige bron](../../src/features/bookmarks/bookmarkCopy.ts), 49 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/features/bookmarks/bookmarks.ts

[Volledige bron](../../src/features/bookmarks/bookmarks.ts), 82 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `BookmarkSort` | [5](../../src/features/bookmarks/bookmarks.ts#L5) |
| type | `Bookmark` | [6](../../src/features/bookmarks/bookmarks.ts#L6) |
| type | `SavedBookmark` | [9](../../src/features/bookmarks/bookmarks.ts#L9) |
| function | `pageBookmarkKey` | [11](../../src/features/bookmarks/bookmarks.ts#L11) |
| function | `savedBookmarks` | [17](../../src/features/bookmarks/bookmarks.ts#L17) |
| function | `savedBookmarkTarget` | [55](../../src/features/bookmarks/bookmarks.ts#L55) |
| function | `bookmarkEditionName` | [77](../../src/features/bookmarks/bookmarks.ts#L77) |

### src/features/bookmarks/screens/BookmarksScreen.tsx

[Volledige bron](../../src/features/bookmarks/screens/BookmarksScreen.tsx), 75 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `BookmarksScreen` | [16](../../src/features/bookmarks/screens/BookmarksScreen.tsx#L16) |

### src/features/groups/chatCopy.ts

[Volledige bron](../../src/features/groups/chatCopy.ts), 45 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `chatText` | [44](../../src/features/groups/chatCopy.ts#L44) |

### src/features/groups/communityCopy.ts

[Volledige bron](../../src/features/groups/communityCopy.ts), 98 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `communityText` | [57](../../src/features/groups/communityCopy.ts#L57) |
| function | `groupRoleLabel` | [60](../../src/features/groups/communityCopy.ts#L60) |
| function | `groupStatusLabel` | [74](../../src/features/groups/communityCopy.ts#L74) |

### src/features/groups/components/ExpandablePostText.tsx

[Volledige bron](../../src/features/groups/components/ExpandablePostText.tsx), 64 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ExpandablePostText` | [8](../../src/features/groups/components/ExpandablePostText.tsx#L8) |

### src/features/groups/components/GroupChatComposer.tsx

[Volledige bron](../../src/features/groups/components/GroupChatComposer.tsx), 134 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupChatComposer` | [11](../../src/features/groups/components/GroupChatComposer.tsx#L11) |
| method | `GroupChatComposer.setDraft` | [21](../../src/features/groups/components/GroupChatComposer.tsx#L21) |
| method | `GroupChatComposer.send` | [22](../../src/features/groups/components/GroupChatComposer.tsx#L22) |
| method | `GroupChatComposer.onFocus` | [25](../../src/features/groups/components/GroupChatComposer.tsx#L25) |
| method | `GroupChatComposer.onBlur` | [26](../../src/features/groups/components/GroupChatComposer.tsx#L26) |

### src/features/groups/components/GroupCreateWizard.tsx

[Volledige bron](../../src/features/groups/components/GroupCreateWizard.tsx), 85 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupCreateWizard` | [10](../../src/features/groups/components/GroupCreateWizard.tsx#L10) |
| function | `GroupCreateWizard.create` | [24](../../src/features/groups/components/GroupCreateWizard.tsx#L24) |

### src/features/groups/components/GroupEventsPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupEventsPanel.tsx), 229 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupEventsPanel` | [12](../../src/features/groups/components/GroupEventsPanel.tsx#L12) |
| function | `GroupEventsPanel.create` | [32](../../src/features/groups/components/GroupEventsPanel.tsx#L32) |

### src/features/groups/components/GroupFeedPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupFeedPanel.tsx), 587 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupFeedPanel` | [24](../../src/features/groups/components/GroupFeedPanel.tsx#L24) |
| function-variable | `GroupFeedPanel.dateText` | [42](../../src/features/groups/components/GroupFeedPanel.tsx#L42) |
| function-variable | `GroupFeedPanel.setMessage` | [50](../../src/features/groups/components/GroupFeedPanel.tsx#L50) |
| function-variable | `GroupFeedPanel.copy` | [51](../../src/features/groups/components/GroupFeedPanel.tsx#L51) |

### src/features/groups/components/GroupFormFields.tsx

[Volledige bron](../../src/features/groups/components/GroupFormFields.tsx), 163 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `GroupDraft` | [7](../../src/features/groups/components/GroupFormFields.tsx#L7) |
| function-variable | `blankGroupDraft` | [17](../../src/features/groups/components/GroupFormFields.tsx#L17) |
| function | `GroupFormFields` | [32](../../src/features/groups/components/GroupFormFields.tsx#L32) |
| function-variable | `GroupFormFields.update` | [42](../../src/features/groups/components/GroupFormFields.tsx#L42) |
| function | `validGroupDraft` | [154](../../src/features/groups/components/GroupFormFields.tsx#L154) |

### src/features/groups/components/GroupGovernancePanels.tsx

[Volledige bron](../../src/features/groups/components/GroupGovernancePanels.tsx), 195 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupRulesPanel` | [10](../../src/features/groups/components/GroupGovernancePanels.tsx#L10) |
| function | `GroupReportsPanel` | [60](../../src/features/groups/components/GroupGovernancePanels.tsx#L60) |
| function-variable | `GroupReportsPanel.statusLabel` | [70](../../src/features/groups/components/GroupGovernancePanels.tsx#L70) |
| function | `GroupAuditPanel` | [146](../../src/features/groups/components/GroupGovernancePanels.tsx#L146) |

### src/features/groups/components/GroupImage.tsx

[Volledige bron](../../src/features/groups/components/GroupImage.tsx), 3 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/features/groups/components/GroupImage.web.tsx

[Volledige bron](../../src/features/groups/components/GroupImage.web.tsx), 53 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Props` | [5](../../src/features/groups/components/GroupImage.web.tsx#L5) |
| function | `GroupImage` | [11](../../src/features/groups/components/GroupImage.web.tsx#L11) |

### src/features/groups/components/GroupJoinFlow.tsx

[Volledige bron](../../src/features/groups/components/GroupJoinFlow.tsx), 168 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupJoinFlow` | [14](../../src/features/groups/components/GroupJoinFlow.tsx#L14) |
| function | `GroupJoinFlow.join` | [40](../../src/features/groups/components/GroupJoinFlow.tsx#L40) |
| function | `GroupJoinFlow.request` | [76](../../src/features/groups/components/GroupJoinFlow.tsx#L76) |

### src/features/groups/components/GroupJoinLinkHandler.tsx

[Volledige bron](../../src/features/groups/components/GroupJoinLinkHandler.tsx), 44 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupJoinLinkHandler` | [10](../../src/features/groups/components/GroupJoinLinkHandler.tsx#L10) |
| function | `GroupJoinLinkHandler.restore` | [17](../../src/features/groups/components/GroupJoinLinkHandler.tsx#L17) |

### src/features/groups/components/GroupMediaPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupMediaPanel.tsx), 170 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupMediaPanel` | [19](../../src/features/groups/components/GroupMediaPanel.tsx#L19) |
| function | `GroupMediaPanel.pick` | [31](../../src/features/groups/components/GroupMediaPanel.tsx#L31) |
| function | `GroupMediaPanel.share` | [42](../../src/features/groups/components/GroupMediaPanel.tsx#L42) |

### src/features/groups/components/GroupMemberReadingSheet.tsx

[Volledige bron](../../src/features/groups/components/GroupMemberReadingSheet.tsx), 74 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupMemberReadingSheet` | [10](../../src/features/groups/components/GroupMemberReadingSheet.tsx#L10) |

### src/features/groups/components/GroupMembersPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupMembersPanel.tsx), 348 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `MembersData` | [18](../../src/features/groups/components/GroupMembersPanel.tsx#L18) |
| function | `GroupMembersPanel` | [24](../../src/features/groups/components/GroupMembersPanel.tsx#L24) |
| function-variable | `GroupMembersPanel.memberRank` | [52](../../src/features/groups/components/GroupMembersPanel.tsx#L52) |
| function-variable | `GroupMembersPanel.canManage` | [54](../../src/features/groups/components/GroupMembersPanel.tsx#L54) |

### src/features/groups/components/GroupNoticesPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupNoticesPanel.tsx), 128 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupNoticesPanel` | [10](../../src/features/groups/components/GroupNoticesPanel.tsx#L10) |

### src/features/groups/components/GroupOverviewPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupOverviewPanel.tsx), 80 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupOverviewPanel` | [14](../../src/features/groups/components/GroupOverviewPanel.tsx#L14) |

### src/features/groups/components/GroupProfilePanel.tsx

[Volledige bron](../../src/features/groups/components/GroupProfilePanel.tsx), 130 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupProfilePanel` | [10](../../src/features/groups/components/GroupProfilePanel.tsx#L10) |

### src/features/groups/components/GroupProgressPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupProgressPanel.tsx), 186 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupProgressPanel` | [15](../../src/features/groups/components/GroupProgressPanel.tsx#L15) |
| function-variable | `GroupProgressPanel.points` | [31](../../src/features/groups/components/GroupProgressPanel.tsx#L31) |
| function | `GroupProgressPanel.save` | [48](../../src/features/groups/components/GroupProgressPanel.tsx#L48) |

### src/features/groups/components/GroupProgressSummary.tsx

[Volledige bron](../../src/features/groups/components/GroupProgressSummary.tsx), 107 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Metrics` | [14](../../src/features/groups/components/GroupProgressSummary.tsx#L14) |
| function | `GroupReadingTotals` | [38](../../src/features/groups/components/GroupProgressSummary.tsx#L38) |
| function | `GroupProgressSummary` | [56](../../src/features/groups/components/GroupProgressSummary.tsx#L56) |

### src/features/groups/components/GroupSettingsPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupSettingsPanel.tsx), 94 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupSettingsPanel` | [10](../../src/features/groups/components/GroupSettingsPanel.tsx#L10) |

### src/features/groups/components/GroupTasksPanel.tsx

[Volledige bron](../../src/features/groups/components/GroupTasksPanel.tsx), 297 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupTasksPanel` | [18](../../src/features/groups/components/GroupTasksPanel.tsx#L18) |
| function | `GroupTasksPanel.makeTask` | [39](../../src/features/groups/components/GroupTasksPanel.tsx#L39) |

### src/features/groups/components/GroupTypingStatus.tsx

[Volledige bron](../../src/features/groups/components/GroupTypingStatus.tsx), 37 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupTypingStatus` | [8](../../src/features/groups/components/GroupTypingStatus.tsx#L8) |

### src/features/groups/components/groupImageSource.ts

[Volledige bron](../../src/features/groups/components/groupImageSource.ts), 13 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `isCorsGroupStorageImage` | [2](../../src/features/groups/components/groupImageSource.ts#L2) |

### src/features/groups/components/groupUi.tsx

[Volledige bron](../../src/features/groups/components/groupUi.tsx), 139 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `permitted` | [11](../../src/features/groups/components/groupUi.tsx#L11) |
| function | `groupError` | [15](../../src/features/groups/components/groupUi.tsx#L15) |
| function | `useGroupResource` | [18](../../src/features/groups/components/groupUi.tsx#L18) |
| function | `useGroupResource.reload` | [32](../../src/features/groups/components/groupUi.tsx#L32) |
| function | `useGroupResource.run` | [46](../../src/features/groups/components/groupUi.tsx#L46) |
| function | `ResourceState` | [72](../../src/features/groups/components/groupUi.tsx#L72) |
| function | `ConfirmAction` | [89](../../src/features/groups/components/groupUi.tsx#L89) |
| function | `chooseGroupImage` | [118](../../src/features/groups/components/groupUi.tsx#L118) |

### src/features/groups/components/useGroupFeed.ts

[Volledige bron](../../src/features/groups/components/useGroupFeed.ts), 77 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `useGroupFeed` | [9](../../src/features/groups/components/useGroupFeed.ts#L9) |
| function-variable | `useGroupFeed.run` | [45](../../src/features/groups/components/useGroupFeed.ts#L45) |

### src/features/groups/groupProgressCopy.ts

[Volledige bron](../../src/features/groups/groupProgressCopy.ts), 80 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `groupProgressText` | [43](../../src/features/groups/groupProgressCopy.ts#L43) |
| function | `groupReadingLabel` | [47](../../src/features/groups/groupProgressCopy.ts#L47) |
| function | `groupLanguageLabel` | [68](../../src/features/groups/groupProgressCopy.ts#L68) |

### src/features/groups/groupTypingCopy.ts

[Volledige bron](../../src/features/groups/groupTypingCopy.ts), 43 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `groupTypingText` | [28](../../src/features/groups/groupTypingCopy.ts#L28) |

### src/features/groups/hooks/useGroupChat.ts

[Volledige bron](../../src/features/groups/hooks/useGroupChat.ts), 104 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `useChatSession` | [12](../../src/features/groups/hooks/useGroupChat.ts#L12) |
| function | `useGroupChat` | [44](../../src/features/groups/hooks/useGroupChat.ts#L44) |
| function-variable | `useGroupChat.send` | [62](../../src/features/groups/hooks/useGroupChat.ts#L62) |

### src/features/groups/hooks/useGroupTyping.ts

[Volledige bron](../../src/features/groups/hooks/useGroupTyping.ts), 59 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `useGroupTyping` | [7](../../src/features/groups/hooks/useGroupTyping.ts#L7) |
| function-variable | `useGroupTyping.start` | [26](../../src/features/groups/hooks/useGroupTyping.ts#L26) |

### src/features/groups/screens/GroupChatScreen.tsx

[Volledige bron](../../src/features/groups/screens/GroupChatScreen.tsx), 365 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupChatScreen` | [22](../../src/features/groups/screens/GroupChatScreen.tsx#L22) |
| function | `ChatGroup` | [64](../../src/features/groups/screens/GroupChatScreen.tsx#L64) |
| function | `Conversation` | [110](../../src/features/groups/screens/GroupChatScreen.tsx#L110) |
| method | `Conversation.refreshGroup` | [119](../../src/features/groups/screens/GroupChatScreen.tsx#L119) |
| function-variable | `Conversation.showLatest` | [153](../../src/features/groups/screens/GroupChatScreen.tsx#L153) |

### src/features/groups/screens/GroupScreen.tsx

[Volledige bron](../../src/features/groups/screens/GroupScreen.tsx), 564 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Tab` | [53](../../src/features/groups/screens/GroupScreen.tsx#L53) |
| type | `Params` | [67](../../src/features/groups/screens/GroupScreen.tsx#L67) |
| function | `GroupScreen` | [69](../../src/features/groups/screens/GroupScreen.tsx#L69) |
| function | `GroupLogo` | [164](../../src/features/groups/screens/GroupScreen.tsx#L164) |
| function | `GroupContent` | [188](../../src/features/groups/screens/GroupScreen.tsx#L188) |
| function-variable | `GroupContent.copy` | [199](../../src/features/groups/screens/GroupScreen.tsx#L199) |
| function-variable | `GroupContent.closeInvite` | [218](../../src/features/groups/screens/GroupScreen.tsx#L218) |
| function-variable | `GroupContent.reload` | [240](../../src/features/groups/screens/GroupScreen.tsx#L240) |
| function-variable | `GroupContent.clearFocus` | [244](../../src/features/groups/screens/GroupScreen.tsx#L244) |
| function-variable | `GroupContent.openPost` | [247](../../src/features/groups/screens/GroupScreen.tsx#L247) |

### src/features/groups/screens/GroupsScreen.tsx

[Volledige bron](../../src/features/groups/screens/GroupsScreen.tsx), 264 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GroupsScreen` | [29](../../src/features/groups/screens/GroupsScreen.tsx#L29) |
| function | `GroupCard` | [114](../../src/features/groups/screens/GroupsScreen.tsx#L114) |
| function | `GroupsContent` | [166](../../src/features/groups/screens/GroupsScreen.tsx#L166) |

### src/features/home/components/HizbOverviewCard.tsx

[Volledige bron](../../src/features/home/components/HizbOverviewCard.tsx), 189 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `HizbOverviewCard` | [18](../../src/features/home/components/HizbOverviewCard.tsx#L18) |
| function-variable | `HizbOverviewCard.date` | [40](../../src/features/home/components/HizbOverviewCard.tsx#L40) |

### src/features/home/components/PracticeOverview.tsx

[Volledige bron](../../src/features/home/components/PracticeOverview.tsx), 375 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `PracticeOverview` | [36](../../src/features/home/components/PracticeOverview.tsx#L36) |
| function-variable | `PracticeOverview.name` | [65](../../src/features/home/components/PracticeOverview.tsx#L65) |
| function | `PracticeOverview.saveRange` | [77](../../src/features/home/components/PracticeOverview.tsx#L77) |

### src/features/home/components/ResumeReadingCard.tsx

[Volledige bron](../../src/features/home/components/ResumeReadingCard.tsx), 69 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ResumeReadingCard` | [12](../../src/features/home/components/ResumeReadingCard.tsx#L12) |

### src/features/home/components/TodayPlanning.tsx

[Volledige bron](../../src/features/home/components/TodayPlanning.tsx), 61 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `TodayPlanning` | [10](../../src/features/home/components/TodayPlanning.tsx#L10) |

### src/features/home/components/TodayReadingCard.tsx

[Volledige bron](../../src/features/home/components/TodayReadingCard.tsx), 80 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `TodayReadingCard` | [14](../../src/features/home/components/TodayReadingCard.tsx#L14) |

### src/features/home/model/resumeReference.ts

[Volledige bron](../../src/features/home/model/resumeReference.ts), 19 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `resumeReference` | [5](../../src/features/home/model/resumeReference.ts#L5) |
| function-variable | `resumeReference.key` | [16](../../src/features/home/model/resumeReference.ts#L16) |

### src/features/home/screens/MainScreen.tsx

[Volledige bron](../../src/features/home/screens/MainScreen.tsx), 163 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `MainScreen` | [32](../../src/features/home/screens/MainScreen.tsx#L32) |

### src/features/lexicon/components/LexiconDetail.tsx

[Volledige bron](../../src/features/lexicon/components/LexiconDetail.tsx), 433 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LexiconOccurrenceView` | [10](../../src/features/lexicon/components/LexiconDetail.tsx#L10) |
| type | `LexiconDetailView` | [11](../../src/features/lexicon/components/LexiconDetail.tsx#L11) |
| type | `LexiconState` | [12](../../src/features/lexicon/components/LexiconDetail.tsx#L12) |
| function | `LexiconDetail` | [121](../../src/features/lexicon/components/LexiconDetail.tsx#L121) |
| function-variable | `LexiconDetail.openSource` | [140](../../src/features/lexicon/components/LexiconDetail.tsx#L140) |

### src/features/lexicon/components/LexiconSearch.tsx

[Volledige bron](../../src/features/lexicon/components/LexiconSearch.tsx), 122 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LexiconSearchResult` | [7](../../src/features/lexicon/components/LexiconSearch.tsx#L7) |
| function | `LexiconSearch` | [47](../../src/features/lexicon/components/LexiconSearch.tsx#L47) |

### src/features/lexicon/model/lexiconNavigation.ts

[Volledige bron](../../src/features/lexicon/model/lexiconNavigation.ts), 23 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LexiconTarget` | [3](../../src/features/lexicon/model/lexiconNavigation.ts#L3) |
| function | `lexiconTargetKey` | [7](../../src/features/lexicon/model/lexiconNavigation.ts#L7) |
| function | `lexiconReaderTarget` | [20](../../src/features/lexicon/model/lexiconNavigation.ts#L20) |

### src/features/lexicon/screens/LexiconScreen.tsx

[Volledige bron](../../src/features/lexicon/screens/LexiconScreen.tsx), 51 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `LexiconScreen` | [13](../../src/features/lexicon/screens/LexiconScreen.tsx#L13) |
| function-variable | `LexiconScreen.load` | [22](../../src/features/lexicon/screens/LexiconScreen.tsx#L22) |

### src/features/lexicon/screens/LexiconSearchScreen.tsx

[Volledige bron](../../src/features/lexicon/screens/LexiconSearchScreen.tsx), 59 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `LexiconSearchScreen` | [6](../../src/features/lexicon/screens/LexiconSearchScreen.tsx#L6) |
| function-variable | `LexiconSearchScreen.clear` | [19](../../src/features/lexicon/screens/LexiconSearchScreen.tsx#L19) |
| function-variable | `LexiconSearchScreen.search` | [24](../../src/features/lexicon/screens/LexiconSearchScreen.tsx#L24) |

### src/features/notes/components/FilterPill.tsx

[Volledige bron](../../src/features/notes/components/FilterPill.tsx), 36 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `FilterPill` | [6](../../src/features/notes/components/FilterPill.tsx#L6) |

### src/features/notes/components/FormattedNote.tsx

[Volledige bron](../../src/features/notes/components/FormattedNote.tsx), 114 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `NoteDisplayStyle` | [14](../../src/features/notes/components/FormattedNote.tsx#L14) |
| function | `useNoteColors` | [18](../../src/features/notes/components/FormattedNote.tsx#L18) |
| function | `noteSpanTextStyle` | [32](../../src/features/notes/components/FormattedNote.tsx#L32) |
| function | `FormattedNote` | [54](../../src/features/notes/components/FormattedNote.tsx#L54) |

### src/features/notes/components/NoteCountButton.tsx

[Volledige bron](../../src/features/notes/components/NoteCountButton.tsx), 35 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NoteCountButton` | [11](../../src/features/notes/components/NoteCountButton.tsx#L11) |

### src/features/notes/components/NoteDragHandle.tsx

[Volledige bron](../../src/features/notes/components/NoteDragHandle.tsx), 88 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NoteDragHandle` | [5](../../src/features/notes/components/NoteDragHandle.tsx#L5) |

### src/features/notes/components/NoteEditorView.tsx

[Volledige bron](../../src/features/notes/components/NoteEditorView.tsx), 408 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NoteEditorView` | [35](../../src/features/notes/components/NoteEditorView.tsx#L35) |

### src/features/notes/components/NoteFilterSheet.tsx

[Volledige bron](../../src/features/notes/components/NoteFilterSheet.tsx), 116 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NoteFilterSheet` | [10](../../src/features/notes/components/NoteFilterSheet.tsx#L10) |

### src/features/notes/components/NoteFoldersBar.tsx

[Volledige bron](../../src/features/notes/components/NoteFoldersBar.tsx), 130 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NoteFoldersBar` | [9](../../src/features/notes/components/NoteFoldersBar.tsx#L9) |
| function-variable | `NoteFoldersBar.measureTarget` | [34](../../src/features/notes/components/NoteFoldersBar.tsx#L34) |
| function-variable | `NoteFoldersBar.measure` | [38](../../src/features/notes/components/NoteFoldersBar.tsx#L38) |
| function-variable | `NoteFoldersBar.measureViewport` | [39](../../src/features/notes/components/NoteFoldersBar.tsx#L39) |

### src/features/notes/components/NoteRow.tsx

[Volledige bron](../../src/features/notes/components/NoteRow.tsx), 91 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NoteRow` | [10](../../src/features/notes/components/NoteRow.tsx#L10) |

### src/features/notes/components/NoteTargetControl.tsx

[Volledige bron](../../src/features/notes/components/NoteTargetControl.tsx), 149 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NoteTargetControl` | [16](../../src/features/notes/components/NoteTargetControl.tsx#L16) |
| function-variable | `NoteTargetControl.title` | [27](../../src/features/notes/components/NoteTargetControl.tsx#L27) |

### src/features/notes/components/NoteTargetSummary.tsx

[Volledige bron](../../src/features/notes/components/NoteTargetSummary.tsx), 50 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `NoteTargetSummary` | [12](../../src/features/notes/components/NoteTargetSummary.tsx#L12) |

### src/features/notes/components/RichNoteInput.native.tsx

[Volledige bron](../../src/features/notes/components/RichNoteInput.native.tsx), 77 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `RichNoteInput` | [18](../../src/features/notes/components/RichNoteInput.native.tsx#L18) |

### src/features/notes/components/RichNoteInput.tsx

[Volledige bron](../../src/features/notes/components/RichNoteInput.tsx), 9 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `RichNoteInput` | [6](../../src/features/notes/components/RichNoteInput.tsx#L6) |

### src/features/notes/components/RichNoteInput.types.ts

[Volledige bron](../../src/features/notes/components/RichNoteInput.types.ts), 7 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `RichNoteInputProps` | [3](../../src/features/notes/components/RichNoteInput.types.ts#L3) |

### src/features/notes/editor/attributedEditorSync.ts

[Volledige bron](../../src/features/notes/editor/attributedEditorSync.ts), 62 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AttributedEditorModel` | [1](../../src/features/notes/editor/attributedEditorSync.ts#L1) |
| type | `AttributedEditorSync` | [2](../../src/features/notes/editor/attributedEditorSync.ts#L2) |
| function | `createAttributedEditorSync` | [10](../../src/features/notes/editor/attributedEditorSync.ts#L10) |
| function | `recordNativeEditorText` | [20](../../src/features/notes/editor/attributedEditorSync.ts#L20) |
| function | `reconcileAttributedEditor` | [32](../../src/features/notes/editor/attributedEditorSync.ts#L32) |

### src/features/notes/editor/noteEditor.ts

[Volledige bron](../../src/features/notes/editor/noteEditor.ts), 209 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `EditorFields` | [18](../../src/features/notes/editor/noteEditor.ts#L18) |
| function-variable | `blankFields` | [36](../../src/features/notes/editor/noteEditor.ts#L36) |
| function | `targetForNote` | [54](../../src/features/notes/editor/noteEditor.ts#L54) |
| function | `fieldsForNote` | [73](../../src/features/notes/editor/noteEditor.ts#L73) |
| function | `targetTitle` | [93](../../src/features/notes/editor/noteEditor.ts#L93) |
| function | `toggleTag` | [110](../../src/features/notes/editor/noteEditor.ts#L110) |
| function | `noteTargetFields` | [118](../../src/features/notes/editor/noteEditor.ts#L118) |
| function | `sameTarget` | [129](../../src/features/notes/editor/noteEditor.ts#L129) |
| function | `saveFormatInfo` | [133](../../src/features/notes/editor/noteEditor.ts#L133) |
| function | `updateEditorText` | [147](../../src/features/notes/editor/noteEditor.ts#L147) |
| type | `NoteSaveResult` | [173](../../src/features/notes/editor/noteEditor.ts#L173) |
| function | `prepareNoteSave` | [178](../../src/features/notes/editor/noteEditor.ts#L178) |

### src/features/notes/editor/noteFilters.ts

[Volledige bron](../../src/features/notes/editor/noteFilters.ts), 104 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ScopeFilter` | [9](../../src/features/notes/editor/noteFilters.ts#L9) |
| type | `NoteFilters` | [10](../../src/features/notes/editor/noteFilters.ts#L10) |
| function | `filterNotes` | [23](../../src/features/notes/editor/noteFilters.ts#L23) |
| function | `canCreateInContext` | [86](../../src/features/notes/editor/noteFilters.ts#L86) |

### src/features/notes/editor/noteFormat.ts

[Volledige bron](../../src/features/notes/editor/noteFormat.ts), 183 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `NoteFormatSpan` | [1](../../src/features/notes/editor/noteFormat.ts#L1) |
| interface | `ActiveNoteFormat` | [13](../../src/features/notes/editor/noteFormat.ts#L13) |
| function | `decodeNoteFormatSpans` | [17](../../src/features/notes/editor/noteFormat.ts#L17) |
| function-variable | `decodeNoteFormatSpans.integer` | [22](../../src/features/notes/editor/noteFormat.ts#L22) |
| function | `encodeNoteFormatSpans` | [48](../../src/features/notes/editor/noteFormat.ts#L48) |
| function | `sameStyle` | [66](../../src/features/notes/editor/noteFormat.ts#L66) |
| function | `updateNoteFormatSpansForTextChange` | [78](../../src/features/notes/editor/noteFormat.ts#L78) |
| function | `noteFormatSegments` | [138](../../src/features/notes/editor/noteFormat.ts#L138) |
| function | `noteDisplayFontSize` | [158](../../src/features/notes/editor/noteFormat.ts#L158) |
| function | `isTodoChecked` | [166](../../src/features/notes/editor/noteFormat.ts#L166) |
| function | `cleanTodoLine` | [169](../../src/features/notes/editor/noteFormat.ts#L169) |
| function | `noteDisplayTitle` | [172](../../src/features/notes/editor/noteFormat.ts#L172) |
| function | `noteExcerpt` | [179](../../src/features/notes/editor/noteFormat.ts#L179) |

### src/features/notes/hooks/useNoteEditor.ts

[Volledige bron](../../src/features/notes/hooks/useNoteEditor.ts), 244 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Options` | [22](../../src/features/notes/hooks/useNoteEditor.ts#L22) |
| function | `useNoteEditor` | [32](../../src/features/notes/hooks/useNoteEditor.ts#L32) |
| function | `useNoteEditor.startNew` | [74](../../src/features/notes/hooks/useNoteEditor.ts#L74) |
| function | `useNoteEditor.startEdit` | [87](../../src/features/notes/hooks/useNoteEditor.ts#L87) |
| function | `useNoteEditor.closeEditor` | [100](../../src/features/notes/hooks/useNoteEditor.ts#L100) |
| function | `useNoteEditor.clearEditor` | [111](../../src/features/notes/hooks/useNoteEditor.ts#L111) |
| function | `useNoteEditor.saveNote` | [121](../../src/features/notes/hooks/useNoteEditor.ts#L121) |
| function | `useNoteEditor.deleteNote` | [155](../../src/features/notes/hooks/useNoteEditor.ts#L155) |
| function | `useNoteEditor.pinNote` | [180](../../src/features/notes/hooks/useNoteEditor.ts#L180) |
| function | `useNoteEditor.exportNotes` | [194](../../src/features/notes/hooks/useNoteEditor.ts#L194) |
| type | `NoteEditor` | [243](../../src/features/notes/hooks/useNoteEditor.ts#L243) |

### src/features/notes/hooks/useNoteFilters.ts

[Volledige bron](../../src/features/notes/hooks/useNoteFilters.ts), 103 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `useNoteFilters` | [10](../../src/features/notes/hooks/useNoteFilters.ts#L10) |
| function | `useNoteFilters.reset` | [65](../../src/features/notes/hooks/useNoteFilters.ts#L65) |
| type | `NoteFilterState` | [102](../../src/features/notes/hooks/useNoteFilters.ts#L102) |

### src/features/notes/libraryCopy.ts

[Volledige bron](../../src/features/notes/libraryCopy.ts), 66 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/features/notes/screens/NotesScreen.tsx

[Volledige bron](../../src/features/notes/screens/NotesScreen.tsx), 461 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Props` | [46](../../src/features/notes/screens/NotesScreen.tsx#L46) |
| function | `NotesScreen` | [48](../../src/features/notes/screens/NotesScreen.tsx#L48) |
| method | `NotesScreen.onSaved` | [104](../../src/features/notes/screens/NotesScreen.tsx#L104) |
| function | `NotesScreen.runLibrary` | [130](../../src/features/notes/screens/NotesScreen.tsx#L130) |
| function | `NotesScreen.importNotes` | [145](../../src/features/notes/screens/NotesScreen.tsx#L145) |
| function | `NotesScreen.moveNote` | [170](../../src/features/notes/screens/NotesScreen.tsx#L170) |
| function-variable | `NotesScreen.clearDrag` | [177](../../src/features/notes/screens/NotesScreen.tsx#L177) |
| function-variable | `NotesScreen.folderHit` | [181](../../src/features/notes/screens/NotesScreen.tsx#L181) |
| function | `NotesScreen.startNew` | [185](../../src/features/notes/screens/NotesScreen.tsx#L185) |

### src/features/onboarding/components/OnboardingFlow.tsx

[Volledige bron](../../src/features/onboarding/components/OnboardingFlow.tsx), 697 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Unit` | [35](../../src/features/onboarding/components/OnboardingFlow.tsx#L35) |
| function | `ReadingDemo` | [37](../../src/features/onboarding/components/OnboardingFlow.tsx#L37) |
| function | `HifzDemo` | [79](../../src/features/onboarding/components/OnboardingFlow.tsx#L79) |
| function-variable | `HifzDemo.open` | [87](../../src/features/onboarding/components/OnboardingFlow.tsx#L87) |
| function | `FocusDemo` | [172](../../src/features/onboarding/components/OnboardingFlow.tsx#L172) |
| type | `DemoPlan` | [238](../../src/features/onboarding/components/OnboardingFlow.tsx#L238) |
| function | `PlanningDemo` | [239](../../src/features/onboarding/components/OnboardingFlow.tsx#L239) |
| function-variable | `PlanningDemo.dateLabel` | [259](../../src/features/onboarding/components/OnboardingFlow.tsx#L259) |
| function-variable | `PlanningDemo.time` | [265](../../src/features/onboarding/components/OnboardingFlow.tsx#L265) |
| function-variable | `PlanningDemo.change` | [267](../../src/features/onboarding/components/OnboardingFlow.tsx#L267) |
| function | `StatisticsDemo` | [437](../../src/features/onboarding/components/OnboardingFlow.tsx#L437) |
| function | `GroupsDemo` | [491](../../src/features/onboarding/components/OnboardingFlow.tsx#L491) |
| function | `OnboardingFlow` | [561](../../src/features/onboarding/components/OnboardingFlow.tsx#L561) |
| function-variable | `OnboardingFlow.move` | [570](../../src/features/onboarding/components/OnboardingFlow.tsx#L570) |
| function-variable | `OnboardingFlow.finish` | [576](../../src/features/onboarding/components/OnboardingFlow.tsx#L576) |
| function-variable | `OnboardingFlow.back` | [584](../../src/features/onboarding/components/OnboardingFlow.tsx#L584) |

### src/features/onboarding/screens/OnboardingScreen.tsx

[Volledige bron](../../src/features/onboarding/screens/OnboardingScreen.tsx), 7 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `OnboardingScreen` | [4](../../src/features/onboarding/screens/OnboardingScreen.tsx#L4) |

### src/features/planning/components/AgendaCalendar.tsx

[Volledige bron](../../src/features/planning/components/AgendaCalendar.tsx), 153 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `AgendaCalendar` | [17](../../src/features/planning/components/AgendaCalendar.tsx#L17) |

### src/features/planning/components/PlanningReminderCoordinator.tsx

[Volledige bron](../../src/features/planning/components/PlanningReminderCoordinator.tsx), 58 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `PlanningReminderCoordinator` | [18](../../src/features/planning/components/PlanningReminderCoordinator.tsx#L18) |
| function-variable | `PlanningReminderCoordinator.reconcile` | [26](../../src/features/planning/components/PlanningReminderCoordinator.tsx#L26) |
| function | `LocalReminderFailureNotice` | [47](../../src/features/planning/components/PlanningReminderCoordinator.tsx#L47) |

### src/features/planning/components/ReadingJourneyPanel.tsx

[Volledige bron](../../src/features/planning/components/ReadingJourneyPanel.tsx), 202 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ReadingJourneyPanel` | [29](../../src/features/planning/components/ReadingJourneyPanel.tsx#L29) |
| function-variable | `ReadingJourneyPanel.date` | [53](../../src/features/planning/components/ReadingJourneyPanel.tsx#L53) |
| function | `ReadingJourneyPanel.open` | [55](../../src/features/planning/components/ReadingJourneyPanel.tsx#L55) |
| function | `ReadingJourneyPanel.save` | [62](../../src/features/planning/components/ReadingJourneyPanel.tsx#L62) |

### src/features/planning/components/ReadingPlanHomeCard.tsx

[Volledige bron](../../src/features/planning/components/ReadingPlanHomeCard.tsx), 60 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `key` | [11](../../src/features/planning/components/ReadingPlanHomeCard.tsx#L11) |
| function | `ReadingPlanHomeCard` | [12](../../src/features/planning/components/ReadingPlanHomeCard.tsx#L12) |
| function-variable | `ReadingPlanHomeCard.quantity` | [18](../../src/features/planning/components/ReadingPlanHomeCard.tsx#L18) |

### src/features/planning/hooks/useReadingPlan.ts

[Volledige bron](../../src/features/planning/hooks/useReadingPlan.ts), 27 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `useReadingPlan` | [8](../../src/features/planning/hooks/useReadingPlan.ts#L8) |

### src/features/planning/screens/PlanningScreen.tsx

[Volledige bron](../../src/features/planning/screens/PlanningScreen.tsx), 680 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `PlanningScreen` | [44](../../src/features/planning/screens/PlanningScreen.tsx#L44) |
| function | `PlanningScreen.planningError` | [96](../../src/features/planning/screens/PlanningScreen.tsx#L96) |
| function | `PlanningScreen.savePlan` | [118](../../src/features/planning/screens/PlanningScreen.tsx#L118) |
| function | `PlanningScreen.saveJourney` | [169](../../src/features/planning/screens/PlanningScreen.tsx#L169) |
| function | `PlanningScreen.openPlan` | [192](../../src/features/planning/screens/PlanningScreen.tsx#L192) |
| function | `PlanningScreen.openReminder` | [210](../../src/features/planning/screens/PlanningScreen.tsx#L210) |
| function | `PlanningScreen.saveReminder` | [217](../../src/features/planning/screens/PlanningScreen.tsx#L217) |

### src/features/planning/screens/ReadingPlanScreen.tsx

[Volledige bron](../../src/features/planning/screens/ReadingPlanScreen.tsx), 221 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `key` | [34](../../src/features/planning/screens/ReadingPlanScreen.tsx#L34) |
| function | `ReadingPlanScreen` | [42](../../src/features/planning/screens/ReadingPlanScreen.tsx#L42) |
| function-variable | `ReadingPlanScreen.quantity` | [63](../../src/features/planning/screens/ReadingPlanScreen.tsx#L63) |
| function | `ReadingPlanScreen.persist` | [72](../../src/features/planning/screens/ReadingPlanScreen.tsx#L72) |

### src/features/practice/components/ArabicWatermark.tsx

[Volledige bron](../../src/features/practice/components/ArabicWatermark.tsx), 46 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ArabicWatermark` | [6](../../src/features/practice/components/ArabicWatermark.tsx#L6) |

### src/features/practice/components/HifzScoreSlider.tsx

[Volledige bron](../../src/features/practice/components/HifzScoreSlider.tsx), 100 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `HifzScoreSlider` | [9](../../src/features/practice/components/HifzScoreSlider.tsx#L9) |

### src/features/practice/components/QuickCheckInSheet.tsx

[Volledige bron](../../src/features/practice/components/QuickCheckInSheet.tsx), 262 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `QuickCheckInSheet` | [20](../../src/features/practice/components/QuickCheckInSheet.tsx#L20) |
| function | `QuickCheckInSheet.save` | [74](../../src/features/practice/components/QuickCheckInSheet.tsx#L74) |

### src/features/practice/components/ReadingDistributionRing.tsx

[Volledige bron](../../src/features/practice/components/ReadingDistributionRing.tsx), 92 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ReadingDistributionRing` | [10](../../src/features/practice/components/ReadingDistributionRing.tsx#L10) |

### src/features/practice/components/ReadingStatisticsOverview.tsx

[Volledige bron](../../src/features/practice/components/ReadingStatisticsOverview.tsx), 777 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `StatisticsSection` | [49](../../src/features/practice/components/ReadingStatisticsOverview.tsx#L49) |
| function | `ReadingStatisticsOverview` | [74](../../src/features/practice/components/ReadingStatisticsOverview.tsx#L74) |
| function-variable | `ReadingStatisticsOverview.unitLabel` | [110](../../src/features/practice/components/ReadingStatisticsOverview.tsx#L110) |
| function-variable | `ReadingStatisticsOverview.label` | [123](../../src/features/practice/components/ReadingStatisticsOverview.tsx#L123) |
| function | `ReadingStatisticsOverview.referenceLabel` | [161](../../src/features/practice/components/ReadingStatisticsOverview.tsx#L161) |
| function-variable | `ReadingStatisticsOverview.referenceLabel.number` | [163](../../src/features/practice/components/ReadingStatisticsOverview.tsx#L163) |
| function | `ReadingStatisticsOverview.historyRow` | [166](../../src/features/practice/components/ReadingStatisticsOverview.tsx#L166) |
| function | `ReadingStatisticsOverview.clearReading` | [225](../../src/features/practice/components/ReadingStatisticsOverview.tsx#L225) |

### src/features/practice/components/ReadingStatisticsSummary.tsx

[Volledige bron](../../src/features/practice/components/ReadingStatisticsSummary.tsx), 157 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ReadingStatisticsSummary` | [35](../../src/features/practice/components/ReadingStatisticsSummary.tsx#L35) |

### src/features/practice/components/StatisticsHistory.tsx

[Volledige bron](../../src/features/practice/components/StatisticsHistory.tsx), 162 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `StatisticsHistory` | [11](../../src/features/practice/components/StatisticsHistory.tsx#L11) |

### src/features/practice/components/StatisticsSurface.tsx

[Volledige bron](../../src/features/practice/components/StatisticsSurface.tsx), 48 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `StatisticsSurface` | [12](../../src/features/practice/components/StatisticsSurface.tsx#L12) |

### src/features/practice/hooks/usePracticeListAnchor.ts

[Volledige bron](../../src/features/practice/hooks/usePracticeListAnchor.ts), 51 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `usePracticeListAnchor` | [5](../../src/features/practice/hooks/usePracticeListAnchor.ts#L5) |

### src/features/practice/hooks/usePracticeSave.ts

[Volledige bron](../../src/features/practice/hooks/usePracticeSave.ts), 48 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `usePracticeSave` | [5](../../src/features/practice/hooks/usePracticeSave.ts#L5) |
| function | `usePracticeSave.save` | [22](../../src/features/practice/hooks/usePracticeSave.ts#L22) |

### src/features/practice/providers/FocusProvider.tsx

[Volledige bron](../../src/features/practice/providers/FocusProvider.tsx), 162 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `FocusContext` | [28](../../src/features/practice/providers/FocusProvider.tsx#L28) |
| function | `FocusProvider` | [36](../../src/features/practice/providers/FocusProvider.tsx#L36) |
| function-variable | `FocusProvider.sample` | [93](../../src/features/practice/providers/FocusProvider.tsx#L93) |
| function | `useFocus` | [117](../../src/features/practice/providers/FocusProvider.tsx#L117) |
| function | `FocusFloatingTimer` | [122](../../src/features/practice/providers/FocusProvider.tsx#L122) |

### src/features/practice/screens/ChecklistScreen.tsx

[Volledige bron](../../src/features/practice/screens/ChecklistScreen.tsx), 329 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ChecklistScreen` | [41](../../src/features/practice/screens/ChecklistScreen.tsx#L41) |
| function | `ChecklistScreen.save` | [94](../../src/features/practice/screens/ChecklistScreen.tsx#L94) |
| function-variable | `ChecklistScreen.number` | [117](../../src/features/practice/screens/ChecklistScreen.tsx#L117) |
| function-variable | `ChecklistScreen.point` | [118](../../src/features/practice/screens/ChecklistScreen.tsx#L118) |
| function-variable | `ChecklistScreen.name` | [120](../../src/features/practice/screens/ChecklistScreen.tsx#L120) |
| function | `ChecklistScreen.partRow` | [126](../../src/features/practice/screens/ChecklistScreen.tsx#L126) |

### src/features/practice/screens/FocusScreen.tsx

[Volledige bron](../../src/features/practice/screens/FocusScreen.tsx), 197 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Awake` | [24](../../src/features/practice/screens/FocusScreen.tsx#L24) |
| function | `FocusScreen` | [29](../../src/features/practice/screens/FocusScreen.tsx#L29) |
| function-variable | `FocusScreen.chooseDuration` | [40](../../src/features/practice/screens/FocusScreen.tsx#L40) |

### src/features/practice/screens/GoalsScreen.tsx

[Volledige bron](../../src/features/practice/screens/GoalsScreen.tsx), 506 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `GoalsScreen` | [47](../../src/features/practice/screens/GoalsScreen.tsx#L47) |
| function | `GoalsScreen.save` | [82](../../src/features/practice/screens/GoalsScreen.tsx#L82) |
| function-variable | `GoalsScreen.save.persist` | [96](../../src/features/practice/screens/GoalsScreen.tsx#L96) |
| function | `GoalsScreen.record` | [122](../../src/features/practice/screens/GoalsScreen.tsx#L122) |
| function | `GoalsScreen.resolve` | [209](../../src/features/practice/screens/GoalsScreen.tsx#L209) |
| function | `GoalsScreen.openRecord` | [230](../../src/features/practice/screens/GoalsScreen.tsx#L230) |

### src/features/practice/screens/ProgressScreen.tsx

[Volledige bron](../../src/features/practice/screens/ProgressScreen.tsx), 445 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ProgressScreen` | [34](../../src/features/practice/screens/ProgressScreen.tsx#L34) |
| function-variable | `ProgressScreen.reference` | [57](../../src/features/practice/screens/ProgressScreen.tsx#L57) |
| function-variable | `ProgressScreen.label` | [61](../../src/features/practice/screens/ProgressScreen.tsx#L61) |
| function | `ProgressScreen.open` | [69](../../src/features/practice/screens/ProgressScreen.tsx#L69) |
| function | `ProgressScreen.checkIn` | [82](../../src/features/practice/screens/ProgressScreen.tsx#L82) |
| function | `ProgressScreen.editScore` | [103](../../src/features/practice/screens/ProgressScreen.tsx#L103) |
| function | `ProgressScreen.toggleSelection` | [108](../../src/features/practice/screens/ProgressScreen.tsx#L108) |

### src/features/practice/screens/StatsScreen.tsx

[Volledige bron](../../src/features/practice/screens/StatsScreen.tsx), 7 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `StatsScreen` | [4](../../src/features/practice/screens/StatsScreen.tsx#L4) |

### src/features/quran/components/AyahActionsSheet.tsx

[Volledige bron](../../src/features/quran/components/AyahActionsSheet.tsx), 210 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `SelectedAyah` | [19](../../src/features/quran/components/AyahActionsSheet.tsx#L19) |
| type | `Action` | [20](../../src/features/quran/components/AyahActionsSheet.tsx#L20) |
| function | `AyahActionsSheet` | [21](../../src/features/quran/components/AyahActionsSheet.tsx#L21) |
| function-variable | `AyahActionsSheet.closeAnd` | [63](../../src/features/quran/components/AyahActionsSheet.tsx#L63) |
| function-variable | `AyahActionsSheet.openSource` | [74](../../src/features/quran/components/AyahActionsSheet.tsx#L74) |

### src/features/quran/components/AyahSearchResults.tsx

[Volledige bron](../../src/features/quran/components/AyahSearchResults.tsx), 74 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `AyahSearchResults` | [30](../../src/features/quran/components/AyahSearchResults.tsx#L30) |

### src/features/quran/components/BookTranslationSheet.tsx

[Volledige bron](../../src/features/quran/components/BookTranslationSheet.tsx), 96 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `BookTranslationSheet` | [14](../../src/features/quran/components/BookTranslationSheet.tsx#L14) |

### src/features/quran/components/ContinuousMushafPages.tsx

[Volledige bron](../../src/features/quran/components/ContinuousMushafPages.tsx), 241 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ContinuousMushafPages` | [11](../../src/features/quran/components/ContinuousMushafPages.tsx#L11) |
| function-variable | `ContinuousMushafPages.scrollTo` | [67](../../src/features/quran/components/ContinuousMushafPages.tsx#L67) |
| function-variable | `ContinuousMushafPages.publishVisible` | [97](../../src/features/quran/components/ContinuousMushafPages.tsx#L97) |
| function-variable | `ContinuousMushafPages.restoreLayout` | [111](../../src/features/quran/components/ContinuousMushafPages.tsx#L111) |

### src/features/quran/components/DownloadedPdfMushaf.native.tsx

[Volledige bron](../../src/features/quran/components/DownloadedPdfMushaf.native.tsx), 407 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `DownloadedPdfMushaf` | [33](../../src/features/quran/components/DownloadedPdfMushaf.native.tsx#L33) |
| function-variable | `DownloadedPdfMushaf.changeFullscreen` | [114](../../src/features/quran/components/DownloadedPdfMushaf.native.tsx#L114) |
| function | `DownloadedPdfMushaf.listen` | [131](../../src/features/quran/components/DownloadedPdfMushaf.native.tsx#L131) |

### src/features/quran/components/DownloadedPdfMushaf.tsx

[Volledige bron](../../src/features/quran/components/DownloadedPdfMushaf.tsx), 2 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/features/quran/components/DownloadedPdfMushaf.web.tsx

[Volledige bron](../../src/features/quran/components/DownloadedPdfMushaf.web.tsx), 44 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `DownloadedPdfMushaf` | [7](../../src/features/quran/components/DownloadedPdfMushaf.web.tsx#L7) |

### src/features/quran/components/FloatingReaderAudio.tsx

[Volledige bron](../../src/features/quran/components/FloatingReaderAudio.tsx), 33 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `FloatingReaderAudio` | [8](../../src/features/quran/components/FloatingReaderAudio.tsx#L8) |

### src/features/quran/components/FloatingReaderButton.tsx

[Volledige bron](../../src/features/quran/components/FloatingReaderButton.tsx), 133 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `FloatingReaderButton` | [13](../../src/features/quran/components/FloatingReaderButton.tsx#L13) |

### src/features/quran/components/FullscreenExitButton.tsx

[Volledige bron](../../src/features/quran/components/FullscreenExitButton.tsx), 7 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `FullscreenExitButton` | [4](../../src/features/quran/components/FullscreenExitButton.tsx#L4) |

### src/features/quran/components/HizbOpeningPreview.tsx

[Volledige bron](../../src/features/quran/components/HizbOpeningPreview.tsx), 87 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `HizbTitle` | [15](../../src/features/quran/components/HizbOpeningPreview.tsx#L15) |
| function | `HizbOpeningPreview` | [26](../../src/features/quran/components/HizbOpeningPreview.tsx#L26) |

### src/features/quran/components/MushafDownloadProgress.tsx

[Volledige bron](../../src/features/quran/components/MushafDownloadProgress.tsx), 93 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `MushafDownloadProgress` | [31](../../src/features/quran/components/MushafDownloadProgress.tsx#L31) |

### src/features/quran/components/MushafFooter.tsx

[Volledige bron](../../src/features/quran/components/MushafFooter.tsx), 404 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `MushafTickMetrics` | [22](../../src/features/quran/components/MushafFooter.tsx#L22) |
| function | `MushafPageRail` | [25](../../src/features/quran/components/MushafFooter.tsx#L25) |
| function-variable | `MushafPageRail.cancelDrag` | [55](../../src/features/quran/components/MushafFooter.tsx#L55) |
| function-variable | `MushafPageRail.update` | [60](../../src/features/quran/components/MushafFooter.tsx#L60) |
| function | `MushafFooter` | [185](../../src/features/quran/components/MushafFooter.tsx#L185) |

### src/features/quran/components/MushafReadingActions.tsx

[Volledige bron](../../src/features/quran/components/MushafReadingActions.tsx), 165 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `MushafReadingActions` | [16](../../src/features/quran/components/MushafReadingActions.tsx#L16) |
| function | `MushafReadingActions.markPages` | [55](../../src/features/quran/components/MushafReadingActions.tsx#L55) |

### src/features/quran/components/MushafVerticalRail.tsx

[Volledige bron](../../src/features/quran/components/MushafVerticalRail.tsx), 111 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `MushafVerticalRailPosition` | [5](../../src/features/quran/components/MushafVerticalRail.tsx#L5) |
| method | `MushafVerticalRailPosition.update` | [5](../../src/features/quran/components/MushafVerticalRail.tsx#L5) |
| function | `MushafVerticalRail` | [8](../../src/features/quran/components/MushafVerticalRail.tsx#L8) |
| function-variable | `MushafVerticalRail.update` | [28](../../src/features/quran/components/MushafVerticalRail.tsx#L28) |
| function-variable | `MushafVerticalRail.cancel` | [37](../../src/features/quran/components/MushafVerticalRail.tsx#L37) |

### src/features/quran/components/PartActionsSheet.tsx

[Volledige bron](../../src/features/quran/components/PartActionsSheet.tsx), 115 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `PartActionTarget` | [10](../../src/features/quran/components/PartActionsSheet.tsx#L10) |
| function | `PartActionsSheet` | [30](../../src/features/quran/components/PartActionsSheet.tsx#L30) |
| function-variable | `PartActionsSheet.finish` | [47](../../src/features/quran/components/PartActionsSheet.tsx#L47) |

### src/features/quran/components/PrintedMushafPage.tsx

[Volledige bron](../../src/features/quran/components/PrintedMushafPage.tsx), 237 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `warshPage` | [23](../../src/features/quran/components/PrintedMushafPage.tsx#L23) |
| function | `PrintedMushafPage` | [57](../../src/features/quran/components/PrintedMushafPage.tsx#L57) |
| function-variable | `PrintedMushafPage.selectAt` | [130](../../src/features/quran/components/PrintedMushafPage.tsx#L130) |

### src/features/quran/components/ReaderListenButton.tsx

[Volledige bron](../../src/features/quran/components/ReaderListenButton.tsx), 51 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ReaderListenButton` | [8](../../src/features/quran/components/ReaderListenButton.tsx#L8) |

### src/features/quran/components/ReadingModeSwitch.tsx

[Volledige bron](../../src/features/quran/components/ReadingModeSwitch.tsx), 77 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ReadingModeSwitch` | [9](../../src/features/quran/components/ReadingModeSwitch.tsx#L9) |
| function | `TranslationControl` | [58](../../src/features/quran/components/ReadingModeSwitch.tsx#L58) |

### src/features/quran/components/SelectableMushafPage.tsx

[Volledige bron](../../src/features/quran/components/SelectableMushafPage.tsx), 431 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `SelectableMushafPage` | [33](../../src/features/quran/components/SelectableMushafPage.tsx#L33) |
| function | `SelectableMushafPage.point` | [171](../../src/features/quran/components/SelectableMushafPage.tsx#L171) |

### src/features/quran/components/SurahActionsSheet.tsx

[Volledige bron](../../src/features/quran/components/SurahActionsSheet.tsx), 153 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `SurahActionsSheet` | [11](../../src/features/quran/components/SurahActionsSheet.tsx#L11) |
| function | `SurahActionsSheet.finish` | [27](../../src/features/quran/components/SurahActionsSheet.tsx#L27) |

### src/features/quran/gestures/bookViewportGestures.ts

[Volledige bron](../../src/features/quran/gestures/bookViewportGestures.ts), 193 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Point` | [3](../../src/features/quran/gestures/bookViewportGestures.ts#L3) |
| type | `Viewport` | [4](../../src/features/quran/gestures/bookViewportGestures.ts#L4) |
| function-variable | `clamp` | [23](../../src/features/quran/gestures/bookViewportGestures.ts#L23) |
| function | `point` | [24](../../src/features/quran/gestures/bookViewportGestures.ts#L24) |
| function | `createBookViewportGesture` | [51](../../src/features/quran/gestures/bookViewportGestures.ts#L51) |
| method | `createBookViewportGesture.state` | [52](../../src/features/quran/gestures/bookViewportGestures.ts#L52) |
| method | `createBookViewportGesture.scroll` | [53](../../src/features/quran/gestures/bookViewportGestures.ts#L53) |
| method | `createBookViewportGesture.zoom` | [54](../../src/features/quran/gestures/bookViewportGestures.ts#L54) |
| method | `createBookViewportGesture.claimed` | [55](../../src/features/quran/gestures/bookViewportGestures.ts#L55) |
| function-variable | `createBookViewportGesture.begin` | [61](../../src/features/quran/gestures/bookViewportGestures.ts#L61) |
| function-variable | `createBookViewportGesture.layout` | [74](../../src/features/quran/gestures/bookViewportGestures.ts#L74) |
| function-variable | `createBookViewportGesture.allowed` | [94](../../src/features/quran/gestures/bookViewportGestures.ts#L94) |
| function-variable | `createBookViewportGesture.apply` | [102](../../src/features/quran/gestures/bookViewportGestures.ts#L102) |
| function-variable | `createBookViewportGesture.cancel` | [138](../../src/features/quran/gestures/bookViewportGestures.ts#L138) |
| method | `createBookViewportGesture.onTouchStart` | [151](../../src/features/quran/gestures/bookViewportGestures.ts#L151) |
| method | `createBookViewportGesture.onStartShouldSetResponderCapture` | [156](../../src/features/quran/gestures/bookViewportGestures.ts#L156) |
| method | `createBookViewportGesture.onMoveShouldSetResponderCapture` | [163](../../src/features/quran/gestures/bookViewportGestures.ts#L163) |
| method | `createBookViewportGesture.onResponderGrant` | [170](../../src/features/quran/gestures/bookViewportGestures.ts#L170) |
| method | `createBookViewportGesture.onResponderRelease` | [179](../../src/features/quran/gestures/bookViewportGestures.ts#L179) |

### src/features/quran/gestures/mushafPageTurn.ts

[Volledige bron](../../src/features/quran/gestures/mushafPageTurn.ts), 47 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `createReleasedMushafTurn` | [2](../../src/features/quran/gestures/mushafPageTurn.ts#L2) |
| function | `createReleasedMushafTurn.flush` | [9](../../src/features/quran/gestures/mushafPageTurn.ts#L9) |
| method | `createReleasedMushafTurn.begin` | [24](../../src/features/quran/gestures/mushafPageTurn.ts#L24) |
| method | `createReleasedMushafTurn.request` | [31](../../src/features/quran/gestures/mushafPageTurn.ts#L31) |
| method | `createReleasedMushafTurn.release` | [36](../../src/features/quran/gestures/mushafPageTurn.ts#L36) |
| method | `createReleasedMushafTurn.dispose` | [40](../../src/features/quran/gestures/mushafPageTurn.ts#L40) |

### src/features/quran/gestures/mushafTextGestureBridge.ts

[Volledige bron](../../src/features/quran/gestures/mushafTextGestureBridge.ts), 74 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `NativeGesture` | [16](../../src/features/quran/gestures/mushafTextGestureBridge.ts#L16) |
| type | `GestureModule` | [23](../../src/features/quran/gestures/mushafTextGestureBridge.ts#L23) |
| method | `GestureModule.attach` | [25](../../src/features/quran/gestures/mushafTextGestureBridge.ts#L25) |
| method | `GestureModule.detach` | [32](../../src/features/quran/gestures/mushafTextGestureBridge.ts#L32) |
| function | `observeMushafText` | [37](../../src/features/quran/gestures/mushafTextGestureBridge.ts#L37) |

### src/features/quran/gestures/mushafTextGestures.ts

[Volledige bron](../../src/features/quran/gestures/mushafTextGestures.ts), 277 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `MushafTouch` | [3](../../src/features/quran/gestures/mushafTextGestures.ts#L3) |
| type | `MushafPageBounds` | [12](../../src/features/quran/gestures/mushafTextGestures.ts#L12) |
| type | `MushafSwipeMetrics` | [13](../../src/features/quran/gestures/mushafTextGestures.ts#L13) |
| function-variable | `clampUnit` | [48](../../src/features/quran/gestures/mushafTextGestures.ts#L48) |
| function-variable | `elapsedTouchTime` | [49](../../src/features/quran/gestures/mushafTextGestures.ts#L49) |
| function | `mushafSwipeDirection` | [55](../../src/features/quran/gestures/mushafTextGestures.ts#L55) |
| function | `createMushafTextGesture` | [148](../../src/features/quran/gestures/mushafTextGestures.ts#L148) |
| method | `createMushafTextGesture.start` | [167](../../src/features/quran/gestures/mushafTextGestures.ts#L167) |
| function-variable | `createMushafTextGesture.start.setPageBounds` | [187](../../src/features/quran/gestures/mushafTextGestures.ts#L187) |
| method | `createMushafTextGesture.move` | [195](../../src/features/quran/gestures/mushafTextGestures.ts#L195) |
| method | `createMushafTextGesture.end` | [210](../../src/features/quran/gestures/mushafTextGestures.ts#L210) |
| method | `createMushafTextGesture.cancel` | [236](../../src/features/quran/gestures/mushafTextGestures.ts#L236) |
| method | `createMushafTextGesture.selection` | [240](../../src/features/quran/gestures/mushafTextGestures.ts#L240) |
| method | `createMushafTextGesture.wordStart` | [244](../../src/features/quran/gestures/mushafTextGestures.ts#L244) |
| method | `createMushafTextGesture.longPress` | [247](../../src/features/quran/gestures/mushafTextGestures.ts#L247) |
| method | `createMushafTextGesture.wordTap` | [253](../../src/features/quran/gestures/mushafTextGestures.ts#L253) |
| function | `sameMushafWord` | [274](../../src/features/quran/gestures/mushafTextGestures.ts#L274) |

### src/features/quran/layout/bookScrollPosition.ts

[Volledige bron](../../src/features/quran/layout/bookScrollPosition.ts), 27 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `finite` | [1](../../src/features/quran/layout/bookScrollPosition.ts#L1) |
| function | `bookScrollAnchor` | [4](../../src/features/quran/layout/bookScrollPosition.ts#L4) |
| function | `bookOffsetForAnchor` | [9](../../src/features/quran/layout/bookScrollPosition.ts#L9) |

### src/features/quran/layout/continuousMushafCrop.ts

[Volledige bron](../../src/features/quran/layout/continuousMushafCrop.ts), 16 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `continuousMushafCrop` | [5](../../src/features/quran/layout/continuousMushafCrop.ts#L5) |

### src/features/quran/layout/mushafCrop.ts

[Volledige bron](../../src/features/quran/layout/mushafCrop.ts), 23 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `mushafCropZoom` | [4](../../src/features/quran/layout/mushafCrop.ts#L4) |
| function | `cropSegment` | [8](../../src/features/quran/layout/mushafCrop.ts#L8) |
| function | `uncropPoint` | [19](../../src/features/quran/layout/mushafCrop.ts#L19) |

### src/features/quran/layout/mushafScrubber.ts

[Volledige bron](../../src/features/quran/layout/mushafScrubber.ts), 30 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `pageAtRailPosition` | [2](../../src/features/quran/layout/mushafScrubber.ts#L2) |
| function | `railPositionForPage` | [8](../../src/features/quran/layout/mushafScrubber.ts#L8) |
| function | `tickForPage` | [13](../../src/features/quran/layout/mushafScrubber.ts#L13) |
| function | `tickPageRanges` | [18](../../src/features/quran/layout/mushafScrubber.ts#L18) |

### src/features/quran/layout/pdfCrop.ts

[Volledige bron](../../src/features/quran/layout/pdfCrop.ts), 53 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `PdfBox` | [4](../../src/features/quran/layout/pdfCrop.ts#L4) |
| function | `shouldAutomaticallyCropPdf` | [8](../../src/features/quran/layout/pdfCrop.ts#L8) |
| function | `croppedPdfBox` | [12](../../src/features/quran/layout/pdfCrop.ts#L12) |
| function | `cropPdfBytes` | [32](../../src/features/quran/layout/pdfCrop.ts#L32) |
| function-variable | `cropPdfBytes.check` | [33](../../src/features/quran/layout/pdfCrop.ts#L33) |

### src/features/quran/layout/pdfZoom.ts

[Volledige bron](../../src/features/quran/layout/pdfZoom.ts), 14 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `observedPdfZoom` | [5](../../src/features/quran/layout/pdfZoom.ts#L5) |
| function | `stepPdfZoom` | [11](../../src/features/quran/layout/pdfZoom.ts#L11) |

### src/features/quran/layout/readerScrollAnchor.ts

[Volledige bron](../../src/features/quran/layout/readerScrollAnchor.ts), 80 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `ReaderScrollAnchor` | [2](../../src/features/quran/layout/readerScrollAnchor.ts#L2) |
| method | `ReaderScrollAnchor.measureRow` | [16](../../src/features/quran/layout/readerScrollAnchor.ts#L16) |
| method | `ReaderScrollAnchor.measureHeader` | [21](../../src/features/quran/layout/readerScrollAnchor.ts#L21) |
| method | `ReaderScrollAnchor.measureFooter` | [25](../../src/features/quran/layout/readerScrollAnchor.ts#L25) |
| method | `ReaderScrollAnchor.measureViewport` | [29](../../src/features/quran/layout/readerScrollAnchor.ts#L29) |
| method | `ReaderScrollAnchor.measureContent` | [33](../../src/features/quran/layout/readerScrollAnchor.ts#L33) |
| method | `ReaderScrollAnchor.rowHeight` | [37](../../src/features/quran/layout/readerScrollAnchor.ts#L37) |
| method | `ReaderScrollAnchor.measuredPrefix` | [41](../../src/features/quran/layout/readerScrollAnchor.ts#L41) |
| method | `ReaderScrollAnchor.offset` | [47](../../src/features/quran/layout/readerScrollAnchor.ts#L47) |
| method | `ReaderScrollAnchor.confirms` | [75](../../src/features/quran/layout/readerScrollAnchor.ts#L75) |

### src/features/quran/layout/readingLayout.ts

[Volledige bron](../../src/features/quran/layout/readingLayout.ts), 13 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `isShortLandscape` | [2](../../src/features/quran/layout/readingLayout.ts#L2) |
| function | `useBookSpread` | [5](../../src/features/quran/layout/readingLayout.ts#L5) |

### src/features/quran/model/croppedPdf.ts

[Volledige bron](../../src/features/quran/model/croppedPdf.ts), 70 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `cropFiles` | [6](../../src/features/quran/model/croppedPdf.ts#L6) |
| function | `cachedCroppedPdfUri` | [13](../../src/features/quran/model/croppedPdf.ts#L13) |
| function | `prepareCroppedPdf` | [25](../../src/features/quran/model/croppedPdf.ts#L25) |
| function | `prepareUncachedPdf` | [37](../../src/features/quran/model/croppedPdf.ts#L37) |

### src/features/quran/model/mushafDownloadCopy.ts

[Volledige bron](../../src/features/quran/model/mushafDownloadCopy.ts), 48 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Locale` | [1](../../src/features/quran/model/mushafDownloadCopy.ts#L1) |
| function | `remainingDownloadTime` | [42](../../src/features/quran/model/mushafDownloadCopy.ts#L42) |

### src/features/quran/model/readPageMetrics.ts

[Volledige bron](../../src/features/quran/model/readPageMetrics.ts), 69 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `readPageMetrics` | [12](../../src/features/quran/model/readPageMetrics.ts#L12) |

### src/features/quran/model/readerCopy.ts

[Volledige bron](../../src/features/quran/model/readerCopy.ts), 87 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `readerCopy` | [84](../../src/features/quran/model/readerCopy.ts#L84) |

### src/features/quran/model/surahIllustrations.ts

[Volledige bron](../../src/features/quran/model/surahIllustrations.ts), 120 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/features/quran/providers/readingModeContext.ts

[Volledige bron](../../src/features/quran/providers/readingModeContext.ts), 28 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Point` | [4](../../src/features/quran/providers/readingModeContext.ts#L4) |
| function | `textToBook` | [6](../../src/features/quran/providers/readingModeContext.ts#L6) |
| function | `bookToText` | [20](../../src/features/quran/providers/readingModeContext.ts#L20) |

### src/features/quran/screens/MushafLibraryScreen.tsx

[Volledige bron](../../src/features/quran/screens/MushafLibraryScreen.tsx), 343 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `MushafLibraryScreen` | [116](../../src/features/quran/screens/MushafLibraryScreen.tsx#L116) |
| function | `MushafLibraryScreen.select` | [137](../../src/features/quran/screens/MushafLibraryScreen.tsx#L137) |
| function | `MushafLibraryScreen.askDownload` | [143](../../src/features/quran/screens/MushafLibraryScreen.tsx#L143) |
| function | `MushafLibraryScreen.askRemove` | [174](../../src/features/quran/screens/MushafLibraryScreen.tsx#L174) |

### src/features/quran/screens/MushafScreen.tsx

[Volledige bron](../../src/features/quran/screens/MushafScreen.tsx), 1607 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `pointOnPage` | [85](../../src/features/quran/screens/MushafScreen.tsx#L85) |
| function | `MushafScreen` | [97](../../src/features/quran/screens/MushafScreen.tsx#L97) |
| function | `ImageMushaf` | [220](../../src/features/quran/screens/MushafScreen.tsx#L220) |
| function | `ImageMushaf.setFullscreen` | [611](../../src/features/quran/screens/MushafScreen.tsx#L611) |
| function-variable | `ImageMushaf.openText` | [625](../../src/features/quran/screens/MushafScreen.tsx#L625) |
| function | `ImageMushaf.playSelectedSurah` | [646](../../src/features/quran/screens/MushafScreen.tsx#L646) |
| function | `ImageMushaf.openRepeat` | [657](../../src/features/quran/screens/MushafScreen.tsx#L657) |
| function | `ImageMushaf.openWord` | [667](../../src/features/quran/screens/MushafScreen.tsx#L667) |
| function-variable | `ImageMushaf.goToPage` | [685](../../src/features/quran/screens/MushafScreen.tsx#L685) |
| function-variable | `ImageMushaf.turn` | [693](../../src/features/quran/screens/MushafScreen.tsx#L693) |
| function-variable | `ImageMushaf.imagePoint` | [694](../../src/features/quran/screens/MushafScreen.tsx#L694) |
| function-variable | `ImageMushaf.choosePresentation` | [722](../../src/features/quran/screens/MushafScreen.tsx#L722) |
| function-variable | `ImageMushaf.chooseSelectionMode` | [745](../../src/features/quran/screens/MushafScreen.tsx#L745) |

### src/features/quran/screens/QuranScreen.tsx

[Volledige bron](../../src/features/quran/screens/QuranScreen.tsx), 362 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `QuranScreen` | [30](../../src/features/quran/screens/QuranScreen.tsx#L30) |
| function | `QuranScreen.openPart` | [59](../../src/features/quran/screens/QuranScreen.tsx#L59) |
| function | `QuranScreen.partActions` | [79](../../src/features/quran/screens/QuranScreen.tsx#L79) |

### src/features/quran/screens/ReaderScreen.tsx

[Volledige bron](../../src/features/quran/screens/ReaderScreen.tsx), 940 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ReaderVerse` | [57](../../src/features/quran/screens/ReaderScreen.tsx#L57) |
| function | `ReaderScreen` | [60](../../src/features/quran/screens/ReaderScreen.tsx#L60) |
| function-variable | `ReaderScreen.currentGeometry` | [161](../../src/features/quran/screens/ReaderScreen.tsx#L161) |
| function-variable | `ReaderScreen.finishAnchor` | [171](../../src/features/quran/screens/ReaderScreen.tsx#L171) |
| function-variable | `ReaderScreen.queueAnchor` | [183](../../src/features/quran/screens/ReaderScreen.tsx#L183) |
| function-variable | `ReaderScreen.requestAnchor` | [206](../../src/features/quran/screens/ReaderScreen.tsx#L206) |
| function | `ReaderScreen.playSelectedSurah` | [329](../../src/features/quran/screens/ReaderScreen.tsx#L329) |
| function | `ReaderScreen.openRepeat` | [340](../../src/features/quran/screens/ReaderScreen.tsx#L340) |
| function | `ReaderScreen.finish` | [346](../../src/features/quran/screens/ReaderScreen.tsx#L346) |
| function | `ReaderScreen.jumpToAyah` | [370](../../src/features/quran/screens/ReaderScreen.tsx#L370) |

### src/features/study/components/AvailableSourcePicker.tsx

[Volledige bron](../../src/features/study/components/AvailableSourcePicker.tsx), 42 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `AvailableSourcePicker` | [5](../../src/features/study/components/AvailableSourcePicker.tsx#L5) |

### src/features/study/model/bookCatalog.ts

[Volledige bron](../../src/features/study/model/bookCatalog.ts), 139 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Language` | [3](../../src/features/study/model/bookCatalog.ts#L3) |
| type | `Book` | [4](../../src/features/study/model/bookCatalog.ts#L4) |
| type | `Strings` | [12](../../src/features/study/model/bookCatalog.ts#L12) |
| function | `strings` | [135](../../src/features/study/model/bookCatalog.ts#L135) |

### src/features/study/screens/BookReaderScreen.tsx

[Volledige bron](../../src/features/study/screens/BookReaderScreen.tsx), 482 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ReaderProps` | [14](../../src/features/study/screens/BookReaderScreen.tsx#L14) |
| type | `ReaderRoute` | [15](../../src/features/study/screens/BookReaderScreen.tsx#L15) |
| type | `BookChapter` | [16](../../src/features/study/screens/BookReaderScreen.tsx#L16) |
| type | `BookPage` | [17](../../src/features/study/screens/BookReaderScreen.tsx#L17) |
| type | `BookContent` | [18](../../src/features/study/screens/BookReaderScreen.tsx#L18) |
| type | `SearchResult` | [19](../../src/features/study/screens/BookReaderScreen.tsx#L19) |
| type | `DbError` | [20](../../src/features/study/screens/BookReaderScreen.tsx#L20) |
| function | `BookReaderScreen` | [21](../../src/features/study/screens/BookReaderScreen.tsx#L21) |
| function | `ReaderFailure` | [58](../../src/features/study/screens/BookReaderScreen.tsx#L58) |
| function | `cleanBookText` | [70](../../src/features/study/screens/BookReaderScreen.tsx#L70) |
| function | `searchPreview` | [81](../../src/features/study/screens/BookReaderScreen.tsx#L81) |
| function | `loadBook` | [89](../../src/features/study/screens/BookReaderScreen.tsx#L89) |
| function | `loadPageText` | [100](../../src/features/study/screens/BookReaderScreen.tsx#L100) |
| function | `searchBook` | [112](../../src/features/study/screens/BookReaderScreen.tsx#L112) |
| function | `BookReaderContent` | [139](../../src/features/study/screens/BookReaderScreen.tsx#L139) |

### src/features/study/screens/BooksScreen.tsx

[Volledige bron](../../src/features/study/screens/BooksScreen.tsx), 108 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `BooksScreen` | [9](../../src/features/study/screens/BooksScreen.tsx#L9) |

### src/features/study/screens/MutashabihatScreen.tsx

[Volledige bron](../../src/features/study/screens/MutashabihatScreen.tsx), 227 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `loadGroups` | [29](../../src/features/study/screens/MutashabihatScreen.tsx#L29) |
| function | `MutashabihatScreen` | [42](../../src/features/study/screens/MutashabihatScreen.tsx#L42) |
| function-variable | `MutashabihatScreen.count` | [69](../../src/features/study/screens/MutashabihatScreen.tsx#L69) |
| function | `SequenceRow` | [190](../../src/features/study/screens/MutashabihatScreen.tsx#L190) |

### src/features/study/screens/StudyScreen.tsx

[Volledige bron](../../src/features/study/screens/StudyScreen.tsx), 553 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Props` | [19](../../src/features/study/screens/StudyScreen.tsx#L19) |
| type | `Mode` | [20](../../src/features/study/screens/StudyScreen.tsx#L20) |
| type | `AbsoluteSequence` | [21](../../src/features/study/screens/StudyScreen.tsx#L21) |
| type | `RawSimilarGroup` | [22](../../src/features/study/screens/StudyScreen.tsx#L22) |
| type | `Passage` | [23](../../src/features/study/screens/StudyScreen.tsx#L23) |
| type | `SimilarGroup` | [24](../../src/features/study/screens/StudyScreen.tsx#L24) |
| function | `readSequence` | [82](../../src/features/study/screens/StudyScreen.tsx#L82) |
| function | `makePassage` | [91](../../src/features/study/screens/StudyScreen.tsx#L91) |
| function | `similarGroupsForAyah` | [101](../../src/features/study/screens/StudyScreen.tsx#L101) |
| function | `referenceLabel` | [123](../../src/features/study/screens/StudyScreen.tsx#L123) |
| function | `PassageRow` | [135](../../src/features/study/screens/StudyScreen.tsx#L135) |
| function | `StudyScreen` | [190](../../src/features/study/screens/StudyScreen.tsx#L190) |
| function | `StudyScreenContent` | [194](../../src/features/study/screens/StudyScreen.tsx#L194) |
| function-variable | `StudyScreenContent.openAyah` | [287](../../src/features/study/screens/StudyScreen.tsx#L287) |
| function-variable | `StudyScreenContent.openSources` | [289](../../src/features/study/screens/StudyScreen.tsx#L289) |

### src/features/study/screens/StudySourceContent.tsx

[Volledige bron](../../src/features/study/screens/StudySourceContent.tsx), 492 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Kind` | [45](../../src/features/study/screens/StudySourceContent.tsx#L45) |
| type | `Translation` | [46](../../src/features/study/screens/StudySourceContent.tsx#L46) |
| function | `StudySourceContent` | [74](../../src/features/study/screens/StudySourceContent.tsx#L74) |
| function-variable | `StudySourceContent.clear` | [143](../../src/features/study/screens/StudySourceContent.tsx#L143) |
| function-variable | `StudySourceContent.load` | [211](../../src/features/study/screens/StudySourceContent.tsx#L211) |
| function-variable | `StudySourceContent.stepTafsir` | [215](../../src/features/study/screens/StudySourceContent.tsx#L215) |
| function-variable | `StudySourceContent.openSource` | [222](../../src/features/study/screens/StudySourceContent.tsx#L222) |

### src/features/study/screens/StudySourcesScreen.tsx

[Volledige bron](../../src/features/study/screens/StudySourcesScreen.tsx), 10 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `StudySourcesScreen` | [7](../../src/features/study/screens/StudySourcesScreen.tsx#L7) |

### src/i18n/index.ts

[Volledige bron](../../src/i18n/index.ts), 197 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Locale` | [7](../../src/i18n/index.ts#L7) |
| type | `SourceLocale` | [8](../../src/i18n/index.ts#L8) |
| type | `SourceCopyEntry` | [9](../../src/i18n/index.ts#L9) |
| function-variable | `rank` | [43](../../src/i18n/index.ts#L43) |
| function | `resolveLocale` | [50](../../src/i18n/index.ts#L50) |
| function | `sourceKeyFor` | [54](../../src/i18n/index.ts#L54) |
| function | `hasSourceKey` | [58](../../src/i18n/index.ts#L58) |
| function | `restoreSourceCopy` | [63](../../src/i18n/index.ts#L63) |
| function | `sourceText` | [92](../../src/i18n/index.ts#L92) |
| function | `translate` | [99](../../src/i18n/index.ts#L99) |
| function | `formatSource` | [109](../../src/i18n/index.ts#L109) |
| function | `interpolateSource` | [129](../../src/i18n/index.ts#L129) |
| function | `translateTemplate` | [154](../../src/i18n/index.ts#L154) |
| function | `useI18n` | [171](../../src/i18n/index.ts#L171) |
| function | `hasAllLocaleEntries` | [187](../../src/i18n/index.ts#L187) |
| function | `hasArabicLocaleEntries` | [192](../../src/i18n/index.ts#L192) |

### src/i18n/notes.ts

[Volledige bron](../../src/i18n/notes.ts), 194 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `NoteLabels` | [178](../../src/i18n/notes.ts#L178) |
| function | `useNotesCopy` | [182](../../src/i18n/notes.ts#L182) |

### src/i18n/readingStreak.ts

[Volledige bron](../../src/i18n/readingStreak.ts), 18 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `readingStreakText` | [4](../../src/i18n/readingStreak.ts#L4) |

### src/migration/legacyAndroid.native.ts

[Volledige bron](../../src/migration/legacyAndroid.native.ts), 225 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LegacyAndroidImportResult` | [33](../../src/migration/legacyAndroid.native.ts#L33) |
| function | `legacyDatabaseDirectory` | [35](../../src/migration/legacyAndroid.native.ts#L35) |
| function | `appDataDirectory` | [43](../../src/migration/legacyAndroid.native.ts#L43) |
| function | `readPreferenceFiles` | [51](../../src/migration/legacyAndroid.native.ts#L51) |
| function | `existingRoomDatabase` | [70](../../src/migration/legacyAndroid.native.ts#L70) |
| function | `getTables` | [79](../../src/migration/legacyAndroid.native.ts#L79) |
| function | `readRows` | [86](../../src/migration/legacyAndroid.native.ts#L86) |
| function | `readLegacyRoom` | [90](../../src/migration/legacyAndroid.native.ts#L90) |
| function | `importLegacyAndroidData` | [183](../../src/migration/legacyAndroid.native.ts#L183) |

### src/migration/legacyAndroid.ts

[Volledige bron](../../src/migration/legacyAndroid.ts), 10 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `importLegacyAndroidData` | [5](../../src/migration/legacyAndroid.ts#L5) |

### src/migration/legacyAndroid.web.ts

[Volledige bron](../../src/migration/legacyAndroid.web.ts), 10 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `importLegacyAndroidData` | [5](../../src/migration/legacyAndroid.web.ts#L5) |

### src/migration/legacyRoom.ts

[Volledige bron](../../src/migration/legacyRoom.ts), 540 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `SqlRow` | [19](../../src/migration/legacyRoom.ts#L19) |
| type | `LegacyRoomRows` | [20](../../src/migration/legacyRoom.ts#L20) |
| type | `LegacyPreferenceFiles` | [31](../../src/migration/legacyRoom.ts#L31) |
| type | `LegacyImportResult` | [32](../../src/migration/legacyRoom.ts#L32) |
| type | `ChecklistState` | [39](../../src/migration/legacyRoom.ts#L39) |
| function-variable | `number` | [44](../../src/migration/legacyRoom.ts#L44) |
| function-variable | `string` | [46](../../src/migration/legacyRoom.ts#L46) |
| function-variable | `bool` | [48](../../src/migration/legacyRoom.ts#L48) |
| function-variable | `nullableNumber` | [49](../../src/migration/legacyRoom.ts#L49) |
| function-variable | `nullableString` | [51](../../src/migration/legacyRoom.ts#L51) |
| function | `parseAndroidPreferencesXml` | [55](../../src/migration/legacyRoom.ts#L55) |
| function-variable | `parseAndroidPreferencesXml.decode` | [58](../../src/migration/legacyRoom.ts#L58) |
| function-variable | `parseAndroidPreferencesXml.readAttribute` | [64](../../src/migration/legacyRoom.ts#L64) |
| function | `whitelistAndroidPreferenceFiles` | [95](../../src/migration/legacyRoom.ts#L95) |
| function | `destinationHasUserData` | [148](../../src/migration/legacyRoom.ts#L148) |
| function | `normalizeLegacyRoomRows` | [170](../../src/migration/legacyRoom.ts#L170) |
| function | `mapNote` | [231](../../src/migration/legacyRoom.ts#L231) |
| function | `mapProgress` | [259](../../src/migration/legacyRoom.ts#L259) |
| function | `mapHistory` | [275](../../src/migration/legacyRoom.ts#L275) |
| function | `mapPlan` | [292](../../src/migration/legacyRoom.ts#L292) |
| function | `mapDailyGoal` | [312](../../src/migration/legacyRoom.ts#L312) |
| function | `mapGoalDay` | [321](../../src/migration/legacyRoom.ts#L321) |
| function | `mapJourney` | [331](../../src/migration/legacyRoom.ts#L331) |
| function | `validLanguage` | [343](../../src/migration/legacyRoom.ts#L343) |
| function | `validTheme` | [346](../../src/migration/legacyRoom.ts#L346) |
| function | `isoDayEnd` | [351](../../src/migration/legacyRoom.ts#L351) |
| function | `importLegacyRoomRows` | [359](../../src/migration/legacyRoom.ts#L359) |
| function | `noLegacyDataResult` | [512](../../src/migration/legacyRoom.ts#L512) |
| function | `legacyChecklistToState` | [516](../../src/migration/legacyRoom.ts#L516) |

### src/services/audio/audio-catalog.ts

[Volledige bron](../../src/services/audio/audio-catalog.ts), 113 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `RawAudioOption` | [3](../../src/services/audio/audio-catalog.ts#L3) |
| function | `riwayaCategory` | [11](../../src/services/audio/audio-catalog.ts#L11) |
| function | `filterReciters` | [31](../../src/services/audio/audio-catalog.ts#L31) |
| function-variable | `filterReciters.normalized` | [36](../../src/services/audio/audio-catalog.ts#L36) |
| function | `parseAudioCatalog` | [49](../../src/services/audio/audio-catalog.ts#L49) |
| function | `mirroredAudioUrl` | [73](../../src/services/audio/audio-catalog.ts#L73) |
| function | `validateAyahTimings` | [90](../../src/services/audio/audio-catalog.ts#L90) |

### src/services/audio/audio-queue.ts

[Volledige bron](../../src/services/audio/audio-queue.ts), 25 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AudioQueueCursor` | [1](../../src/services/audio/audio-queue.ts#L1) |
| function | `nextAudioQueueCursor` | [4](../../src/services/audio/audio-queue.ts#L4) |

### src/services/audio/audio.ts

[Volledige bron](../../src/services/audio/audio.ts), 175 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `createAudioService` | [15](../../src/services/audio/audio.ts#L15) |
| function | `createAudioService.localFile` | [16](../../src/services/audio/audio.ts#L16) |
| function | `createAudioService.complete` | [33](../../src/services/audio/audio.ts#L33) |
| method | `createAudioService.listSurah` | [52](../../src/services/audio/audio.ts#L52) |
| method | `createAudioService.getAyahTimings` | [57](../../src/services/audio/audio.ts#L57) |
| method | `createAudioService.resolve` | [113](../../src/services/audio/audio.ts#L113) |
| method | `createAudioService.getDownloadedUri` | [116](../../src/services/audio/audio.ts#L116) |
| method | `createAudioService.download` | [123](../../src/services/audio/audio.ts#L123) |
| function-variable | `createAudioService.download.cleanup` | [129](../../src/services/audio/audio.ts#L129) |
| method | `createAudioService.download.download` | [136](../../src/services/audio/audio.ts#L136) |
| method | `createAudioService.download.validate` | [147](../../src/services/audio/audio.ts#L147) |
| method | `createAudioService.download.commit` | [156](../../src/services/audio/audio.ts#L156) |

### src/services/audio/audioDownload.ts

[Volledige bron](../../src/services/audio/audioDownload.ts), 40 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AudioDownloadPort` | [1](../../src/services/audio/audioDownload.ts#L1) |
| method | `AudioDownloadPort.complete` | [2](../../src/services/audio/audioDownload.ts#L2) |
| method | `AudioDownloadPort.download` | [3](../../src/services/audio/audioDownload.ts#L3) |
| method | `AudioDownloadPort.validate` | [4](../../src/services/audio/audioDownload.ts#L4) |
| method | `AudioDownloadPort.commit` | [5](../../src/services/audio/audioDownload.ts#L5) |
| method | `AudioDownloadPort.cleanup` | [6](../../src/services/audio/audioDownload.ts#L6) |
| function | `downloadAudio` | [9](../../src/services/audio/audioDownload.ts#L9) |
| function | `validMp3Header` | [33](../../src/services/audio/audioDownload.ts#L33) |

### src/services/audio/repeatSelection.ts

[Volledige bron](../../src/services/audio/repeatSelection.ts), 148 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `RepeatMode` | [14](../../src/services/audio/repeatSelection.ts#L14) |
| type | `RepeatPoint` | [15](../../src/services/audio/repeatSelection.ts#L15) |
| type | `RepeatSelectionInput` | [16](../../src/services/audio/repeatSelection.ts#L16) |
| function | `printedVerseCount` | [28](../../src/services/audio/repeatSelection.ts#L28) |
| function | `printedVerseForCanonical` | [31](../../src/services/audio/repeatSelection.ts#L31) |
| function | `repeatInitialPage` | [37](../../src/services/audio/repeatSelection.ts#L37) |
| function | `repeatSelection` | [45](../../src/services/audio/repeatSelection.ts#L45) |
| function | `createRepeatQueue` | [103](../../src/services/audio/repeatSelection.ts#L103) |

### src/services/auth/accountMutation.ts

[Volledige bron](../../src/services/auth/accountMutation.ts), 88 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Storage` | [8](../../src/services/auth/accountMutation.ts#L8) |
| method | `Storage.getItem` | [9](../../src/services/auth/accountMutation.ts#L9) |
| method | `Storage.setItem` | [10](../../src/services/auth/accountMutation.ts#L10) |
| method | `Storage.removeItem` | [11](../../src/services/auth/accountMutation.ts#L11) |
| type | `AccountMutation` | [13](../../src/services/auth/accountMutation.ts#L13) |
| function | `createAccountMutation` | [22](../../src/services/auth/accountMutation.ts#L22) |
| function-variable | `createAccountMutation.verifierKey` | [36](../../src/services/auth/accountMutation.ts#L36) |

### src/services/auth/appleAccountDeletion.ts

[Volledige bron](../../src/services/auth/appleAccountDeletion.ts), 75 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `deleteAppleAccount` | [5](../../src/services/auth/appleAccountDeletion.ts#L5) |

### src/services/auth/appleIdentity.ts

[Volledige bron](../../src/services/auth/appleIdentity.ts), 72 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AppleIdentity` | [1](../../src/services/auth/appleIdentity.ts#L1) |
| type | `AppleOAuth` | [9](../../src/services/auth/appleIdentity.ts#L9) |
| method | `AppleOAuth.isAvailable` | [10](../../src/services/auth/appleIdentity.ts#L10) |
| method | `AppleOAuth.signIn` | [11](../../src/services/auth/appleIdentity.ts#L11) |
| method | `AppleOAuth.watchRevocation` | [12](../../src/services/auth/appleIdentity.ts#L12) |
| method | `AppleOAuth.isCredentialRevoked` | [13](../../src/services/auth/appleIdentity.ts#L13) |
| type | `AppleNativePort` | [15](../../src/services/auth/appleIdentity.ts#L15) |
| method | `AppleNativePort.isAvailable` | [16](../../src/services/auth/appleIdentity.ts#L16) |
| method | `AppleNativePort.randomValues` | [17](../../src/services/auth/appleIdentity.ts#L17) |
| method | `AppleNativePort.sha256` | [18](../../src/services/auth/appleIdentity.ts#L18) |
| method | `AppleNativePort.request` | [19](../../src/services/auth/appleIdentity.ts#L19) |
| function | `createAppleOAuth` | [29](../../src/services/auth/appleIdentity.ts#L29) |
| function-variable | `createAppleOAuth.random` | [31](../../src/services/auth/appleIdentity.ts#L31) |
| method | `createAppleOAuth.signIn` | [38](../../src/services/auth/appleIdentity.ts#L38) |

### src/services/auth/appleOAuth.ios.ts

[Volledige bron](../../src/services/auth/appleOAuth.ios.ts), 52 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `request` | [16](../../src/services/auth/appleOAuth.ios.ts#L16) |
| method | `watchRevocation` | [40](../../src/services/auth/appleOAuth.ios.ts#L40) |
| method | `isCredentialRevoked` | [44](../../src/services/auth/appleOAuth.ios.ts#L44) |

### src/services/auth/appleOAuth.ts

[Volledige bron](../../src/services/auth/appleOAuth.ts), 10 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `signIn` | [6](../../src/services/auth/appleOAuth.ts#L6) |

### src/services/auth/auth.ts

[Volledige bron](../../src/services/auth/auth.ts), 310 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `required` | [10](../../src/services/auth/auth.ts#L10) |
| function | `unwrap` | [14](../../src/services/auth/auth.ts#L14) |
| function | `toAuthUser` | [21](../../src/services/auth/auth.ts#L21) |
| function | `hasAppleIdentity` | [43](../../src/services/auth/auth.ts#L43) |
| function | `toAuthSession` | [50](../../src/services/auth/auth.ts#L50) |
| function | `createAuthService` | [55](../../src/services/auth/auth.ts#L55) |
| function | `createAuthService.checkAppleRevocation` | [67](../../src/services/auth/auth.ts#L67) |
| function | `createAuthService.mutateCurrentAccount` | [89](../../src/services/auth/auth.ts#L89) |
| method | `createAuthService.getSession` | [101](../../src/services/auth/auth.ts#L101) |
| method | `createAuthService.getUser` | [106](../../src/services/auth/auth.ts#L106) |
| method | `createAuthService.signIn` | [112](../../src/services/auth/auth.ts#L112) |
| method | `createAuthService.signInWithGoogle` | [117](../../src/services/auth/auth.ts#L117) |
| method | `createAuthService.signInWithApple` | [120](../../src/services/auth/auth.ts#L120) |
| method | `createAuthService.signUp` | [146](../../src/services/auth/auth.ts#L146) |
| method | `createAuthService.resendSignUpConfirmation` | [158](../../src/services/auth/auth.ts#L158) |
| method | `createAuthService.signOut` | [166](../../src/services/auth/auth.ts#L166) |
| method | `createAuthService.requestPasswordReset` | [172](../../src/services/auth/auth.ts#L172) |
| method | `createAuthService.requestPasswordChangeCode` | [176](../../src/services/auth/auth.ts#L176) |
| method | `createAuthService.completePasswordRecovery` | [180](../../src/services/auth/auth.ts#L180) |
| method | `createAuthService.verifyPassword` | [187](../../src/services/auth/auth.ts#L187) |
| method | `createAuthService.updateUserPassword` | [195](../../src/services/auth/auth.ts#L195) |
| method | `createAuthService.updateUserEmail` | [207](../../src/services/auth/auth.ts#L207) |
| method | `createAuthService.accountDeletionStatus` | [220](../../src/services/auth/auth.ts#L220) |
| method | `createAuthService.deleteOwnAccount` | [223](../../src/services/auth/auth.ts#L223) |
| method | `createAuthService.completeCallback` | [256](../../src/services/auth/auth.ts#L256) |
| method | `createAuthService.onLifecycle` | [277](../../src/services/auth/auth.ts#L277) |
| method | `createAuthService.setRefreshActive` | [284](../../src/services/auth/auth.ts#L284) |
| method | `createAuthService.onChange` | [288](../../src/services/auth/auth.ts#L288) |

### src/services/auth/authCallback.ts

[Volledige bron](../../src/services/auth/authCallback.ts), 112 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AuthOtpType` | [2](../../src/services/auth/authCallback.ts#L2) |
| type | `AuthCallback` | [3](../../src/services/auth/authCallback.ts#L3) |
| function | `parseAuthCallback` | [20](../../src/services/auth/authCallback.ts#L20) |
| function-variable | `parseAuthCallback.get` | [45](../../src/services/auth/authCallback.ts#L45) |
| function | `trustedGoogleOAuthUrl` | [69](../../src/services/auth/authCallback.ts#L69) |
| function | `verifiedAuthRecovery` | [108](../../src/services/auth/authCallback.ts#L108) |

### src/services/auth/authCrypto.native.ts

[Volledige bron](../../src/services/auth/authCrypto.native.ts), 38 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `digest` | [19](../../src/services/auth/authCrypto.native.ts#L19) |
| function | `requireSecurePkce` | [30](../../src/services/auth/authCrypto.native.ts#L30) |

### src/services/auth/authCrypto.ts

[Volledige bron](../../src/services/auth/authCrypto.ts), 9 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `requireSecurePkce` | [1](../../src/services/auth/authCrypto.ts#L1) |

### src/services/auth/googleOAuth.ts

[Volledige bron](../../src/services/auth/googleOAuth.ts), 18 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `googleOAuthUrl` | [5](../../src/services/auth/googleOAuth.ts#L5) |

### src/services/auth/types.ts

[Volledige bron](../../src/services/auth/types.ts), 43 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AuthUser` | [4](../../src/services/auth/types.ts#L4) |
| type | `AuthSession` | [13](../../src/services/auth/types.ts#L13) |
| type | `AppleSignInResult` | [14](../../src/services/auth/types.ts#L14) |
| type | `AuthCallbackCredentials` | [15](../../src/services/auth/types.ts#L15) |
| type | `AuthService` | [17](../../src/services/auth/types.ts#L17) |
| method | `AuthService.getSession` | [18](../../src/services/auth/types.ts#L18) |
| method | `AuthService.getUser` | [19](../../src/services/auth/types.ts#L19) |
| method | `AuthService.signIn` | [20](../../src/services/auth/types.ts#L20) |
| method | `AuthService.signInWithGoogle` | [21](../../src/services/auth/types.ts#L21) |
| method | `AuthService.signInWithApple` | [23](../../src/services/auth/types.ts#L23) |
| method | `AuthService.signUp` | [24](../../src/services/auth/types.ts#L24) |
| method | `AuthService.resendSignUpConfirmation` | [25](../../src/services/auth/types.ts#L25) |
| method | `AuthService.signOut` | [26](../../src/services/auth/types.ts#L26) |
| method | `AuthService.requestPasswordReset` | [27](../../src/services/auth/types.ts#L27) |
| method | `AuthService.requestPasswordChangeCode` | [28](../../src/services/auth/types.ts#L28) |
| method | `AuthService.completePasswordRecovery` | [29](../../src/services/auth/types.ts#L29) |
| method | `AuthService.verifyPassword` | [30](../../src/services/auth/types.ts#L30) |
| method | `AuthService.updateUserPassword` | [31](../../src/services/auth/types.ts#L31) |
| method | `AuthService.updateUserEmail` | [32](../../src/services/auth/types.ts#L32) |
| method | `AuthService.accountDeletionStatus` | [33](../../src/services/auth/types.ts#L33) |
| method | `AuthService.deleteOwnAccount` | [34](../../src/services/auth/types.ts#L34) |
| method | `AuthService.completeCallback` | [38](../../src/services/auth/types.ts#L38) |
| method | `AuthService.onLifecycle` | [39](../../src/services/auth/types.ts#L39) |
| method | `AuthService.setRefreshActive` | [40](../../src/services/auth/types.ts#L40) |
| method | `AuthService.onChange` | [41](../../src/services/auth/types.ts#L41) |

### src/services/backend/backend.ts

[Volledige bron](../../src/services/backend/backend.ts), 635 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Backend` | [37](../../src/services/backend/backend.ts#L37) |
| function | `unwrap` | [45](../../src/services/backend/backend.ts#L45) |
| function | `required` | [50](../../src/services/backend/backend.ts#L50) |
| function | `optionalString` | [54](../../src/services/backend/backend.ts#L54) |
| type | `DbRow` | [57](../../src/services/backend/backend.ts#L57) |
| function | `createBackend` | [60](../../src/services/backend/backend.ts#L60) |
| function-variable | `createBackend.draftActor` | [91](../../src/services/backend/backend.ts#L91) |
| function | `createBackend.loadPostMedia` | [97](../../src/services/backend/backend.ts#L97) |
| function | `createBackend.hydrateFeed` | [151](../../src/services/backend/backend.ts#L151) |
| method | `createBackend.read` | [222](../../src/services/backend/backend.ts#L222) |
| method | `createBackend.rpc` | [254](../../src/services/backend/backend.ts#L254) |
| method | `createBackend.select` | [257](../../src/services/backend/backend.ts#L257) |
| method | `createBackend.upload` | [266](../../src/services/backend/backend.ts#L266) |
| method | `createBackend.remove` | [272](../../src/services/backend/backend.ts#L272) |
| method | `createBackend.signedUrl` | [276](../../src/services/backend/backend.ts#L276) |
| method | `createBackend.list` | [289](../../src/services/backend/backend.ts#L289) |
| method | `createBackend.get` | [292](../../src/services/backend/backend.ts#L292) |
| method | `createBackend.create` | [298](../../src/services/backend/backend.ts#L298) |
| method | `createBackend.join` | [320](../../src/services/backend/backend.ts#L320) |
| method | `createBackend.listMembers` | [330](../../src/services/backend/backend.ts#L330) |
| method | `createBackend.open` | [349](../../src/services/backend/backend.ts#L349) |
| method | `createBackend.listFeed` | [386](../../src/services/backend/backend.ts#L386) |
| method | `createBackend.createTextPost` | [392](../../src/services/backend/backend.ts#L392) |
| method | `createBackend.addComment` | [424](../../src/services/backend/backend.ts#L424) |
| method | `createBackend.toggleReaction` | [449](../../src/services/backend/backend.ts#L449) |
| method | `createBackend.listTasks` | [460](../../src/services/backend/backend.ts#L460) |
| method | `createBackend.createTask` | [487](../../src/services/backend/backend.ts#L487) |
| method | `createBackend.setTaskProgress` | [502](../../src/services/backend/backend.ts#L502) |
| method | `createBackend.update` | [514](../../src/services/backend/backend.ts#L514) |
| method | `createBackend.getMemberPermissions` | [532](../../src/services/backend/backend.ts#L532) |
| method | `createBackend.groupPushTarget` | [541](../../src/services/backend/backend.ts#L541) |
| method | `createBackend.loadGroupPushPreferences` | [550](../../src/services/backend/backend.ts#L550) |
| method | `createBackend.saveGroupPushPreferences` | [569](../../src/services/backend/backend.ts#L569) |
| method | `createBackend.loadGroupPreferences` | [577](../../src/services/backend/backend.ts#L577) |
| method | `createBackend.updateGroupPreferences` | [593](../../src/services/backend/backend.ts#L593) |
| method | `createBackend.registerPushDevice` | [612](../../src/services/backend/backend.ts#L612) |
| method | `createBackend.unregisterPushDevice` | [627](../../src/services/backend/backend.ts#L627) |

### src/services/backend/types.ts

[Volledige bron](../../src/services/backend/types.ts), 320 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `BackendConfig` | [5](../../src/services/backend/types.ts#L5) |
| type | `GroupPushPreferences` | [12](../../src/services/backend/types.ts#L12) |
| type | `NotificationPreferences` | [18](../../src/services/backend/types.ts#L18) |
| type | `PushDeviceInput` | [27](../../src/services/backend/types.ts#L27) |
| type | `NotificationService` | [38](../../src/services/backend/types.ts#L38) |
| method | `NotificationService.groupPushTarget` | [39](../../src/services/backend/types.ts#L39) |
| method | `NotificationService.loadGroupPushPreferences` | [40](../../src/services/backend/types.ts#L40) |
| method | `NotificationService.saveGroupPushPreferences` | [41](../../src/services/backend/types.ts#L41) |
| method | `NotificationService.loadGroupPreferences` | [42](../../src/services/backend/types.ts#L42) |
| method | `NotificationService.updateGroupPreferences` | [43](../../src/services/backend/types.ts#L43) |
| method | `NotificationService.registerPushDevice` | [49](../../src/services/backend/types.ts#L49) |
| method | `NotificationService.unregisterPushDevice` | [50](../../src/services/backend/types.ts#L50) |
| type | `Group` | [53](../../src/services/backend/types.ts#L53) |
| type | `GroupMemberPermissions` | [73](../../src/services/backend/types.ts#L73) |
| type | `GroupMember` | [80](../../src/services/backend/types.ts#L80) |
| type | `GroupComment` | [89](../../src/services/backend/types.ts#L89) |
| type | `GroupFeedPost` | [98](../../src/services/backend/types.ts#L98) |
| type | `GroupFeedCursor` | [117](../../src/services/backend/types.ts#L117) |
| type | `GroupFeedRequest` | [118](../../src/services/backend/types.ts#L118) |
| type | `GroupFeedPage` | [119](../../src/services/backend/types.ts#L119) |
| type | `GroupFeedConnection` | [124](../../src/services/backend/types.ts#L124) |
| type | `GroupFeedService` | [125](../../src/services/backend/types.ts#L125) |
| method | `GroupFeedService.listFeedPage` | [126](../../src/services/backend/types.ts#L126) |
| method | `GroupFeedService.subscribeFeed` | [128](../../src/services/backend/types.ts#L128) |
| type | `GroupTask` | [134](../../src/services/backend/types.ts#L134) |
| type | `GroupTaskInput` | [155](../../src/services/backend/types.ts#L155) |
| type | `GroupUpdateInput` | [164](../../src/services/backend/types.ts#L164) |
| type | `GroupService` | [175](../../src/services/backend/types.ts#L175) |
| method | `GroupService.list` | [179](../../src/services/backend/types.ts#L179) |
| method | `GroupService.get` | [180](../../src/services/backend/types.ts#L180) |
| method | `GroupService.create` | [181](../../src/services/backend/types.ts#L181) |
| method | `GroupService.join` | [192](../../src/services/backend/types.ts#L192) |
| method | `GroupService.listMembers` | [193](../../src/services/backend/types.ts#L193) |
| method | `GroupService.listFeed` | [194](../../src/services/backend/types.ts#L194) |
| method | `GroupService.createTextPost` | [195](../../src/services/backend/types.ts#L195) |
| method | `GroupService.addComment` | [201](../../src/services/backend/types.ts#L201) |
| method | `GroupService.toggleReaction` | [208](../../src/services/backend/types.ts#L208) |
| method | `GroupService.listTasks` | [209](../../src/services/backend/types.ts#L209) |
| method | `GroupService.createTask` | [210](../../src/services/backend/types.ts#L210) |
| method | `GroupService.setTaskProgress` | [211](../../src/services/backend/types.ts#L211) |
| method | `GroupService.update` | [212](../../src/services/backend/types.ts#L212) |
| method | `GroupService.getMemberPermissions` | [213](../../src/services/backend/types.ts#L213) |
| type | `Note` | [216](../../src/services/backend/types.ts#L216) |
| type | `PlanItem` | [242](../../src/services/backend/types.ts#L242) |
| type | `ProgressRow` | [258](../../src/services/backend/types.ts#L258) |
| type | `NotesService` | [272](../../src/services/backend/types.ts#L272) |
| method | `NotesService.list` | [273](../../src/services/backend/types.ts#L273) |
| method | `NotesService.save` | [274](../../src/services/backend/types.ts#L274) |
| method | `NotesService.delete` | [275](../../src/services/backend/types.ts#L275) |
| type | `PlanningService` | [277](../../src/services/backend/types.ts#L277) |
| method | `PlanningService.list` | [278](../../src/services/backend/types.ts#L278) |
| method | `PlanningService.add` | [279](../../src/services/backend/types.ts#L279) |
| method | `PlanningService.toggleDone` | [280](../../src/services/backend/types.ts#L280) |
| method | `PlanningService.delete` | [281](../../src/services/backend/types.ts#L281) |
| type | `ProgressService` | [283](../../src/services/backend/types.ts#L283) |
| method | `ProgressService.list` | [284](../../src/services/backend/types.ts#L284) |
| method | `ProgressService.checkIn` | [285](../../src/services/backend/types.ts#L285) |
| method | `ProgressService.updateHifz` | [291](../../src/services/backend/types.ts#L291) |
| type | `AudioTrack` | [294](../../src/services/backend/types.ts#L294) |
| type | `AyahTiming` | [312](../../src/services/backend/types.ts#L312) |
| type | `AudioService` | [313](../../src/services/backend/types.ts#L313) |
| method | `AudioService.listSurah` | [314](../../src/services/backend/types.ts#L314) |
| method | `AudioService.getAyahTimings` | [315](../../src/services/backend/types.ts#L315) |
| method | `AudioService.resolve` | [316](../../src/services/backend/types.ts#L316) |
| method | `AudioService.getDownloadedUri` | [317](../../src/services/backend/types.ts#L317) |
| method | `AudioService.download` | [318](../../src/services/backend/types.ts#L318) |

### src/services/groups/draftActor.ts

[Volledige bron](../../src/services/groups/draftActor.ts), 23 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `DraftSession` | [1](../../src/services/groups/draftActor.ts#L1) |
| function | `captureDraftActor` | [7](../../src/services/groups/draftActor.ts#L7) |

### src/services/groups/feedSnapshots.ts

[Volledige bron](../../src/services/groups/feedSnapshots.ts), 39 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `sameValue` | [4](../../src/services/groups/feedSnapshots.ts#L4) |
| function | `reconcileFeedPosts` | [24](../../src/services/groups/feedSnapshots.ts#L24) |
| function | `sameFeedCursor` | [36](../../src/services/groups/feedSnapshots.ts#L36) |

### src/services/groups/groupChat.ts

[Volledige bron](../../src/services/groups/groupChat.ts), 122 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `GroupChatRequest` | [10](../../src/services/groups/groupChat.ts#L10) |
| type | `GroupChatService` | [12](../../src/services/groups/groupChat.ts#L12) |
| method | `GroupChatService.listChatPage` | [13](../../src/services/groups/groupChat.ts#L13) |
| method | `GroupChatService.sendChatMessage` | [15](../../src/services/groups/groupChat.ts#L15) |
| type | `ChatPort` | [17](../../src/services/groups/groupChat.ts#L17) |
| method | `ChatPort.send` | [19](../../src/services/groups/groupChat.ts#L19) |
| function | `createGroupChatService` | [22](../../src/services/groups/groupChat.ts#L22) |
| method | `createGroupChatService.listChatPage` | [24](../../src/services/groups/groupChat.ts#L24) |
| method | `createGroupChatService.sendChatMessage` | [51](../../src/services/groups/groupChat.ts#L51) |
| function | `chatFeedService` | [63](../../src/services/groups/groupChat.ts#L63) |
| class | `GroupChatScroll` | [71](../../src/services/groups/groupChat.ts#L71) |
| method | `GroupChatScroll.beginHistory` | [78](../../src/services/groups/groupChat.ts#L78) |
| method | `GroupChatScroll.setOffset` | [83](../../src/services/groups/groupChat.ts#L83) |
| method | `GroupChatScroll.showLatest` | [92](../../src/services/groups/groupChat.ts#L92) |
| method | `GroupChatScroll.takeScroll` | [99](../../src/services/groups/groupChat.ts#L99) |
| method | `GroupChatScroll.observe` | [104](../../src/services/groups/groupChat.ts#L104) |

### src/services/groups/groupDrafts.ts

[Volledige bron](../../src/services/groups/groupDrafts.ts), 73 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `DraftStatus` | [1](../../src/services/groups/groupDrafts.ts#L1) |
| type | `GroupDraft` | [2](../../src/services/groups/groupDrafts.ts#L2) |
| type | `GroupDraftState` | [3](../../src/services/groups/groupDrafts.ts#L3) |
| function-variable | `empty` | [4](../../src/services/groups/groupDrafts.ts#L4) |
| class | `GroupDraftStore` | [7](../../src/services/groups/groupDrafts.ts#L7) |
| method | `GroupDraftStore.draft` | [16](../../src/services/groups/groupDrafts.ts#L16) |
| method | `GroupDraftStore.update` | [19](../../src/services/groups/groupDrafts.ts#L19) |
| method | `GroupDraftStore.set` | [25](../../src/services/groups/groupDrafts.ts#L25) |
| method | `GroupDraftStore.send` | [31](../../src/services/groups/groupDrafts.ts#L31) |
| function | `groupDrafts` | [57](../../src/services/groups/groupDrafts.ts#L57) |
| function | `groupChatDrafts` | [61](../../src/services/groups/groupDrafts.ts#L61) |
| function | `scopedDrafts` | [64](../../src/services/groups/groupDrafts.ts#L64) |

### src/services/groups/groupErrors.ts

[Volledige bron](../../src/services/groups/groupErrors.ts), 80 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `groupErrorKey` | [2](../../src/services/groups/groupErrors.ts#L2) |
| function | `requiresGroupAccessRequest` | [63](../../src/services/groups/groupErrors.ts#L63) |

### src/services/groups/groupFeedController.ts

[Volledige bron](../../src/services/groups/groupFeedController.ts), 244 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `FeedState` | [9](../../src/services/groups/groupFeedController.ts#L9) |
| type | `FeedClock` | [17](../../src/services/groups/groupFeedController.ts#L17) |
| method | `FeedClock.every` | [17](../../src/services/groups/groupFeedController.ts#L17) |
| method | `every` | [19](../../src/services/groups/groupFeedController.ts#L19) |
| function | `mergeFeedPosts` | [25](../../src/services/groups/groupFeedController.ts#L25) |
| class | `GroupFeedController` | [35](../../src/services/groups/groupFeedController.ts#L35) |
| method | `GroupFeedController.update` | [70](../../src/services/groups/groupFeedController.ts#L70) |
| method | `GroupFeedController.setPosts` | [84](../../src/services/groups/groupFeedController.ts#L84) |
| function-variable | `GroupFeedController.current` | [99](../../src/services/groups/groupFeedController.ts#L99) |
| method | `GroupFeedController.requestRefresh` | [138](../../src/services/groups/groupFeedController.ts#L138) |
| method | `GroupFeedController.drain` | [147](../../src/services/groups/groupFeedController.ts#L147) |
| method | `GroupFeedController.read` | [174](../../src/services/groups/groupFeedController.ts#L174) |
| function-variable | `GroupFeedController.read.current` | [175](../../src/services/groups/groupFeedController.ts#L175) |
| function-variable | `GroupFeedController.read.changedLocally` | [177](../../src/services/groups/groupFeedController.ts#L177) |

### src/services/groups/groupFeedReader.ts

[Volledige bron](../../src/services/groups/groupFeedReader.ts), 59 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `FeedRow` | [8](../../src/services/groups/groupFeedReader.ts#L8) |
| type | `FeedQuery` | [9](../../src/services/groups/groupFeedReader.ts#L9) |
| type | `GroupFeedReadPort` | [18](../../src/services/groups/groupFeedReader.ts#L18) |
| method | `GroupFeedReadPort.groupId` | [19](../../src/services/groups/groupFeedReader.ts#L19) |
| method | `GroupFeedReadPort.read` | [21](../../src/services/groups/groupFeedReader.ts#L21) |
| method | `GroupFeedReadPort.hydrate` | [22](../../src/services/groups/groupFeedReader.ts#L22) |
| function | `feedCursorFilter` | [26](../../src/services/groups/groupFeedReader.ts#L26) |
| function | `createGroupFeedReader` | [36](../../src/services/groups/groupFeedReader.ts#L36) |

### src/services/groups/groupFeedSubscription.ts

[Volledige bron](../../src/services/groups/groupFeedSubscription.ts), 42 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `GroupFeedSubscriptionPort` | [3](../../src/services/groups/groupFeedSubscription.ts#L3) |
| method | `GroupFeedSubscriptionPort.groupId` | [4](../../src/services/groups/groupFeedSubscription.ts#L4) |
| method | `GroupFeedSubscriptionPort.open` | [5](../../src/services/groups/groupFeedSubscription.ts#L5) |
| function | `createGroupFeedSubscription` | [13](../../src/services/groups/groupFeedSubscription.ts#L13) |

### src/services/groups/groupJoin.ts

[Volledige bron](../../src/services/groups/groupJoin.ts), 105 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `GroupJoinTarget` | [1](../../src/services/groups/groupJoin.ts#L1) |
| type | `GroupJoinStorage` | [2](../../src/services/groups/groupJoin.ts#L2) |
| method | `GroupJoinStorage.getItem` | [3](../../src/services/groups/groupJoin.ts#L3) |
| method | `GroupJoinStorage.setItem` | [4](../../src/services/groups/groupJoin.ts#L4) |
| method | `GroupJoinStorage.removeItem` | [5](../../src/services/groups/groupJoin.ts#L5) |
| function-variable | `validCode` | [7](../../src/services/groups/groupJoin.ts#L7) |
| function | `parseGroupJoinInput` | [9](../../src/services/groups/groupJoin.ts#L9) |
| function | `groupJoinUrl` | [45](../../src/services/groups/groupJoin.ts#L45) |
| function | `groupShareUrl` | [49](../../src/services/groups/groupJoin.ts#L49) |
| function | `buildGroupCode` | [61](../../src/services/groups/groupJoin.ts#L61) |
| function | `createPendingGroupStore` | [73](../../src/services/groups/groupJoin.ts#L73) |
| function-variable | `createPendingGroupStore.serial` | [76](../../src/services/groups/groupJoin.ts#L76) |
| function-variable | `createPendingGroupStore.read` | [81](../../src/services/groups/groupJoin.ts#L81) |

### src/services/groups/groupJoinCapture.ts

[Volledige bron](../../src/services/groups/groupJoinCapture.ts), 21 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `capture` | [5](../../src/services/groups/groupJoinCapture.ts#L5) |

### src/services/groups/groupMetrics.ts

[Volledige bron](../../src/services/groups/groupMetrics.ts), 138 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `groupAyahEquivalent` | [6](../../src/services/groups/groupMetrics.ts#L6) |
| function | `daysAgo` | [15](../../src/services/groups/groupMetrics.ts#L15) |
| function | `groupLeaderboard` | [20](../../src/services/groups/groupMetrics.ts#L20) |
| function-variable | `groupLeaderboard.clamp` | [44](../../src/services/groups/groupMetrics.ts#L44) |
| function-variable | `groupLeaderboard.period` | [45](../../src/services/groups/groupMetrics.ts#L45) |
| function | `groupReadingTotals` | [69](../../src/services/groups/groupMetrics.ts#L69) |
| function-variable | `groupReadingTotals.total` | [70](../../src/services/groups/groupMetrics.ts#L70) |
| function | `groupDashboard` | [86](../../src/services/groups/groupMetrics.ts#L86) |
| function-variable | `groupDashboard.best` | [88](../../src/services/groups/groupMetrics.ts#L88) |
| function | `groupGoalProgress` | [108](../../src/services/groups/groupMetrics.ts#L108) |

### src/services/groups/groupOperations.ts

[Volledige bron](../../src/services/groups/groupOperations.ts), 326 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `single` | [22](../../src/services/groups/groupOperations.ts#L22) |
| function-variable | `text` | [27](../../src/services/groups/groupOperations.ts#L27) |
| function-variable | `integer` | [32](../../src/services/groups/groupOperations.ts#L32) |
| function-variable | `imageExtension` | [37](../../src/services/groups/groupOperations.ts#L37) |
| function-variable | `checkUpload` | [48](../../src/services/groups/groupOperations.ts#L48) |
| function | `createGroupOperations` | [54](../../src/services/groups/groupOperations.ts#L54) |
| function-variable | `createGroupOperations.scoped` | [55](../../src/services/groups/groupOperations.ts#L55) |
| function-variable | `createGroupOperations.userId` | [63](../../src/services/groups/groupOperations.ts#L63) |
| function-variable | `createGroupOperations.mediaWithUrl` | [68](../../src/services/groups/groupOperations.ts#L68) |
| function-variable | `createGroupOperations.postAfter` | [72](../../src/services/groups/groupOperations.ts#L72) |
| method | `createGroupOperations.deleteGroup` | [74](../../src/services/groups/groupOperations.ts#L74) |
| method | `createGroupOperations.setMemberRole` | [78](../../src/services/groups/groupOperations.ts#L78) |
| method | `createGroupOperations.removeMember` | [81](../../src/services/groups/groupOperations.ts#L81) |
| method | `createGroupOperations.getMyProfile` | [84](../../src/services/groups/groupOperations.ts#L84) |
| method | `createGroupOperations.updateMyProfile` | [87](../../src/services/groups/groupOperations.ts#L87) |
| method | `createGroupOperations.uploadProfileAvatar` | [95](../../src/services/groups/groupOperations.ts#L95) |
| method | `createGroupOperations.getLogo` | [103](../../src/services/groups/groupOperations.ts#L103) |
| method | `createGroupOperations.setLogo` | [112](../../src/services/groups/groupOperations.ts#L112) |
| method | `createGroupOperations.createInvitation` | [125](../../src/services/groups/groupOperations.ts#L125) |
| method | `createGroupOperations.revokeInvitation` | [135](../../src/services/groups/groupOperations.ts#L135) |
| method | `createGroupOperations.acceptInvitation` | [138](../../src/services/groups/groupOperations.ts#L138) |
| method | `createGroupOperations.requestAccess` | [146](../../src/services/groups/groupOperations.ts#L146) |
| method | `createGroupOperations.reviewJoinRequest` | [153](../../src/services/groups/groupOperations.ts#L153) |
| method | `createGroupOperations.listMedia` | [156](../../src/services/groups/groupOperations.ts#L156) |
| method | `createGroupOperations.uploadMedia` | [166](../../src/services/groups/groupOperations.ts#L166) |
| method | `createGroupOperations.deleteMedia` | [197](../../src/services/groups/groupOperations.ts#L197) |
| method | `createGroupOperations.createEvent` | [202](../../src/services/groups/groupOperations.ts#L202) |
| method | `createGroupOperations.respondToEvent` | [216](../../src/services/groups/groupOperations.ts#L216) |
| method | `createGroupOperations.setEventStatus` | [219](../../src/services/groups/groupOperations.ts#L219) |
| method | `createGroupOperations.setTaskStatus` | [222](../../src/services/groups/groupOperations.ts#L222) |
| method | `createGroupOperations.getRules` | [225](../../src/services/groups/groupOperations.ts#L225) |
| method | `createGroupOperations.publishRules` | [229](../../src/services/groups/groupOperations.ts#L229) |
| method | `createGroupOperations.reviewReport` | [262](../../src/services/groups/groupOperations.ts#L262) |
| method | `createGroupOperations.recordProgress` | [274](../../src/services/groups/groupOperations.ts#L274) |
| method | `createGroupOperations.listLeaderboard` | [291](../../src/services/groups/groupOperations.ts#L291) |
| method | `createGroupOperations.updatePost` | [300](../../src/services/groups/groupOperations.ts#L300) |
| method | `createGroupOperations.pinPost` | [307](../../src/services/groups/groupOperations.ts#L307) |
| method | `createGroupOperations.deletePost` | [311](../../src/services/groups/groupOperations.ts#L311) |
| method | `createGroupOperations.deleteComment` | [314](../../src/services/groups/groupOperations.ts#L314) |
| method | `createGroupOperations.reportPost` | [317](../../src/services/groups/groupOperations.ts#L317) |

### src/services/groups/groupProgress.ts

[Volledige bron](../../src/services/groups/groupProgress.ts), 33 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `canShareGroupProgress` | [3](../../src/services/groups/groupProgress.ts#L3) |
| function | `groupProgressInput` | [10](../../src/services/groups/groupProgress.ts#L10) |

### src/services/groups/groupProgressReader.ts

[Volledige bron](../../src/services/groups/groupProgressReader.ts), 53 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ProgressRecord` | [3](../../src/services/groups/groupProgressReader.ts#L3) |
| type | `ReadResult` | [4](../../src/services/groups/groupProgressReader.ts#L4) |
| type | `GroupProgressQuery` | [8](../../src/services/groups/groupProgressReader.ts#L8) |
| method | `GroupProgressQuery.eq` | [9](../../src/services/groups/groupProgressReader.ts#L9) |
| method | `GroupProgressQuery.order` | [10](../../src/services/groups/groupProgressReader.ts#L10) |
| method | `GroupProgressQuery.gt` | [11](../../src/services/groups/groupProgressReader.ts#L11) |
| method | `GroupProgressQuery.limit` | [12](../../src/services/groups/groupProgressReader.ts#L12) |
| type | `GroupProgressClient` | [14](../../src/services/groups/groupProgressReader.ts#L14) |
| method | `GroupProgressClient.from` | [16](../../src/services/groups/groupProgressReader.ts#L16) |
| function-variable | `validId` | [20](../../src/services/groups/groupProgressReader.ts#L20) |
| function | `readGroupProgressEntries` | [23](../../src/services/groups/groupProgressReader.ts#L23) |
| method | `readGroupProgressEntries.select` | [31](../../src/services/groups/groupProgressReader.ts#L31) |

### src/services/groups/groupReading.ts

[Volledige bron](../../src/services/groups/groupReading.ts), 48 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ReadingPoint` | [5](../../src/services/groups/groupReading.ts#L5) |
| function | `groupReadingReference` | [6](../../src/services/groups/groupReading.ts#L6) |
| function | `groupReadingBounds` | [21](../../src/services/groups/groupReading.ts#L21) |
| function | `groupReadingNumber` | [38](../../src/services/groups/groupReading.ts#L38) |
| function | `groupReadingPointLabel` | [44](../../src/services/groups/groupReading.ts#L44) |

### src/services/groups/groupTypes.ts

[Volledige bron](../../src/services/groups/groupTypes.ts), 245 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `GroupRole` | [3](../../src/services/groups/groupTypes.ts#L3) |
| type | `GroupInvitation` | [4](../../src/services/groups/groupTypes.ts#L4) |
| type | `GroupJoinRequest` | [14](../../src/services/groups/groupTypes.ts#L14) |
| type | `GroupProfile` | [24](../../src/services/groups/groupTypes.ts#L24) |
| type | `GroupMedia` | [31](../../src/services/groups/groupTypes.ts#L31) |
| type | `GroupUpload` | [49](../../src/services/groups/groupTypes.ts#L49) |
| type | `GroupEvent` | [57](../../src/services/groups/groupTypes.ts#L57) |
| type | `GroupEventInput` | [75](../../src/services/groups/groupTypes.ts#L75) |
| type | `GroupRule` | [83](../../src/services/groups/groupTypes.ts#L83) |
| type | `GroupNotice` | [91](../../src/services/groups/groupTypes.ts#L91) |
| type | `GroupReport` | [101](../../src/services/groups/groupTypes.ts#L101) |
| type | `GroupAuditEntry` | [117](../../src/services/groups/groupTypes.ts#L117) |
| type | `GroupProgressEntry` | [127](../../src/services/groups/groupTypes.ts#L127) |
| type | `GroupPointTotal` | [134](../../src/services/groups/groupTypes.ts#L134) |
| type | `GroupLeaderboardRow` | [140](../../src/services/groups/groupTypes.ts#L140) |
| type | `GroupCursor` | [153](../../src/services/groups/groupTypes.ts#L153) |
| type | `GroupOperations` | [155](../../src/services/groups/groupTypes.ts#L155) |
| method | `GroupOperations.deleteGroup` | [156](../../src/services/groups/groupTypes.ts#L156) |
| method | `GroupOperations.listRoles` | [157](../../src/services/groups/groupTypes.ts#L157) |
| method | `GroupOperations.setMemberRole` | [158](../../src/services/groups/groupTypes.ts#L158) |
| method | `GroupOperations.removeMember` | [159](../../src/services/groups/groupTypes.ts#L159) |
| method | `GroupOperations.getMyProfile` | [160](../../src/services/groups/groupTypes.ts#L160) |
| method | `GroupOperations.updateMyProfile` | [161](../../src/services/groups/groupTypes.ts#L161) |
| method | `GroupOperations.uploadProfileAvatar` | [166](../../src/services/groups/groupTypes.ts#L166) |
| method | `GroupOperations.getLogo` | [167](../../src/services/groups/groupTypes.ts#L167) |
| method | `GroupOperations.setLogo` | [168](../../src/services/groups/groupTypes.ts#L168) |
| method | `GroupOperations.createInvitation` | [169](../../src/services/groups/groupTypes.ts#L169) |
| method | `GroupOperations.listInvitations` | [175](../../src/services/groups/groupTypes.ts#L175) |
| method | `GroupOperations.revokeInvitation` | [176](../../src/services/groups/groupTypes.ts#L176) |
| method | `GroupOperations.acceptInvitation` | [177](../../src/services/groups/groupTypes.ts#L177) |
| method | `GroupOperations.requestAccess` | [178](../../src/services/groups/groupTypes.ts#L178) |
| method | `GroupOperations.listJoinRequests` | [179](../../src/services/groups/groupTypes.ts#L179) |
| method | `GroupOperations.reviewJoinRequest` | [180](../../src/services/groups/groupTypes.ts#L180) |
| method | `GroupOperations.listMedia` | [181](../../src/services/groups/groupTypes.ts#L181) |
| method | `GroupOperations.uploadMedia` | [182](../../src/services/groups/groupTypes.ts#L182) |
| method | `GroupOperations.deleteMedia` | [183](../../src/services/groups/groupTypes.ts#L183) |
| method | `GroupOperations.listEvents` | [184](../../src/services/groups/groupTypes.ts#L184) |
| method | `GroupOperations.createEvent` | [185](../../src/services/groups/groupTypes.ts#L185) |
| method | `GroupOperations.respondToEvent` | [186](../../src/services/groups/groupTypes.ts#L186) |
| method | `GroupOperations.setEventStatus` | [191](../../src/services/groups/groupTypes.ts#L191) |
| method | `GroupOperations.setTaskStatus` | [196](../../src/services/groups/groupTypes.ts#L196) |
| method | `GroupOperations.getRules` | [201](../../src/services/groups/groupTypes.ts#L201) |
| method | `GroupOperations.publishRules` | [202](../../src/services/groups/groupTypes.ts#L202) |
| method | `GroupOperations.listNotices` | [203](../../src/services/groups/groupTypes.ts#L203) |
| method | `GroupOperations.markNoticeRead` | [204](../../src/services/groups/groupTypes.ts#L204) |
| method | `GroupOperations.sendNotice` | [205](../../src/services/groups/groupTypes.ts#L205) |
| method | `GroupOperations.listReports` | [206](../../src/services/groups/groupTypes.ts#L206) |
| method | `GroupOperations.reviewReport` | [207](../../src/services/groups/groupTypes.ts#L207) |
| method | `GroupOperations.listAudit` | [208](../../src/services/groups/groupTypes.ts#L208) |
| method | `GroupOperations.recordProgress` | [209](../../src/services/groups/groupTypes.ts#L209) |
| method | `GroupOperations.listLeaderboard` | [217](../../src/services/groups/groupTypes.ts#L217) |
| method | `GroupOperations.updatePost` | [218](../../src/services/groups/groupTypes.ts#L218) |
| method | `GroupOperations.pinPost` | [219](../../src/services/groups/groupTypes.ts#L219) |
| method | `GroupOperations.deletePost` | [220](../../src/services/groups/groupTypes.ts#L220) |
| method | `GroupOperations.deleteComment` | [221](../../src/services/groups/groupTypes.ts#L221) |
| method | `GroupOperations.reportPost` | [222](../../src/services/groups/groupTypes.ts#L222) |
| type | `GroupOperationPort` | [226](../../src/services/groups/groupTypes.ts#L226) |
| method | `GroupOperationPort.rpc` | [227](../../src/services/groups/groupTypes.ts#L227) |
| method | `GroupOperationPort.select` | [228](../../src/services/groups/groupTypes.ts#L228) |
| method | `GroupOperationPort.userId` | [229](../../src/services/groups/groupTypes.ts#L229) |
| method | `GroupOperationPort.group` | [230](../../src/services/groups/groupTypes.ts#L230) |
| method | `GroupOperationPort.members` | [231](../../src/services/groups/groupTypes.ts#L231) |
| method | `GroupOperationPort.feed` | [232](../../src/services/groups/groupTypes.ts#L232) |
| method | `GroupOperationPort.upload` | [233](../../src/services/groups/groupTypes.ts#L233) |
| method | `GroupOperationPort.remove` | [240](../../src/services/groups/groupTypes.ts#L240) |
| method | `GroupOperationPort.signedUrl` | [241](../../src/services/groups/groupTypes.ts#L241) |
| method | `GroupOperationPort.publicUrl` | [242](../../src/services/groups/groupTypes.ts#L242) |
| method | `GroupOperationPort.uuid` | [243](../../src/services/groups/groupTypes.ts#L243) |

### src/services/groups/groupTyping.ts

[Volledige bron](../../src/services/groups/groupTyping.ts), 160 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `GroupTypingParticipant` | [2](../../src/services/groups/groupTyping.ts#L2) |
| type | `GroupTypingSignal` | [3](../../src/services/groups/groupTyping.ts#L3) |
| type | `GroupTypingTransport` | [8](../../src/services/groups/groupTyping.ts#L8) |
| method | `GroupTypingTransport.publish` | [9](../../src/services/groups/groupTyping.ts#L9) |
| method | `GroupTypingTransport.close` | [10](../../src/services/groups/groupTyping.ts#L10) |
| type | `GroupTypingService` | [12](../../src/services/groups/groupTyping.ts#L12) |
| method | `GroupTypingService.connectTyping` | [13](../../src/services/groups/groupTyping.ts#L13) |
| type | `GroupTypingScope` | [20](../../src/services/groups/groupTyping.ts#L20) |
| type | `GroupTypingPort` | [26](../../src/services/groups/groupTyping.ts#L26) |
| method | `GroupTypingPort.resolve` | [27](../../src/services/groups/groupTyping.ts#L27) |
| method | `GroupTypingPort.open` | [28](../../src/services/groups/groupTyping.ts#L28) |
| method | `GroupTypingPort.publish` | [34](../../src/services/groups/groupTyping.ts#L34) |
| method | `GroupTypingPort.onActorChange` | [35](../../src/services/groups/groupTyping.ts#L35) |
| function | `createGroupTypingService` | [39](../../src/services/groups/groupTyping.ts#L39) |
| method | `createGroupTypingService.connectTyping` | [41](../../src/services/groups/groupTyping.ts#L41) |
| function-variable | `createGroupTypingService.connectTyping.publish` | [52](../../src/services/groups/groupTyping.ts#L52) |
| function-variable | `createGroupTypingService.connectTyping.close` | [78](../../src/services/groups/groupTyping.ts#L78) |
| function-variable | `createGroupTypingService.connectTyping.refresh` | [94](../../src/services/groups/groupTyping.ts#L94) |

### src/services/groups/groupTypingController.ts

[Volledige bron](../../src/services/groups/groupTypingController.ts), 167 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Clock` | [11](../../src/services/groups/groupTypingController.ts#L11) |
| method | `Clock.now` | [12](../../src/services/groups/groupTypingController.ts#L12) |
| method | `Clock.every` | [13](../../src/services/groups/groupTypingController.ts#L13) |
| method | `every` | [17](../../src/services/groups/groupTypingController.ts#L17) |
| class | `GroupTypingController` | [25](../../src/services/groups/groupTypingController.ts#L25) |
| method | `GroupTypingController.update` | [52](../../src/services/groups/groupTypingController.ts#L52) |
| method | `GroupTypingController.receive` | [68](../../src/services/groups/groupTypingController.ts#L68) |
| method | `GroupTypingController.start` | [88](../../src/services/groups/groupTypingController.ts#L88) |
| method | `GroupTypingController.stop` | [109](../../src/services/groups/groupTypingController.ts#L109) |
| method | `GroupTypingController.setCanSend` | [122](../../src/services/groups/groupTypingController.ts#L122) |
| method | `GroupTypingController.publish` | [146](../../src/services/groups/groupTypingController.ts#L146) |
| method | `GroupTypingController.tick` | [152](../../src/services/groups/groupTypingController.ts#L152) |

### src/services/groups/groupTypingSupabase.ts

[Volledige bron](../../src/services/groups/groupTypingSupabase.ts), 92 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `createSupabaseGroupTyping` | [8](../../src/services/groups/groupTypingSupabase.ts#L8) |
| function-variable | `createSupabaseGroupTyping.actor` | [13](../../src/services/groups/groupTypingSupabase.ts#L13) |
| method | `createSupabaseGroupTyping.resolve` | [20](../../src/services/groups/groupTypingSupabase.ts#L20) |
| method | `createSupabaseGroupTyping.open` | [59](../../src/services/groups/groupTypingSupabase.ts#L59) |
| method | `createSupabaseGroupTyping.publish` | [78](../../src/services/groups/groupTypingSupabase.ts#L78) |
| method | `createSupabaseGroupTyping.onActorChange` | [85](../../src/services/groups/groupTypingSupabase.ts#L85) |

### src/services/groups/pendingGroup.ts

[Volledige bron](../../src/services/groups/pendingGroup.ts), 6 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/lexicon/laneDictionary.ts

[Volledige bron](../../src/services/lexicon/laneDictionary.ts), 69 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `createLaneDictionary` | [16](../../src/services/lexicon/laneDictionary.ts#L16) |
| method | `createLaneDictionary.lookupDefinitions` | [18](../../src/services/lexicon/laneDictionary.ts#L18) |
| function | `getLaneDictionary` | [50](../../src/services/lexicon/laneDictionary.ts#L50) |

### src/services/lexicon/lexicon.ts

[Volledige bron](../../src/services/lexicon/lexicon.ts), 67 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `configureLexicalDefinitionProvider` | [16](../../src/services/lexicon/lexicon.ts#L16) |
| function | `enrich` | [22](../../src/services/lexicon/lexicon.ts#L22) |
| function | `lookupLexiconWord` | [38](../../src/services/lexicon/lexicon.ts#L38) |
| function | `lookupLexiconRoot` | [42](../../src/services/lexicon/lexicon.ts#L42) |
| function | `lookupLexiconLemma` | [46](../../src/services/lexicon/lexicon.ts#L46) |
| function | `searchLexiconRoots` | [50](../../src/services/lexicon/lexicon.ts#L50) |
| function | `searchLexiconLemmas` | [54](../../src/services/lexicon/lexicon.ts#L54) |
| function | `verifyLexiconWord` | [58](../../src/services/lexicon/lexicon.ts#L58) |

### src/services/lexicon/lexiconDatabase.ts

[Volledige bron](../../src/services/lexicon/lexiconDatabase.ts), 34 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `getLexiconRepository` | [12](../../src/services/lexicon/lexiconDatabase.ts#L12) |

### src/services/lexicon/lexiconNormalization.ts

[Volledige bron](../../src/services/lexicon/lexiconNormalization.ts), 9 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `normalizeLexiconText` | [2](../../src/services/lexicon/lexiconNormalization.ts#L2) |

### src/services/lexicon/lexiconRepository.ts

[Volledige bron](../../src/services/lexicon/lexiconRepository.ts), 286 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LexiconBinding` | [13](../../src/services/lexicon/lexiconRepository.ts#L13) |
| type | `LexiconReadPort` | [14](../../src/services/lexicon/lexiconRepository.ts#L14) |
| type | `WordRow` | [17](../../src/services/lexicon/lexiconRepository.ts#L17) |
| type | `Selection` | [28](../../src/services/lexicon/lexiconRepository.ts#L28) |
| function-variable | `canonicalRoot` | [30](../../src/services/lexicon/lexiconRepository.ts#L30) |
| function | `validLexiconReference` | [35](../../src/services/lexicon/lexiconRepository.ts#L35) |
| function | `createLexiconRepository` | [46](../../src/services/lexicon/lexiconRepository.ts#L46) |
| function | `createLexiconRepository.sources` | [48](../../src/services/lexicon/lexiconRepository.ts#L48) |
| function | `createLexiconRepository.wordAt` | [84](../../src/services/lexicon/lexiconRepository.ts#L84) |
| function | `createLexiconRepository.identifiers` | [96](../../src/services/lexicon/lexiconRepository.ts#L96) |
| function | `createLexiconRepository.matchingSelection` | [107](../../src/services/lexicon/lexiconRepository.ts#L107) |
| function | `createLexiconRepository.makeEntry` | [116](../../src/services/lexicon/lexiconRepository.ts#L116) |
| function | `createLexiconRepository.entryForWord` | [185](../../src/services/lexicon/lexiconRepository.ts#L185) |
| method | `createLexiconRepository.lookupLexiconWord` | [207](../../src/services/lexicon/lexiconRepository.ts#L207) |
| method | `createLexiconRepository.lookupLexiconRoot` | [211](../../src/services/lexicon/lexiconRepository.ts#L211) |
| method | `createLexiconRepository.lookupLexiconLemma` | [223](../../src/services/lexicon/lexiconRepository.ts#L223) |
| method | `createLexiconRepository.searchLexiconRoots` | [235](../../src/services/lexicon/lexiconRepository.ts#L235) |
| method | `createLexiconRepository.searchLexiconLemmas` | [255](../../src/services/lexicon/lexiconRepository.ts#L255) |
| method | `createLexiconRepository.verifyLexiconWord` | [268](../../src/services/lexicon/lexiconRepository.ts#L268) |
| type | `LexiconRepository` | [285](../../src/services/lexicon/lexiconRepository.ts#L285) |

### src/services/lexicon/lexiconTypes.ts

[Volledige bron](../../src/services/lexicon/lexiconTypes.ts), 55 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LexiconReference` | [1](../../src/services/lexicon/lexiconTypes.ts#L1) |
| type | `LexiconSource` | [2](../../src/services/lexicon/lexiconTypes.ts#L2) |
| type | `LexiconIdentifier` | [10](../../src/services/lexicon/lexiconTypes.ts#L10) |
| type | `LexiconOccurrence` | [11](../../src/services/lexicon/lexiconTypes.ts#L11) |
| type | `LexicalDefinition` | [12](../../src/services/lexicon/lexiconTypes.ts#L12) |
| type | `LexicalDefinitionProvider` | [21](../../src/services/lexicon/lexiconTypes.ts#L21) |
| type | `LexiconMorphology` | [24](../../src/services/lexicon/lexiconTypes.ts#L24) |
| type | `LexiconEntry` | [34](../../src/services/lexicon/lexiconTypes.ts#L34) |
| type | `LexiconRootSummary` | [51](../../src/services/lexicon/lexiconTypes.ts#L51) |
| type | `LexiconVerification` | [52](../../src/services/lexicon/lexiconTypes.ts#L52) |

### src/services/mushaf/background.native.ts

[Volledige bron](../../src/services/mushaf/background.native.ts), 23 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `moduleFor` | [5](../../src/services/mushaf/background.native.ts#L5) |
| method | `onResume` | [16](../../src/services/mushaf/background.native.ts#L16) |

### src/services/mushaf/background.ts

[Volledige bron](../../src/services/mushaf/background.ts), 4 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/mushaf/backgroundManager.ts

[Volledige bron](../../src/services/mushaf/backgroundManager.ts), 271 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Options` | [10](../../src/services/mushaf/backgroundManager.ts#L10) |
| function | `createBackgroundMushafManager` | [17](../../src/services/mushaf/backgroundManager.ts#L17) |
| function-variable | `createBackgroundMushafManager.publish` | [43](../../src/services/mushaf/backgroundManager.ts#L43) |
| function-variable | `createBackgroundMushafManager.stopPoll` | [47](../../src/services/mushaf/backgroundManager.ts#L47) |
| function-variable | `createBackgroundMushafManager.ensurePoll` | [51](../../src/services/mushaf/backgroundManager.ts#L51) |
| function-variable | `createBackgroundMushafManager.installed` | [57](../../src/services/mushaf/backgroundManager.ts#L57) |
| function-variable | `createBackgroundMushafManager.accept` | [77](../../src/services/mushaf/backgroundManager.ts#L77) |
| function | `createBackgroundMushafManager.refresh` | [130](../../src/services/mushaf/backgroundManager.ts#L130) |
| function | `createBackgroundMushafManager.start` | [151](../../src/services/mushaf/backgroundManager.ts#L151) |
| function | `createBackgroundMushafManager.cancelCurrent` | [215](../../src/services/mushaf/backgroundManager.ts#L215) |
| method | `createBackgroundMushafManager.subscribe` | [236](../../src/services/mushaf/backgroundManager.ts#L236) |
| method | `createBackgroundMushafManager.cancel` | [244](../../src/services/mushaf/backgroundManager.ts#L244) |
| function-variable | `createBackgroundMushafManager.check` | [259](../../src/services/mushaf/backgroundManager.ts#L259) |

### src/services/mushaf/backgroundTypes.ts

[Volledige bron](../../src/services/mushaf/backgroundTypes.ts), 20 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `BackgroundMushafTask` | [3](../../src/services/mushaf/backgroundTypes.ts#L3) |
| type | `BackgroundMushafPort` | [14](../../src/services/mushaf/backgroundTypes.ts#L14) |
| method | `BackgroundMushafPort.inspect` | [15](../../src/services/mushaf/backgroundTypes.ts#L15) |
| method | `BackgroundMushafPort.start` | [16](../../src/services/mushaf/backgroundTypes.ts#L16) |
| method | `BackgroundMushafPort.cancel` | [17](../../src/services/mushaf/backgroundTypes.ts#L17) |
| method | `BackgroundMushafPort.onResume` | [18](../../src/services/mushaf/backgroundTypes.ts#L18) |

### src/services/mushaf/downloadManager.ts

[Volledige bron](../../src/services/mushaf/downloadManager.ts), 214 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `InstalledMushaf` | [13](../../src/services/mushaf/downloadManager.ts#L13) |
| type | `ActiveMushafDownload` | [14](../../src/services/mushaf/downloadManager.ts#L14) |
| type | `MushafDownloadSnapshot` | [24](../../src/services/mushaf/downloadManager.ts#L24) |
| type | `Options` | [35](../../src/services/mushaf/downloadManager.ts#L35) |
| function | `createMushafDownloadManager` | [44](../../src/services/mushaf/downloadManager.ts#L44) |
| function | `createMushafDownloadManager.publish` | [59](../../src/services/mushaf/downloadManager.ts#L59) |
| function | `createMushafDownloadManager.prepare` | [63](../../src/services/mushaf/downloadManager.ts#L63) |
| function | `createMushafDownloadManager.refresh` | [71](../../src/services/mushaf/downloadManager.ts#L71) |
| function | `createMushafDownloadManager.start` | [99](../../src/services/mushaf/downloadManager.ts#L99) |
| function-variable | `createMushafDownloadManager.start.update` | [120](../../src/services/mushaf/downloadManager.ts#L120) |
| method | `createMushafDownloadManager.subscribe` | [190](../../src/services/mushaf/downloadManager.ts#L190) |
| method | `createMushafDownloadManager.cancel` | [198](../../src/services/mushaf/downloadManager.ts#L198) |
| method | `createMushafDownloadManager.retry` | [205](../../src/services/mushaf/downloadManager.ts#L205) |

### src/services/mushaf/library.ts

[Volledige bron](../../src/services/mushaf/library.ts), 213 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LibraryEdition` | [3](../../src/services/mushaf/library.ts#L3) |
| type | `DownloadEdition` | [9](../../src/services/mushaf/library.ts#L9) |
| type | `MushafOption` | [10](../../src/services/mushaf/library.ts#L10) |
| function | `optionFor` | [64](../../src/services/mushaf/library.ts#L64) |
| function | `validMushafHeader` | [69](../../src/services/mushaf/library.ts#L69) |
| function | `validMushafTail` | [76](../../src/services/mushaf/library.ts#L76) |
| type | `MushafDownloadPort` | [80](../../src/services/mushaf/library.ts#L80) |
| method | `MushafDownloadPort.has` | [81](../../src/services/mushaf/library.ts#L81) |
| method | `MushafDownloadPort.fetch` | [82](../../src/services/mushaf/library.ts#L82) |
| type | `MushafTransferProgress` | [91](../../src/services/mushaf/library.ts#L91) |
| function | `downloadMushaf` | [99](../../src/services/mushaf/library.ts#L99) |
| function | `installedMushaf` | [167](../../src/services/mushaf/library.ts#L167) |
| type | `LegacyMushafPort` | [178](../../src/services/mushaf/library.ts#L178) |
| method | `LegacyMushafPort.ignored` | [179](../../src/services/mushaf/library.ts#L179) |
| method | `LegacyMushafPort.hasCurrent` | [180](../../src/services/mushaf/library.ts#L180) |
| method | `LegacyMushafPort.validatedSource` | [181](../../src/services/mushaf/library.ts#L181) |
| method | `LegacyMushafPort.copyAtomic` | [182](../../src/services/mushaf/library.ts#L182) |
| function | `importLegacyPackage` | [185](../../src/services/mushaf/library.ts#L185) |
| function-variable | `importLegacyPackage.pageFor` | [194](../../src/services/mushaf/library.ts#L194) |

### src/services/mushaf/mushafDownloads.ts

[Volledige bron](../../src/services/mushaf/mushafDownloads.ts), 11 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/mushaf/pdfCrop.native.ts

[Volledige bron](../../src/services/mushaf/pdfCrop.native.ts), 28 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `moduleFor` | [5](../../src/services/mushaf/pdfCrop.native.ts#L5) |
| function | `nativePdfCropAvailable` | [15](../../src/services/mushaf/pdfCrop.native.ts#L15) |
| function | `prepareNativePdfCrop` | [20](../../src/services/mushaf/pdfCrop.native.ts#L20) |

### src/services/mushaf/pdfCrop.ts

[Volledige bron](../../src/services/mushaf/pdfCrop.ts), 13 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `nativePdfCropAvailable` | [3](../../src/services/mushaf/pdfCrop.ts#L3) |
| function | `prepareNativePdfCrop` | [6](../../src/services/mushaf/pdfCrop.ts#L6) |

### src/services/mushaf/pdfCrop.web.ts

[Volledige bron](../../src/services/mushaf/pdfCrop.web.ts), 13 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `nativePdfCropAvailable` | [3](../../src/services/mushaf/pdfCrop.web.ts#L3) |
| function | `prepareNativePdfCrop` | [6](../../src/services/mushaf/pdfCrop.web.ts#L6) |

### src/services/mushaf/pdfCropTypes.ts

[Volledige bron](../../src/services/mushaf/pdfCropTypes.ts), 46 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `NativePdfCropModule` | [2](../../src/services/mushaf/pdfCropTypes.ts#L2) |
| method | `NativePdfCropModule.prepare` | [4](../../src/services/mushaf/pdfCropTypes.ts#L4) |
| method | `NativePdfCropModule.cancel` | [5](../../src/services/mushaf/pdfCropTypes.ts#L5) |
| function | `cancelled` | [8](../../src/services/mushaf/pdfCropTypes.ts#L8) |
| function | `runNativePdfCrop` | [15](../../src/services/mushaf/pdfCropTypes.ts#L15) |
| function-variable | `runNativePdfCrop.onAbort` | [24](../../src/services/mushaf/pdfCropTypes.ts#L24) |

### src/services/mushaf/selectableMushaf.ts

[Volledige bron](../../src/services/mushaf/selectableMushaf.ts), 98 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `loadSelectableMushafPage` | [17](../../src/services/mushaf/selectableMushaf.ts#L17) |
| function | `loadHafsMushafPage` | [41](../../src/services/mushaf/selectableMushaf.ts#L41) |
| function-variable | `loadHafsMushafPage.abort` | [62](../../src/services/mushaf/selectableMushaf.ts#L62) |

### src/services/mushaf/storage.native.ts

[Volledige bron](../../src/services/mushaf/storage.native.ts), 171 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `directory` | [13](../../src/services/mushaf/storage.native.ts#L13) |
| function | `target` | [16](../../src/services/mushaf/storage.native.ts#L16) |
| function | `legacyFiles` | [23](../../src/services/mushaf/storage.native.ts#L23) |
| function | `ignored` | [38](../../src/services/mushaf/storage.native.ts#L38) |
| function | `validFile` | [41](../../src/services/mushaf/storage.native.ts#L41) |
| method | `has` | [70](../../src/services/mushaf/storage.native.ts#L70) |
| method | `fetch` | [80](../../src/services/mushaf/storage.native.ts#L80) |
| function | `mushafFile` | [104](../../src/services/mushaf/storage.native.ts#L104) |
| function | `removeMushaf` | [107](../../src/services/mushaf/storage.native.ts#L107) |
| function | `importLegacyMushafs` | [117](../../src/services/mushaf/storage.native.ts#L117) |
| function | `importLegacyUnlocked` | [122](../../src/services/mushaf/storage.native.ts#L122) |
| method | `importLegacyUnlocked.ignored` | [125](../../src/services/mushaf/storage.native.ts#L125) |
| method | `importLegacyUnlocked.hasCurrent` | [128](../../src/services/mushaf/storage.native.ts#L128) |
| method | `importLegacyUnlocked.validatedSource` | [132](../../src/services/mushaf/storage.native.ts#L132) |
| method | `importLegacyUnlocked.copyAtomic` | [143](../../src/services/mushaf/storage.native.ts#L143) |

### src/services/mushaf/storage.ts

[Volledige bron](../../src/services/mushaf/storage.ts), 2 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/mushaf/storage.web.ts

[Volledige bron](../../src/services/mushaf/storage.web.ts), 22 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `has` | [3](../../src/services/mushaf/storage.web.ts#L3) |
| method | `fetch` | [6](../../src/services/mushaf/storage.web.ts#L6) |
| function | `mushafFile` | [10](../../src/services/mushaf/storage.web.ts#L10) |
| function | `removeMushaf` | [16](../../src/services/mushaf/storage.web.ts#L16) |
| function | `importLegacyMushafs` | [19](../../src/services/mushaf/storage.web.ts#L19) |

### src/services/mushaf/warshMushaf.ts

[Volledige bron](../../src/services/mushaf/warshMushaf.ts), 70 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `fetchWarshWords` | [12](../../src/services/mushaf/warshMushaf.ts#L12) |
| function-variable | `fetchWarshWords.abort` | [23](../../src/services/mushaf/warshMushaf.ts#L23) |
| function | `loadWords` | [47](../../src/services/mushaf/warshMushaf.ts#L47) |
| function | `loadWarshMushafPage` | [58](../../src/services/mushaf/warshMushaf.ts#L58) |

### src/services/mushaf/warshOffline.ts

[Volledige bron](../../src/services/mushaf/warshOffline.ts), 14 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `loadBundledWarshWords` | [6](../../src/services/mushaf/warshOffline.ts#L6) |

### src/services/notifications/expoPlanningReminders.ts

[Volledige bron](../../src/services/notifications/expoPlanningReminders.ts), 54 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `requestPlanReminderPermission` | [7](../../src/services/notifications/expoPlanningReminders.ts#L7) |
| function | `hasPlanReminderPermission` | [24](../../src/services/notifications/expoPlanningReminders.ts#L24) |
| method | `list` | [29](../../src/services/notifications/expoPlanningReminders.ts#L29) |
| method | `schedule` | [33](../../src/services/notifications/expoPlanningReminders.ts#L33) |

### src/services/notifications/groupPushPolicy.ts

[Volledige bron](../../src/services/notifications/groupPushPolicy.ts), 108 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `GroupReply` | [3](../../src/services/notifications/groupPushPolicy.ts#L3) |
| type | `GroupPushTarget` | [6](../../src/services/notifications/groupPushPolicy.ts#L6) |
| type | `LocalPushPreferences` | [7](../../src/services/notifications/groupPushPolicy.ts#L7) |
| type | `GroupReplyGate` | [8](../../src/services/notifications/groupPushPolicy.ts#L8) |
| method | `GroupReplyGate.account` | [9](../../src/services/notifications/groupPushPolicy.ts#L9) |
| method | `GroupReplyGate.local` | [10](../../src/services/notifications/groupPushPolicy.ts#L10) |
| method | `GroupReplyGate.target` | [11](../../src/services/notifications/groupPushPolicy.ts#L11) |
| method | `GroupReplyGate.preferences` | [12](../../src/services/notifications/groupPushPolicy.ts#L12) |
| method | `GroupReplyGate.groupPreferences` | [13](../../src/services/notifications/groupPushPolicy.ts#L13) |
| function-variable | `validPushUuid` | [15](../../src/services/notifications/groupPushPolicy.ts#L15) |
| function | `findGroupReply` | [20](../../src/services/notifications/groupPushPolicy.ts#L20) |
| function-variable | `isGroupReplyMessage` | [39](../../src/services/notifications/groupPushPolicy.ts#L39) |
| function | `parseGroupReply` | [40](../../src/services/notifications/groupPushPolicy.ts#L40) |
| function | `quietHoursActive` | [47](../../src/services/notifications/groupPushPolicy.ts#L47) |
| function | `authorizeGroupReply` | [55](../../src/services/notifications/groupPushPolicy.ts#L55) |
| function-variable | `authorizeGroupReply.allowedHere` | [63](../../src/services/notifications/groupPushPolicy.ts#L63) |
| function | `resolveGroupReplyNavigation` | [85](../../src/services/notifications/groupPushPolicy.ts#L85) |

### src/services/notifications/groupPushRuntime.ts

[Volledige bron](../../src/services/notifications/groupPushRuntime.ts), 126 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `pushGate` | [34](../../src/services/notifications/groupPushRuntime.ts#L34) |
| function | `receiveGroupReply` | [54](../../src/services/notifications/groupPushRuntime.ts#L54) |
| function | `initializeGroupPushHandler` | [113](../../src/services/notifications/groupPushRuntime.ts#L113) |

### src/services/notifications/groupPushState.ts

[Volledige bron](../../src/services/notifications/groupPushState.ts), 13 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `groupPushRevision` | [3](../../src/services/notifications/groupPushState.ts#L3) |
| function-variable | `invalidateGroupPush` | [4](../../src/services/notifications/groupPushState.ts#L4) |
| function | `withGroupPushLock` | [8](../../src/services/notifications/groupPushState.ts#L8) |

### src/services/notifications/groupPushTasks.native.ts

[Volledige bron](../../src/services/notifications/groupPushTasks.native.ts), 26 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/notifications/groupPushTasks.ts

[Volledige bron](../../src/services/notifications/groupPushTasks.ts), 3 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/notifications/localReminders.ts

[Volledige bron](../../src/services/notifications/localReminders.ts), 194 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `getReminderFailure` | [25](../../src/services/notifications/localReminders.ts#L25) |
| function | `onReminderFailureChanged` | [26](../../src/services/notifications/localReminders.ts#L26) |
| function | `setReminderFailure` | [32](../../src/services/notifications/localReminders.ts#L32) |
| function | `ordered` | [37](../../src/services/notifications/localReminders.ts#L37) |
| function | `loadLocalNotifications` | [42](../../src/services/notifications/localReminders.ts#L42) |
| function | `desiredLocalReminders` | [56](../../src/services/notifications/localReminders.ts#L56) |
| function | `reconcileLocalReminders` | [127](../../src/services/notifications/localReminders.ts#L127) |
| function | `saveLocalNotifications` | [166](../../src/services/notifications/localReminders.ts#L166) |

### src/services/notifications/notificationDestinations.ts

[Volledige bron](../../src/services/notifications/notificationDestinations.ts), 66 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `LocalNotificationTap` | [5](../../src/services/notifications/notificationDestinations.ts#L5) |
| function | `parseLocalNotificationUrl` | [10](../../src/services/notifications/notificationDestinations.ts#L10) |
| function | `planNotificationUrl` | [36](../../src/services/notifications/notificationDestinations.ts#L36) |

### src/services/notifications/notificationPreferenceEvents.ts

[Volledige bron](../../src/services/notifications/notificationPreferenceEvents.ts), 11 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `onNotificationPreferencesChanged` | [2](../../src/services/notifications/notificationPreferenceEvents.ts#L2) |
| function | `notifyNotificationPreferencesChanged` | [8](../../src/services/notifications/notificationPreferenceEvents.ts#L8) |

### src/services/notifications/notificationSystem.ts

[Volledige bron](../../src/services/notifications/notificationSystem.ts), 111 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `NotificationPermission` | [1](../../src/services/notifications/notificationSystem.ts#L1) |
| type | `NotificationChannelState` | [7](../../src/services/notifications/notificationSystem.ts#L7) |
| function | `notificationDeliveryAllowed` | [10](../../src/services/notifications/notificationSystem.ts#L10) |
| type | `NotificationSystemStatus` | [24](../../src/services/notifications/notificationSystem.ts#L24) |
| type | `NotificationSystemPort` | [28](../../src/services/notifications/notificationSystem.ts#L28) |
| method | `NotificationSystemPort.permission` | [30](../../src/services/notifications/notificationSystem.ts#L30) |
| method | `NotificationSystemPort.channels` | [36](../../src/services/notifications/notificationSystem.ts#L36) |
| method | `NotificationSystemPort.openAndroidSettings` | [37](../../src/services/notifications/notificationSystem.ts#L37) |
| method | `NotificationSystemPort.openSettings` | [38](../../src/services/notifications/notificationSystem.ts#L38) |
| method | `NotificationSystemPort.onResume` | [39](../../src/services/notifications/notificationSystem.ts#L39) |
| function | `readNotificationSystem` | [43](../../src/services/notifications/notificationSystem.ts#L43) |
| function | `openNotificationSettings` | [70](../../src/services/notifications/notificationSystem.ts#L70) |
| function | `observeNotificationSystem` | [83](../../src/services/notifications/notificationSystem.ts#L83) |
| function-variable | `observeNotificationSystem.refresh` | [90](../../src/services/notifications/notificationSystem.ts#L90) |
| method | `observeNotificationSystem.dispose` | [104](../../src/services/notifications/notificationSystem.ts#L104) |

### src/services/notifications/notificationSystemPort.ts

[Volledige bron](../../src/services/notifications/notificationSystemPort.ts), 46 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `permission` | [9](../../src/services/notifications/notificationSystemPort.ts#L9) |
| method | `channels` | [18](../../src/services/notifications/notificationSystemPort.ts#L18) |
| method | `onResume` | [39](../../src/services/notifications/notificationSystemPort.ts#L39) |

### src/services/notifications/planningReminderLedger.ts

[Volledige bron](../../src/services/notifications/planningReminderLedger.ts), 188 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Submission` | [10](../../src/services/notifications/planningReminderLedger.ts#L10) |
| type | `Ledger` | [11](../../src/services/notifications/planningReminderLedger.ts#L11) |
| type | `Storage` | [12](../../src/services/notifications/planningReminderLedger.ts#L12) |
| method | `Storage.getItem` | [13](../../src/services/notifications/planningReminderLedger.ts#L13) |
| method | `Storage.setItem` | [14](../../src/services/notifications/planningReminderLedger.ts#L14) |
| function | `decodeLedger` | [17](../../src/services/notifications/planningReminderLedger.ts#L17) |
| function | `reconcileTrackedPlanReminders` | [45](../../src/services/notifications/planningReminderLedger.ts#L45) |
| function-variable | `reconcileTrackedPlanReminders.existingFor` | [63](../../src/services/notifications/planningReminderLedger.ts#L63) |
| function-variable | `reconcileTrackedPlanReminders.persist` | [110](../../src/services/notifications/planningReminderLedger.ts#L110) |
| method | `reconcileTrackedPlanReminders.schedule` | [139](../../src/services/notifications/planningReminderLedger.ts#L139) |
| method | `reconcileTrackedPlanReminders.cancel` | [172](../../src/services/notifications/planningReminderLedger.ts#L172) |

### src/services/notifications/planningReminderPort.ts

[Volledige bron](../../src/services/notifications/planningReminderPort.ts), 176 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `rememberFirstGrant` | [20](../../src/services/notifications/planningReminderPort.ts#L20) |
| function | `promptForPermission` | [26](../../src/services/notifications/planningReminderPort.ts#L26) |
| function | `firstPlanReminderGrantAt` | [51](../../src/services/notifications/planningReminderPort.ts#L51) |
| function | `hasPreviousAndroidDenial` | [59](../../src/services/notifications/planningReminderPort.ts#L59) |
| method | `hasPreviousAndroidDenial.shouldShowRequestPermissionRationale` | [62](../../src/services/notifications/planningReminderPort.ts#L62) |
| function | `ensureReminderChannel` | [72](../../src/services/notifications/planningReminderPort.ts#L72) |
| function | `hasPlanReminderPermission` | [82](../../src/services/notifications/planningReminderPort.ts#L82) |
| function | `requestPlanReminderPermission` | [87](../../src/services/notifications/planningReminderPort.ts#L87) |
| function | `initialPlanReminderPermission` | [96](../../src/services/notifications/planningReminderPort.ts#L96) |
| method | `list` | [121](../../src/services/notifications/planningReminderPort.ts#L121) |
| method | `schedule` | [143](../../src/services/notifications/planningReminderPort.ts#L143) |

### src/services/notifications/planningReminders.ts

[Volledige bron](../../src/services/notifications/planningReminders.ts), 204 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `DesiredPlanReminder` | [4](../../src/services/notifications/planningReminders.ts#L4) |
| type | `ExistingPlanReminder` | [20](../../src/services/notifications/planningReminders.ts#L20) |
| type | `PlanReminderPort` | [21](../../src/services/notifications/planningReminders.ts#L21) |
| type | `ReminderReconcileResult` | [26](../../src/services/notifications/planningReminders.ts#L26) |
| function | `planningReminderDueAt` | [34](../../src/services/notifications/planningReminders.ts#L34) |
| function | `planReminderKey` | [71](../../src/services/notifications/planningReminders.ts#L71) |
| function | `desiredPlanReminders` | [79](../../src/services/notifications/planningReminders.ts#L79) |
| function | `reconcilePlanReminders` | [116](../../src/services/notifications/planningReminders.ts#L116) |
| function | `planReminderCopy` | [175](../../src/services/notifications/planningReminders.ts#L175) |
| function | `reminderCopy` | [201](../../src/services/notifications/planningReminders.ts#L201) |

### src/services/notifications/pushDevice.ts

[Volledige bron](../../src/services/notifications/pushDevice.ts), 166 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `localPushPreferences` | [14](../../src/services/notifications/pushDevice.ts#L14) |
| function | `dismissGroupNotifications` | [19](../../src/services/notifications/pushDevice.ts#L19) |
| function-variable | `dismissGroupNotifications.matches` | [21](../../src/services/notifications/pushDevice.ts#L21) |
| function | `syncRegisteredPushDevice` | [38](../../src/services/notifications/pushDevice.ts#L38) |
| function | `enablePushDevice` | [74](../../src/services/notifications/pushDevice.ts#L74) |
| function | `unregisterPushDevice` | [145](../../src/services/notifications/pushDevice.ts#L145) |

### src/services/notifications/pushDeviceKeys.ts

[Volledige bron](../../src/services/notifications/pushDeviceKeys.ts), 18 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/notifications/reminderTransaction.ts

[Volledige bron](../../src/services/notifications/reminderTransaction.ts), 21 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ReminderTransaction` | [1](../../src/services/notifications/reminderTransaction.ts#L1) |
| method | `ReminderTransaction.existingIds` | [2](../../src/services/notifications/reminderTransaction.ts#L2) |
| method | `ReminderTransaction.create` | [3](../../src/services/notifications/reminderTransaction.ts#L3) |
| method | `ReminderTransaction.cancel` | [4](../../src/services/notifications/reminderTransaction.ts#L4) |
| function | `replaceReminder` | [8](../../src/services/notifications/reminderTransaction.ts#L8) |

### src/services/planning/independentReadingPlan.ts

[Volledige bron](../../src/services/planning/independentReadingPlan.ts), 65 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `StoragePort` | [9](../../src/services/planning/independentReadingPlan.ts#L9) |
| method | `StoragePort.getItem` | [10](../../src/services/planning/independentReadingPlan.ts#L10) |
| method | `StoragePort.setItem` | [11](../../src/services/planning/independentReadingPlan.ts#L11) |
| type | `ReadingPlanSnapshot` | [13](../../src/services/planning/independentReadingPlan.ts#L13) |
| function | `createReadingPlanRepository` | [16](../../src/services/planning/independentReadingPlan.ts#L16) |
| function | `createReadingPlanRepository.publish` | [20](../../src/services/planning/independentReadingPlan.ts#L20) |
| method | `createReadingPlanRepository.subscribe` | [26](../../src/services/planning/independentReadingPlan.ts#L26) |
| method | `createReadingPlanRepository.load` | [32](../../src/services/planning/independentReadingPlan.ts#L32) |
| method | `createReadingPlanRepository.save` | [55](../../src/services/planning/independentReadingPlan.ts#L55) |

### src/services/profiles/initializeProviderName.ts

[Volledige bron](../../src/services/profiles/initializeProviderName.ts), 39 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `initializeProviderName` | [4](../../src/services/profiles/initializeProviderName.ts#L4) |

### src/services/profiles/profiles.ts

[Volledige bron](../../src/services/profiles/profiles.ts), 168 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ProfileStorage` | [5](../../src/services/profiles/profiles.ts#L5) |
| method | `ProfileStorage.getItem` | [6](../../src/services/profiles/profiles.ts#L6) |
| method | `ProfileStorage.setItem` | [7](../../src/services/profiles/profiles.ts#L7) |
| method | `ProfileStorage.removeItem` | [8](../../src/services/profiles/profiles.ts#L8) |
| function | `profileForAccount` | [11](../../src/services/profiles/profiles.ts#L11) |
| function | `createProfileService` | [16](../../src/services/profiles/profiles.ts#L16) |
| function-variable | `createProfileService.cacheKey` | [25](../../src/services/profiles/profiles.ts#L25) |
| function-variable | `createProfileService.revision` | [30](../../src/services/profiles/profiles.ts#L30) |
| function-variable | `createProfileService.deletion` | [31](../../src/services/profiles/profiles.ts#L31) |
| function | `createProfileService.readStored` | [33](../../src/services/profiles/profiles.ts#L33) |
| function | `createProfileService.queueCache` | [52](../../src/services/profiles/profiles.ts#L52) |
| function | `createProfileService.cacheProfile` | [63](../../src/services/profiles/profiles.ts#L63) |
| function | `createProfileService.saveAvatarProfile` | [72](../../src/services/profiles/profiles.ts#L72) |
| method | `createProfileService.load` | [85](../../src/services/profiles/profiles.ts#L85) |
| method | `createProfileService.saveName` | [117](../../src/services/profiles/profiles.ts#L117) |
| method | `createProfileService.saveAvatar` | [130](../../src/services/profiles/profiles.ts#L130) |
| method | `createProfileService.clearCache` | [152](../../src/services/profiles/profiles.ts#L152) |
| method | `createProfileService.rememberProviderName` | [157](../../src/services/profiles/profiles.ts#L157) |

### src/services/profiles/types.ts

[Volledige bron](../../src/services/profiles/types.ts), 22 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ProfileAccount` | [2](../../src/services/profiles/types.ts#L2) |
| type | `Profile` | [8](../../src/services/profiles/types.ts#L8) |
| type | `ProfilePhoto` | [9](../../src/services/profiles/types.ts#L9) |
| type | `ProfileService` | [11](../../src/services/profiles/types.ts#L11) |
| method | `ProfileService.load` | [13](../../src/services/profiles/types.ts#L13) |
| method | `ProfileService.saveName` | [15](../../src/services/profiles/types.ts#L15) |
| method | `ProfileService.saveAvatar` | [16](../../src/services/profiles/types.ts#L16) |
| method | `ProfileService.clearCache` | [18](../../src/services/profiles/types.ts#L18) |
| method | `ProfileService.rememberProviderName` | [20](../../src/services/profiles/types.ts#L20) |

### src/services/storage/deviceStorage.native.ts

[Volledige bron](../../src/services/storage/deviceStorage.native.ts), 9 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/storage/deviceStorage.ts

[Volledige bron](../../src/services/storage/deviceStorage.ts), 5 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/storage/deviceStorageCore.ts

[Volledige bron](../../src/services/storage/deviceStorageCore.ts), 98 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `StoragePort` | [3](../../src/services/storage/deviceStorageCore.ts#L3) |
| method | `StoragePort.getItem` | [4](../../src/services/storage/deviceStorageCore.ts#L4) |
| method | `StoragePort.setItem` | [5](../../src/services/storage/deviceStorageCore.ts#L5) |
| method | `StoragePort.removeItem` | [6](../../src/services/storage/deviceStorageCore.ts#L6) |
| type | `DeviceValue` | [8](../../src/services/storage/deviceStorageCore.ts#L8) |
| function | `secureDeviceKey` | [12](../../src/services/storage/deviceStorageCore.ts#L12) |
| function | `createDeviceStorage` | [18](../../src/services/storage/deviceStorageCore.ts#L18) |
| function | `createDeviceStorage.serial` | [20](../../src/services/storage/deviceStorageCore.ts#L20) |
| function | `createDeviceStorage.decode` | [38](../../src/services/storage/deviceStorageCore.ts#L38) |
| method | `createDeviceStorage.getItem` | [57](../../src/services/storage/deviceStorageCore.ts#L57) |
| method | `createDeviceStorage.setItem` | [71](../../src/services/storage/deviceStorageCore.ts#L71) |
| method | `createDeviceStorage.removeItem` | [77](../../src/services/storage/deviceStorageCore.ts#L77) |
| method | `createDeviceStorage.multiSet` | [83](../../src/services/storage/deviceStorageCore.ts#L83) |
| method | `createDeviceStorage.multiRemove` | [88](../../src/services/storage/deviceStorageCore.ts#L88) |
| method | `createDeviceStorage.migrate` | [92](../../src/services/storage/deviceStorageCore.ts#L92) |

### src/services/storage/pickNotesFile.native.ts

[Volledige bron](../../src/services/storage/pickNotesFile.native.ts), 16 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `pickNotesFile` | [4](../../src/services/storage/pickNotesFile.native.ts#L4) |

### src/services/storage/pickNotesFile.ts

[Volledige bron](../../src/services/storage/pickNotesFile.ts), 2 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/storage/pickNotesFile.web.ts

[Volledige bron](../../src/services/storage/pickNotesFile.web.ts), 14 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `pickNotesFile` | [3](../../src/services/storage/pickNotesFile.web.ts#L3) |

### src/services/storage/readOnlyAssetDatabase.ts

[Volledige bron](../../src/services/storage/readOnlyAssetDatabase.ts), 68 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `openReadOnlyAssetDatabase` | [7](../../src/services/storage/readOnlyAssetDatabase.ts#L7) |

### src/services/storage/secureStorageCore.ts

[Volledige bron](../../src/services/storage/secureStorageCore.ts), 96 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| interface | `SecureDriver` | [1](../../src/services/storage/secureStorageCore.ts#L1) |
| method | `SecureDriver.get` | [2](../../src/services/storage/secureStorageCore.ts#L2) |
| method | `SecureDriver.set` | [3](../../src/services/storage/secureStorageCore.ts#L3) |
| method | `SecureDriver.remove` | [4](../../src/services/storage/secureStorageCore.ts#L4) |
| type | `Index` | [6](../../src/services/storage/secureStorageCore.ts#L6) |
| function | `parseIndex` | [7](../../src/services/storage/secureStorageCore.ts#L7) |
| function | `createSecureSessionStorage` | [22](../../src/services/storage/secureStorageCore.ts#L22) |
| function | `createSecureSessionStorage.serial` | [24](../../src/services/storage/secureStorageCore.ts#L24) |
| function-variable | `createSecureSessionStorage.chunkKey` | [30](../../src/services/storage/secureStorageCore.ts#L30) |
| method | `createSecureSessionStorage.getItem` | [33](../../src/services/storage/secureStorageCore.ts#L33) |
| method | `createSecureSessionStorage.setItem` | [45](../../src/services/storage/secureStorageCore.ts#L45) |
| method | `createSecureSessionStorage.removeItem` | [84](../../src/services/storage/secureStorageCore.ts#L84) |

### src/services/storage/sessionStorage.native.ts

[Volledige bron](../../src/services/storage/sessionStorage.native.ts), 12 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/storage/sessionStorage.ts

[Volledige bron](../../src/services/storage/sessionStorage.ts), 4 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/storage/shareNotesFile.native.ts

[Volledige bron](../../src/services/storage/shareNotesFile.native.ts), 15 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `shareNotesFile` | [4](../../src/services/storage/shareNotesFile.native.ts#L4) |

### src/services/storage/shareNotesFile.ts

[Volledige bron](../../src/services/storage/shareNotesFile.ts), 3 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/services/storage/shareNotesFile.web.ts

[Volledige bron](../../src/services/storage/shareNotesFile.web.ts), 13 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `shareNotesFile` | [1](../../src/services/storage/shareNotesFile.web.ts#L1) |

### src/services/study/studyProviders.ts

[Volledige bron](../../src/services/study/studyProviders.ts), 271 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AsbabAvailability` | [69](../../src/services/study/studyProviders.ts#L69) |
| type | `IrabFragment` | [70](../../src/services/study/studyProviders.ts#L70) |
| type | `IrabResult` | [71](../../src/services/study/studyProviders.ts#L71) |
| type | `Fetcher` | [72](../../src/services/study/studyProviders.ts#L72) |
| function | `isValidAyah` | [74](../../src/services/study/studyProviders.ts#L74) |
| function | `parseAsbabIndex` | [85](../../src/services/study/studyProviders.ts#L85) |
| function | `parseIrabResponse` | [120](../../src/services/study/studyProviders.ts#L120) |
| function-variable | `parseIrabResponse.label` | [132](../../src/services/study/studyProviders.ts#L132) |
| function | `plainHtmlText` | [154](../../src/services/study/studyProviders.ts#L154) |
| function | `requireOk` | [176](../../src/services/study/studyProviders.ts#L176) |
| function | `timedRead` | [181](../../src/services/study/studyProviders.ts#L181) |
| function-variable | `timedRead.abort` | [189](../../src/services/study/studyProviders.ts#L189) |
| function | `loadTafsir` | [206](../../src/services/study/studyProviders.ts#L206) |
| function | `loadIrab` | [227](../../src/services/study/studyProviders.ts#L227) |
| function | `loadAsbabAvailability` | [246](../../src/services/study/studyProviders.ts#L246) |
| function | `clearAsbabAvailabilityCache` | [268](../../src/services/study/studyProviders.ts#L268) |

### src/services/study/studyRequest.ts

[Volledige bron](../../src/services/study/studyRequest.ts), 68 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `StudyReference` | [3](../../src/services/study/studyRequest.ts#L3) |
| type | `StudyRequest` | [4](../../src/services/study/studyRequest.ts#L4) |
| type | `StudyLoadState` | [5](../../src/services/study/studyRequest.ts#L5) |
| function | `studyRequestKey` | [11](../../src/services/study/studyRequest.ts#L11) |
| function | `fixedStudyReferences` | [15](../../src/services/study/studyRequest.ts#L15) |
| function | `hasStudySource` | [29](../../src/services/study/studyRequest.ts#L29) |
| function | `createStudyRequestController` | [38](../../src/services/study/studyRequest.ts#L38) |
| method | `createStudyRequestController.cancel` | [42](../../src/services/study/studyRequest.ts#L42) |
| method | `createStudyRequestController.run` | [47](../../src/services/study/studyRequest.ts#L47) |

### src/shared/animation/revealViewport.ts

[Volledige bron](../../src/shared/animation/revealViewport.ts), 51 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `RevealBounds` | [1](../../src/shared/animation/revealViewport.ts#L1) |
| type | `RevealViewport` | [2](../../src/shared/animation/revealViewport.ts#L2) |
| function | `revealScrollRange` | [5](../../src/shared/animation/revealViewport.ts#L5) |
| function | `revealTranslation` | [22](../../src/shared/animation/revealViewport.ts#L22) |
| function | `revealIsInteractive` | [33](../../src/shared/animation/revealViewport.ts#L33) |
| function | `revealProgressAt` | [42](../../src/shared/animation/revealViewport.ts#L42) |

### src/shared/components/AppText.tsx

[Volledige bron](../../src/shared/components/AppText.tsx), 63 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `T` | [6](../../src/shared/components/AppText.tsx#L6) |

### src/shared/components/Button.tsx

[Volledige bron](../../src/shared/components/Button.tsx), 67 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Button` | [9](../../src/shared/components/Button.tsx#L9) |

### src/shared/components/Calendar.tsx

[Volledige bron](../../src/shared/components/Calendar.tsx), 106 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Calendar` | [8](../../src/shared/components/Calendar.tsx#L8) |

### src/shared/components/Card.tsx

[Volledige bron](../../src/shared/components/Card.tsx), 36 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Card` | [7](../../src/shared/components/Card.tsx#L7) |

### src/shared/components/CardOrnament.tsx

[Volledige bron](../../src/shared/components/CardOrnament.tsx), 95 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `CardOrnamentVariant` | [5](../../src/shared/components/CardOrnament.tsx#L5) |
| type | `Strength` | [6](../../src/shared/components/CardOrnament.tsx#L6) |
| type | `Placement` | [7](../../src/shared/components/CardOrnament.tsx#L7) |
| function | `ornamentVariantForId` | [26](../../src/shared/components/CardOrnament.tsx#L26) |
| function | `ornamentTone` | [71](../../src/shared/components/CardOrnament.tsx#L71) |

### src/shared/components/DirectionView.tsx

[Volledige bron](../../src/shared/components/DirectionView.tsx), 12 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `DirectionView` | [7](../../src/shared/components/DirectionView.tsx#L7) |

### src/shared/components/Empty.tsx

[Volledige bron](../../src/shared/components/Empty.tsx), 39 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Empty` | [9](../../src/shared/components/Empty.tsx#L9) |

### src/shared/components/Field.tsx

[Volledige bron](../../src/shared/components/Field.tsx), 63 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Field` | [9](../../src/shared/components/Field.tsx#L9) |

### src/shared/components/Icon.tsx

[Volledige bron](../../src/shared/components/Icon.tsx), 35 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `IconName` | [7](../../src/shared/components/Icon.tsx#L7) |
| function | `Icon` | [8](../../src/shared/components/Icon.tsx#L8) |

### src/shared/components/IconButton.tsx

[Volledige bron](../../src/shared/components/IconButton.tsx), 44 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `IconButton` | [8](../../src/shared/components/IconButton.tsx#L8) |

### src/shared/components/Notice.tsx

[Volledige bron](../../src/shared/components/Notice.tsx), 37 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Notice` | [8](../../src/shared/components/Notice.tsx#L8) |

### src/shared/components/ProgressBar.tsx

[Volledige bron](../../src/shared/components/ProgressBar.tsx), 44 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ProgressBar` | [6](../../src/shared/components/ProgressBar.tsx#L6) |

### src/shared/components/ProgressRing.tsx

[Volledige bron](../../src/shared/components/ProgressRing.tsx), 64 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ProgressRing` | [7](../../src/shared/components/ProgressRing.tsx#L7) |

### src/shared/components/RevealBlock.tsx

[Volledige bron](../../src/shared/components/RevealBlock.tsx), 328 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Registration` | [28](../../src/shared/components/RevealBlock.tsx#L28) |
| type | `RevealEntry` | [29](../../src/shared/components/RevealBlock.tsx#L29) |
| type | `RevealContextValue` | [36](../../src/shared/components/RevealBlock.tsx#L36) |
| function | `RevealScrollView` | [47](../../src/shared/components/RevealBlock.tsx#L47) |
| function-variable | `RevealScrollView.fail` | [95](../../src/shared/components/RevealBlock.tsx#L95) |
| function | `RevealBlock` | [194](../../src/shared/components/RevealBlock.tsx#L194) |
| function-variable | `RevealBlock.updateInteractive` | [207](../../src/shared/components/RevealBlock.tsx#L207) |

### src/shared/components/Row.tsx

[Volledige bron](../../src/shared/components/Row.tsx), 65 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Row` | [8](../../src/shared/components/Row.tsx#L8) |

### src/shared/components/Screen.tsx

[Volledige bron](../../src/shared/components/Screen.tsx), 60 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Screen` | [11](../../src/shared/components/Screen.tsx#L11) |

### src/shared/components/Section.tsx

[Volledige bron](../../src/shared/components/Section.tsx), 53 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Section` | [8](../../src/shared/components/Section.tsx#L8) |

### src/shared/components/Segments.tsx

[Volledige bron](../../src/shared/components/Segments.tsx), 128 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Segments` | [9](../../src/shared/components/Segments.tsx#L9) |
| function-variable | `Segments.revealSelection` | [34](../../src/shared/components/Segments.tsx#L34) |

### src/shared/components/Sheet.tsx

[Volledige bron](../../src/shared/components/Sheet.tsx), 109 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `Sheet` | [19](../../src/shared/components/Sheet.tsx#L19) |

### src/shared/components/index.tsx

[Volledige bron](../../src/shared/components/index.tsx), 17 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/shared/components/styles.tsx

[Volledige bron](../../src/shared/components/styles.tsx), 62 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/shared/forms/inputNormalization.ts

[Volledige bron](../../src/shared/forms/inputNormalization.ts), 19 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `isNumericKeyboard` | [3](../../src/shared/forms/inputNormalization.ts#L3) |
| function | `normalizeNumericDigits` | [13](../../src/shared/forms/inputNormalization.ts#L13) |

### src/shared/forms/useKeyboardScroll.ts

[Volledige bron](../../src/shared/forms/useKeyboardScroll.ts), 117 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Scroll` | [4](../../src/shared/forms/useKeyboardScroll.ts#L4) |
| type | `Region` | [5](../../src/shared/forms/useKeyboardScroll.ts#L5) |
| function | `useKeyboardScroll` | [8](../../src/shared/forms/useKeyboardScroll.ts#L8) |
| function-variable | `useKeyboardScroll.valid` | [29](../../src/shared/forms/useKeyboardScroll.ts#L29) |
| function-variable | `useKeyboardScroll.move` | [46](../../src/shared/forms/useKeyboardScroll.ts#L46) |
| function-variable | `useKeyboardScroll.update` | [78](../../src/shared/forms/useKeyboardScroll.ts#L78) |

### src/shared/theme/ThemePicker.tsx

[Volledige bron](../../src/shared/theme/ThemePicker.tsx), 79 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ThemePicker` | [9](../../src/shared/theme/ThemePicker.tsx#L9) |

### src/shared/theme/colors.ts

[Volledige bron](../../src/shared/theme/colors.ts), 242 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Palette` | [39](../../src/shared/theme/colors.ts#L39) |
| function | `relativeLuminance` | [224](../../src/shared/theme/colors.ts#L224) |
| function | `contrastRatio` | [232](../../src/shared/theme/colors.ts#L232) |
| function | `isDarkPalette` | [237](../../src/shared/theme/colors.ts#L237) |

### src/shared/theme/index.tsx

[Volledige bron](../../src/shared/theme/index.tsx), 27 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `ThemeProvider` | [8](../../src/shared/theme/index.tsx#L8) |
| function-variable | `usePalette` | [20](../../src/shared/theme/index.tsx#L20) |
| function-variable | `useCardPatterns` | [22](../../src/shared/theme/index.tsx#L22) |

### src/shared/theme/spacing.ts

[Volledige bron](../../src/shared/theme/spacing.ts), 2 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/shared/theme/typography.ts

[Volledige bron](../../src/shared/theme/typography.ts), 9 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### src/state/models.ts

[Volledige bron](../../src/state/models.ts), 233 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Language` | [8](../../src/state/models.ts#L8) |
| type | `BookPresentation` | [9](../../src/state/models.ts#L9) |
| type | `Preferences` | [10](../../src/state/models.ts#L10) |
| type | `Progress` | [42](../../src/state/models.ts#L42) |
| type | `ReadingEntry` | [55](../../src/state/models.ts#L55) |
| type | `Plan` | [71](../../src/state/models.ts#L71) |
| type | `Journey` | [91](../../src/state/models.ts#L91) |
| type | `DailyGoal` | [99](../../src/state/models.ts#L99) |
| type | `GoalDay` | [106](../../src/state/models.ts#L106) |
| type | `LegacyDailyGoal` | [114](../../src/state/models.ts#L114) |
| type | `LegacyGoalDay` | [115](../../src/state/models.ts#L115) |
| type | `LegacyReadingJourney` | [116](../../src/state/models.ts#L116) |
| type | `LegacyPreferenceValue` | [125](../../src/state/models.ts#L125) |
| type | `LegacyAndroidSnapshot` | [126](../../src/state/models.ts#L126) |
| type | `Bookmark` | [143](../../src/state/models.ts#L143) |
| type | `MushafEdition` | [144](../../src/state/models.ts#L144) |
| type | `MushafBookmark` | [151](../../src/state/models.ts#L151) |
| type | `FocusSession` | [157](../../src/state/models.ts#L157) |
| type | `AppState` | [158](../../src/state/models.ts#L158) |

### src/state/persistence/decodeState.ts

[Volledige bron](../../src/state/persistence/decodeState.ts), 287 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Check` | [10](../../src/state/persistence/decodeState.ts#L10) |
| function-variable | `string` | [11](../../src/state/persistence/decodeState.ts#L11) |
| function-variable | `number` | [12](../../src/state/persistence/decodeState.ts#L12) |
| function-variable | `boolean` | [13](../../src/state/persistence/decodeState.ts#L13) |
| function-variable | `object` | [14](../../src/state/persistence/decodeState.ts#L14) |
| function-variable | `optional` | [16](../../src/state/persistence/decodeState.ts#L16) |
| function-variable | `nullable` | [20](../../src/state/persistence/decodeState.ts#L20) |
| function-variable | `array` | [24](../../src/state/persistence/decodeState.ts#L24) |
| function-variable | `record` | [28](../../src/state/persistence/decodeState.ts#L28) |
| function-variable | `fields` | [32](../../src/state/persistence/decodeState.ts#L32) |
| function-variable | `legacyPreference` | [151](../../src/state/persistence/decodeState.ts#L151) |
| function | `decodeState` | [214](../../src/state/persistence/decodeState.ts#L214) |

### src/state/persistence/hydrateState.ts

[Volledige bron](../../src/state/persistence/hydrateState.ts), 66 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Storage` | [10](../../src/state/persistence/hydrateState.ts#L10) |
| function | `finishLegacyMigration` | [15](../../src/state/persistence/hydrateState.ts#L15) |
| function | `hydrateState` | [33](../../src/state/persistence/hydrateState.ts#L33) |

### src/state/persistence/importedPresentation.ts

[Volledige bron](../../src/state/persistence/importedPresentation.ts), 36 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `importedPresentation` | [6](../../src/state/persistence/importedPresentation.ts#L6) |

### src/state/persistence/readerPositions.ts

[Volledige bron](../../src/state/persistence/readerPositions.ts), 32 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `restoreSurahPositions` | [4](../../src/state/persistence/readerPositions.ts#L4) |

### src/state/persistence/snapshotWriter.ts

[Volledige bron](../../src/state/persistence/snapshotWriter.ts), 47 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `createSnapshotWriter` | [6](../../src/state/persistence/snapshotWriter.ts#L6) |
| type | `createSnapshotWriter.Waiter` | [10](../../src/state/persistence/snapshotWriter.ts#L10) |
| function | `createSnapshotWriter.drain` | [14](../../src/state/persistence/snapshotWriter.ts#L14) |
| method | `createSnapshotWriter.save` | [32](../../src/state/persistence/snapshotWriter.ts#L32) |

### src/state/reducer.ts

[Volledige bron](../../src/state/reducer.ts), 577 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `newId` | [31](../../src/state/reducer.ts#L31) |
| type | `CheckInAction` | [32](../../src/state/reducer.ts#L32) |
| type | `Action` | [44](../../src/state/reducer.ts#L44) |
| function-variable | `progressKey` | [131](../../src/state/reducer.ts#L131) |
| function | `validMushafPage` | [134](../../src/state/reducer.ts#L134) |
| function | `checkIn` | [146](../../src/state/reducer.ts#L146) |
| function | `completePlan` | [217](../../src/state/reducer.ts#L217) |
| function | `appReducer` | [266](../../src/state/reducer.ts#L266) |
| function-variable | `appReducer.matches` | [451](../../src/state/reducer.ts#L451) |

### src/state/store.tsx

[Volledige bron](../../src/state/store.tsx), 238 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Store` | [17](../../src/state/store.tsx#L17) |
| function | `AppStoreProvider` | [29](../../src/state/store.tsx#L29) |
| function | `HydratedStore` | [79](../../src/state/store.tsx#L79) |
| function-variable | `HydratedStore.update` | [178](../../src/state/store.tsx#L178) |
| function | `useAppStore` | [228](../../src/state/store.tsx#L228) |
| function | `useOptionalAppStore` | [235](../../src/state/store.tsx#L235) |

### tests/account-forms.test.ts

[Volledige bron](../../tests/account-forms.test.ts), 523 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [8](../../tests/account-forms.test.ts#L8) |
| function | `form` | [10](../../tests/account-forms.test.ts#L10) |
| function-variable | `form.readSession` | [19](../../tests/account-forms.test.ts#L19) |
| function-variable | `form.appleWork` | [20](../../tests/account-forms.test.ts#L20) |
| method | `form.useState` | [69](../../tests/account-forms.test.ts#L69) |
| method | `form.useRef` | [79](../../tests/account-forms.test.ts#L79) |
| method | `form.useMemo` | [84](../../tests/account-forms.test.ts#L84) |
| method | `form.useEffect` | [87](../../tests/account-forms.test.ts#L87) |
| function | `form.loadModule` | [153](../../tests/account-forms.test.ts#L153) |
| function | `form.render` | [174](../../tests/account-forms.test.ts#L174) |
| function | `form.nodes` | [182](../../tests/account-forms.test.ts#L182) |
| function | `form.find` | [188](../../tests/account-forms.test.ts#L188) |
| function | `form.settle` | [197](../../tests/account-forms.test.ts#L197) |
| function-variable | `account` | [305](../../tests/account-forms.test.ts#L305) |

### tests/account-keyboard.test.ts

[Volledige bron](../../tests/account-keyboard.test.ts), 215 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [8](../../tests/account-keyboard.test.ts#L8) |
| function | `form` | [10](../../tests/account-keyboard.test.ts#L10) |
| method | `form.createElement` | [27](../../tests/account-keyboard.test.ts#L27) |
| method | `form.useState` | [46](../../tests/account-keyboard.test.ts#L46) |
| method | `form.useRef` | [56](../../tests/account-keyboard.test.ts#L56) |
| method | `form.useEffect` | [62](../../tests/account-keyboard.test.ts#L62) |
| function | `form.nodes` | [115](../../tests/account-keyboard.test.ts#L115) |

### tests/account-mutation.test.ts

[Volledige bron](../../tests/account-mutation.test.ts), 133 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `fixture` | [6](../../tests/account-mutation.test.ts#L6) |

### tests/account-profile.test.ts

[Volledige bron](../../tests/account-profile.test.ts), 231 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Controller` | [9](../../tests/account-profile.test.ts#L9) |
| function | `deferred` | [10](../../tests/account-profile.test.ts#L10) |
| function | `editor` | [19](../../tests/account-profile.test.ts#L19) |
| method | `editor.useState` | [51](../../tests/account-profile.test.ts#L51) |
| method | `editor.useRef` | [61](../../tests/account-profile.test.ts#L61) |
| method | `editor.useEffect` | [66](../../tests/account-profile.test.ts#L66) |
| method | `editor.require` | [99](../../tests/account-profile.test.ts#L99) |
| function | `editor.render` | [105](../../tests/account-profile.test.ts#L105) |

### tests/agenda.test.ts

[Volledige bron](../../tests/agenda.test.ts), 100 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `plan` | [13](../../tests/agenda.test.ts#L13) |

### tests/android-backup.test.ts

[Volledige bron](../../tests/android-backup.test.ts), 76 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `exclusions` | [11](../../tests/android-backup.test.ts#L11) |

### tests/apns-contract.test.ts

[Volledige bron](../../tests/apns-contract.test.ts), 35 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/appearance-controls.test.ts

[Volledige bron](../../tests/appearance-controls.test.ts), 193 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `settingsHarness` | [26](../../tests/appearance-controls.test.ts#L26) |
| method | `settingsHarness.dispatch` | [48](../../tests/appearance-controls.test.ts#L48) |
| function-variable | `toggle` | [88](../../tests/appearance-controls.test.ts#L88) |
| method | `onClose` | [143](../../tests/appearance-controls.test.ts#L143) |
| method | `remove` | [148](../../tests/appearance-controls.test.ts#L148) |
| function-variable | `render` | [164](../../tests/appearance-controls.test.ts#L164) |
| method | `render.onClose` | [168](../../tests/appearance-controls.test.ts#L168) |

### tests/appearance-preferences.test.ts

[Volledige bron](../../tests/appearance-preferences.test.ts), 159 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `imported` | [93](../../tests/appearance-preferences.test.ts#L93) |
| method | `getItem` | [123](../../tests/appearance-preferences.test.ts#L123) |
| method | `setItem` | [126](../../tests/appearance-preferences.test.ts#L126) |
| function-variable | `importer` | [131](../../tests/appearance-preferences.test.ts#L131) |

### tests/apple-auth.test.ts

[Volledige bron](../../tests/apple-auth.test.ts), 369 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `nativeFixture` | [17](../../tests/apple-auth.test.ts#L17) |
| function-variable | `nativeFixture.request` | [21](../../tests/apple-auth.test.ts#L21) |
| function | `authFixture` | [52](../../tests/apple-auth.test.ts#L52) |
| function | `profileFixture` | [262](../../tests/apple-auth.test.ts#L262) |
| function | `profileFixture.query` | [268](../../tests/apple-auth.test.ts#L268) |

### tests/apple-button.test.ts

[Volledige bron](../../tests/apple-button.test.ts), 113 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Element` | [9](../../tests/apple-button.test.ts#L9) |
| function | `nativeButton` | [10](../../tests/apple-button.test.ts#L10) |
| method | `nativeButton.render` | [57](../../tests/apple-button.test.ts#L57) |
| method | `onPress` | [74](../../tests/apple-button.test.ts#L74) |

### tests/apple-deletion.test.ts

[Volledige bron](../../tests/apple-deletion.test.ts), 378 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `serverFixture` | [13](../../tests/apple-deletion.test.ts#L13) |
| function-variable | `serverFixture.run` | [55](../../tests/apple-deletion.test.ts#L55) |
| function | `clientFixture` | [176](../../tests/apple-deletion.test.ts#L176) |

### tests/apple-revocation.test.ts

[Volledige bron](../../tests/apple-revocation.test.ts), 132 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `fixture` | [7](../../tests/apple-revocation.test.ts#L7) |
| function-variable | `fixture.cleanup` | [48](../../tests/apple-revocation.test.ts#L48) |
| function-variable | `settle` | [71](../../tests/apple-revocation.test.ts#L71) |

### tests/architecture.test.ts

[Volledige bron](../../tests/architecture.test.ts), 56 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `lint` | [7](../../tests/architecture.test.ts#L7) |

### tests/attributed-editor-sync.test.ts

[Volledige bron](../../tests/attributed-editor-sync.test.ts), 84 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `model` | [10](../../tests/attributed-editor-sync.test.ts#L10) |

### tests/audio-download.test.ts

[Volledige bron](../../tests/audio-download.test.ts), 55 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/audio-playback.test.ts

[Volledige bron](../../tests/audio-playback.test.ts), 22 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/audio-provider.test.ts

[Volledige bron](../../tests/audio-provider.test.ts), 561 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `track` | [11](../../tests/audio-provider.test.ts#L11) |
| function | `mount` | [25](../../tests/audio-provider.test.ts#L25) |
| function-variable | `mount.same` | [34](../../tests/audio-provider.test.ts#L34) |
| method | `mount.pause` | [54](../../tests/audio-provider.test.ts#L54) |
| method | `mount.play` | [55](../../tests/audio-provider.test.ts#L55) |
| method | `mount.replace` | [56](../../tests/audio-provider.test.ts#L56) |
| method | `mount.seekTo` | [60](../../tests/audio-provider.test.ts#L60) |
| method | `mount.setPlaybackRate` | [64](../../tests/audio-provider.test.ts#L64) |
| method | `mount.setActiveForLockScreen` | [67](../../tests/audio-provider.test.ts#L67) |
| method | `mount.createElement` | [70](../../tests/audio-provider.test.ts#L70) |
| method | `mount.useRef` | [74](../../tests/audio-provider.test.ts#L74) |
| method | `mount.useState` | [79](../../tests/audio-provider.test.ts#L79) |
| method | `mount.useMemo` | [93](../../tests/audio-provider.test.ts#L93) |
| method | `mount.useCallback` | [99](../../tests/audio-provider.test.ts#L99) |
| method | `mount.useEffect` | [102](../../tests/audio-provider.test.ts#L102) |
| function-variable | `mount.dispatch` | [120](../../tests/audio-provider.test.ts#L120) |
| method | `mount.remove` | [128](../../tests/audio-provider.test.ts#L128) |
| method | `mount.setInterval` | [167](../../tests/audio-provider.test.ts#L167) |
| method | `mount.clearInterval` | [171](../../tests/audio-provider.test.ts#L171) |
| method | `mount.require` | [178](../../tests/audio-provider.test.ts#L178) |
| function | `mount.render` | [183](../../tests/audio-provider.test.ts#L183) |
| method | `mount.advance` | [198](../../tests/audio-provider.test.ts#L198) |
| method | `mount.settle` | [202](../../tests/audio-provider.test.ts#L202) |
| method | `mount.emit` | [211](../../tests/audio-provider.test.ts#L211) |

### tests/audio-queue.test.ts

[Volledige bron](../../tests/audio-queue.test.ts), 32 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/audio-repeat-selection.test.ts

[Volledige bron](../../tests/audio-repeat-selection.test.ts), 120 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/audio-service.test.ts

[Volledige bron](../../tests/audio-service.test.ts), 130 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/audio-ui.test.ts

[Volledige bron](../../tests/audio-ui.test.ts), 423 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `track` | [15](../../tests/audio-ui.test.ts#L15) |
| function | `fixture` | [23](../../tests/audio-ui.test.ts#L23) |
| function-variable | `fixture.record` | [26](../../tests/audio-ui.test.ts#L26) |
| function-variable | `mountMedia` | [121](../../tests/audio-ui.test.ts#L121) |
| method | `onClose` | [230](../../tests/audio-ui.test.ts#L230) |
| method | `onClose` | [262](../../tests/audio-ui.test.ts#L262) |
| method | `onClose` | [283](../../tests/audio-ui.test.ts#L283) |
| method | `onClose` | [310](../../tests/audio-ui.test.ts#L310) |
| function-variable | `event` | [400](../../tests/audio-ui.test.ts#L400) |

### tests/audio.test.ts

[Volledige bron](../../tests/audio.test.ts), 89 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/auth-actor.test.ts

[Volledige bron](../../tests/auth-actor.test.ts), 78 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `switchedAccount` | [6](../../tests/auth-actor.test.ts#L6) |

### tests/auth-callback.test.ts

[Volledige bron](../../tests/auth-callback.test.ts), 154 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/auth-confirmation-service.test.ts

[Volledige bron](../../tests/auth-confirmation-service.test.ts), 46 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/auth-service.test.ts

[Volledige bron](../../tests/auth-service.test.ts), 272 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `fixture` | [7](../../tests/auth-service.test.ts#L7) |

### tests/background-download-contract.test.ts

[Volledige bron](../../tests/background-download-contract.test.ts), 174 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `patchApplication` | [12](../../tests/background-download-contract.test.ts#L12) |
| method | `patchDelegate` | [13](../../tests/background-download-contract.test.ts#L13) |
| method | `configureManifest` | [14](../../tests/background-download-contract.test.ts#L14) |
| function-variable | `task` | [80](../../tests/background-download-contract.test.ts#L80) |
| function-variable | `resolveStart` | [139](../../tests/background-download-contract.test.ts#L139) |

### tests/background-mushaf.test.ts

[Volledige bron](../../tests/background-mushaf.test.ts), 303 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `flush` | [17](../../tests/background-mushaf.test.ts#L17) |
| function | `deferred` | [18](../../tests/background-mushaf.test.ts#L18) |
| function | `task` | [25](../../tests/background-mushaf.test.ts#L25) |
| function | `fixture` | [37](../../tests/background-mushaf.test.ts#L37) |
| function-variable | `fixture.resume` | [40](../../tests/background-mushaf.test.ts#L40) |
| method | `fixture.onResume` | [55](../../tests/background-mushaf.test.ts#L55) |

### tests/book-catalog.test.ts

[Volledige bron](../../tests/book-catalog.test.ts), 41 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/book-presentation.test.ts

[Volledige bron](../../tests/book-presentation.test.ts), 314 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/book-translation-sheet.test.ts

[Volledige bron](../../tests/book-translation-sheet.test.ts), 76 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `dispatch` | [42](../../tests/book-translation-sheet.test.ts#L42) |
| function-variable | `render` | [50](../../tests/book-translation-sheet.test.ts#L50) |
| method | `render.onClose` | [57](../../tests/book-translation-sheet.test.ts#L57) |
| method | `render.onReadText` | [58](../../tests/book-translation-sheet.test.ts#L58) |
| function-variable | `verses` | [61](../../tests/book-translation-sheet.test.ts#L61) |

### tests/book-translation.test.ts

[Volledige bron](../../tests/book-translation.test.ts), 36 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/book-viewport-gestures.test.ts

[Volledige bron](../../tests/book-viewport-gestures.test.ts), 168 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `event` | [6](../../tests/book-viewport-gestures.test.ts#L6) |
| type | `Viewport` | [16](../../tests/book-viewport-gestures.test.ts#L16) |
| function | `harness` | [17](../../tests/book-viewport-gestures.test.ts#L17) |
| method | `harness.scroll` | [33](../../tests/book-viewport-gestures.test.ts#L33) |
| method | `harness.zoom` | [38](../../tests/book-viewport-gestures.test.ts#L38) |
| method | `harness.claimed` | [42](../../tests/book-viewport-gestures.test.ts#L42) |
| function | `claim` | [48](../../tests/book-viewport-gestures.test.ts#L48) |

### tests/bookmarks.test.ts

[Volledige bron](../../tests/bookmarks.test.ts), 207 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `render` | [49](../../tests/bookmarks.test.ts#L49) |

### tests/checklist-input.test.ts

[Volledige bron](../../tests/checklist-input.test.ts), 68 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/community-feed.test.ts

[Volledige bron](../../tests/community-feed.test.ts), 845 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `id` | [26](../../tests/community-feed.test.ts#L26) |
| function | `post` | [28](../../tests/community-feed.test.ts#L28) |
| function-variable | `flush` | [46](../../tests/community-feed.test.ts#L46) |
| function | `deferred` | [47](../../tests/community-feed.test.ts#L47) |
| function | `controlledFeed` | [57](../../tests/community-feed.test.ts#L57) |
| function-variable | `controlledFeed.poll` | [61](../../tests/community-feed.test.ts#L61) |
| method | `controlledFeed.finish` | [89](../../tests/community-feed.test.ts#L89) |
| function | `fixture` | [101](../../tests/community-feed.test.ts#L101) |
| function-variable | `fixture.invalidate` | [106](../../tests/community-feed.test.ts#L106) |
| function-variable | `fixture.status` | [107](../../tests/community-feed.test.ts#L107) |
| function-variable | `fixture.poll` | [112](../../tests/community-feed.test.ts#L112) |
| method | `fixture.every` | [114](../../tests/community-feed.test.ts#L114) |
| method | `fixture.subscribeFeed` | [154](../../tests/community-feed.test.ts#L154) |
| function-variable | `t` | [819](../../tests/community-feed.test.ts#L819) |

### tests/content-assets.test.ts

[Volledige bron](../../tests/content-assets.test.ts), 58 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/continuous-mushaf-lifecycle.test.ts

[Volledige bron](../../tests/continuous-mushaf-lifecycle.test.ts), 152 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Ref` | [9](../../tests/continuous-mushaf-lifecycle.test.ts#L9) |
| type | `Frame` | [10](../../tests/continuous-mushaf-lifecycle.test.ts#L10) |
| method | `Frame.measureInWindow` | [11](../../tests/continuous-mushaf-lifecycle.test.ts#L11) |
| method | `Frame.onLayout` | [12](../../tests/continuous-mushaf-lifecycle.test.ts#L12) |
| type | `List` | [16](../../tests/continuous-mushaf-lifecycle.test.ts#L16) |
| method | `List.scrollToOffset` | [17](../../tests/continuous-mushaf-lifecycle.test.ts#L17) |
| method | `List.onContentSizeChange` | [18](../../tests/continuous-mushaf-lifecycle.test.ts#L18) |
| method | `List.onScroll` | [19](../../tests/continuous-mushaf-lifecycle.test.ts#L19) |
| method | `List.onViewableItemsChanged` | [20](../../tests/continuous-mushaf-lifecycle.test.ts#L20) |
| function | `touch` | [23](../../tests/continuous-mushaf-lifecycle.test.ts#L23) |
| function | `reader` | [31](../../tests/continuous-mushaf-lifecycle.test.ts#L31) |
| function | `reader.render` | [52](../../tests/continuous-mushaf-lifecycle.test.ts#L52) |
| method | `reader.render.onExit` | [64](../../tests/continuous-mushaf-lifecycle.test.ts#L64) |
| method | `reader.render.onZoom` | [65](../../tests/continuous-mushaf-lifecycle.test.ts#L65) |
| method | `reader.render.onSelect` | [66](../../tests/continuous-mushaf-lifecycle.test.ts#L66) |
| method | `reader.render.onError` | [67](../../tests/continuous-mushaf-lifecycle.test.ts#L67) |
| method | `reader.render.scrollTo` | [75](../../tests/continuous-mushaf-lifecycle.test.ts#L75) |

### tests/device-storage.test.ts

[Volledige bron](../../tests/device-storage.test.ts), 143 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `memory` | [6](../../tests/device-storage.test.ts#L6) |
| method | `memory.getItem` | [22](../../tests/device-storage.test.ts#L22) |
| method | `memory.setItem` | [26](../../tests/device-storage.test.ts#L26) |
| method | `memory.removeItem` | [31](../../tests/device-storage.test.ts#L31) |

### tests/dockPreferences.test.ts

[Volledige bron](../../tests/dockPreferences.test.ts), 139 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/domain-rules.test.ts

[Volledige bron](../../tests/domain-rules.test.ts), 88 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/feature-ledger.test.ts

[Volledige bron](../../tests/feature-ledger.test.ts), 75 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Evidence` | [7](../../tests/feature-ledger.test.ts#L7) |
| type | `Feature` | [8](../../tests/feature-ledger.test.ts#L8) |
| function | `currentEvidence` | [23](../../tests/feature-ledger.test.ts#L23) |

### tests/floating-reader-audio.test.ts

[Volledige bron](../../tests/floating-reader-audio.test.ts), 76 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `render` | [54](../../tests/floating-reader-audio.test.ts#L54) |

### tests/focus.test.ts

[Volledige bron](../../tests/focus.test.ts), 43 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/fullscreen-exit-drag.test.ts

[Volledige bron](../../tests/fullscreen-exit-drag.test.ts), 113 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `setValue` | [34](../../tests/fullscreen-exit-drag.test.ts#L34) |
| method | `getTranslateTransform` | [37](../../tests/fullscreen-exit-drag.test.ts#L37) |
| type | `Gesture` | [49](../../tests/fullscreen-exit-drag.test.ts#L49) |
| type | `Handlers` | [50](../../tests/fullscreen-exit-drag.test.ts#L50) |
| function-variable | `render` | [77](../../tests/fullscreen-exit-drag.test.ts#L77) |

### tests/goal-reminder-permission.test.ts

[Volledige bron](../../tests/goal-reminder-permission.test.ts), 144 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `fixture` | [21](../../tests/goal-reminder-permission.test.ts#L21) |
| function-variable | `fixture.apply` | [26](../../tests/goal-reminder-permission.test.ts#L26) |
| method | `fixture.setParams` | [37](../../tests/goal-reminder-permission.test.ts#L37) |
| function-variable | `fixture.render` | [79](../../tests/goal-reminder-permission.test.ts#L79) |
| function | `fixture.save` | [80](../../tests/goal-reminder-permission.test.ts#L80) |

### tests/goals.test.ts

[Volledige bron](../../tests/goals.test.ts), 59 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/group-chat-composer.test.ts

[Volledige bron](../../tests/group-chat-composer.test.ts), 149 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [8](../../tests/group-chat-composer.test.ts#L8) |
| function | `nodes` | [10](../../tests/group-chat-composer.test.ts#L10) |
| function | `conversation` | [17](../../tests/group-chat-composer.test.ts#L17) |
| function | `conversation.load` | [85](../../tests/group-chat-composer.test.ts#L85) |

### tests/group-chat.test.ts

[Volledige bron](../../tests/group-chat.test.ts), 228 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `id` | [13](../../tests/group-chat.test.ts#L13) |
| function-variable | `post` | [15](../../tests/group-chat.test.ts#L15) |
| function | `fixture` | [32](../../tests/group-chat.test.ts#L32) |
| function-variable | `invalidate` | [165](../../tests/group-chat.test.ts#L165) |

### tests/group-join-route.test.ts

[Volledige bron](../../tests/group-join-route.test.ts), 135 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [10](../../tests/group-join-route.test.ts#L10) |
| function | `nodes` | [12](../../tests/group-join-route.test.ts#L12) |
| method | `useState` | [50](../../tests/group-join-route.test.ts#L50) |
| method | `useEffect` | [56](../../tests/group-join-route.test.ts#L56) |
| function | `load` | [88](../../tests/group-join-route.test.ts#L88) |
| function | `render` | [111](../../tests/group-join-route.test.ts#L111) |

### tests/group-join.test.ts

[Volledige bron](../../tests/group-join.test.ts), 117 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/group-keyboard-layout.test.ts

[Volledige bron](../../tests/group-keyboard-layout.test.ts), 377 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [9](../../tests/group-keyboard-layout.test.ts#L9) |
| function | `mountKeyboardScreen` | [11](../../tests/group-keyboard-layout.test.ts#L11) |
| method | `mountKeyboardScreen.createElement` | [59](../../tests/group-keyboard-layout.test.ts#L59) |
| method | `mountKeyboardScreen.useState` | [63](../../tests/group-keyboard-layout.test.ts#L63) |
| method | `mountKeyboardScreen.useRef` | [73](../../tests/group-keyboard-layout.test.ts#L73) |
| method | `mountKeyboardScreen.useEffect` | [79](../../tests/group-keyboard-layout.test.ts#L79) |
| function | `mountKeyboardScreen.load` | [129](../../tests/group-keyboard-layout.test.ts#L129) |
| function | `mountKeyboardScreen.nodes` | [156](../../tests/group-keyboard-layout.test.ts#L156) |
| method | `mountKeyboardScreen.render` | [164](../../tests/group-keyboard-layout.test.ts#L164) |
| method | `mountKeyboardScreen.show` | [179](../../tests/group-keyboard-layout.test.ts#L179) |
| method | `mountKeyboardScreen.hide` | [183](../../tests/group-keyboard-layout.test.ts#L183) |
| method | `mountKeyboardScreen.frames` | [187](../../tests/group-keyboard-layout.test.ts#L187) |
| method | `mountKeyboardScreen.grow` | [193](../../tests/group-keyboard-layout.test.ts#L193) |
| method | `mountKeyboardScreen.reflow` | [201](../../tests/group-keyboard-layout.test.ts#L201) |

### tests/group-operations.test.ts

[Volledige bron](../../tests/group-operations.test.ts), 213 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `fixture` | [27](../../tests/group-operations.test.ts#L27) |

### tests/group-parity-ui.test.ts

[Volledige bron](../../tests/group-parity-ui.test.ts), 213 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [11](../../tests/group-parity-ui.test.ts#L11) |
| function | `renderModule` | [12](../../tests/group-parity-ui.test.ts#L12) |
| method | `renderModule.useState` | [27](../../tests/group-parity-ui.test.ts#L27) |
| method | `renderModule.useRef` | [37](../../tests/group-parity-ui.test.ts#L37) |
| function-variable | `renderModule.t` | [46](../../tests/group-parity-ui.test.ts#L46) |
| function-variable | `renderModule.render` | [81](../../tests/group-parity-ui.test.ts#L81) |
| function-variable | `renderModule.nodes` | [86](../../tests/group-parity-ui.test.ts#L86) |
| function-variable | `renderModule.find` | [92](../../tests/group-parity-ui.test.ts#L92) |
| function | `progressPanel` | [103](../../tests/group-parity-ui.test.ts#L103) |
| function-variable | `visible` | [194](../../tests/group-parity-ui.test.ts#L194) |

### tests/group-progress-parity.test.ts

[Volledige bron](../../tests/group-progress-parity.test.ts), 205 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `entries` | [150](../../tests/group-progress-parity.test.ts#L150) |

### tests/group-progress-reader.test.ts

[Volledige bron](../../tests/group-progress-reader.test.ts), 161 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `id` | [11](../../tests/group-progress-reader.test.ts#L11) |
| type | `Row` | [12](../../tests/group-progress-reader.test.ts#L12) |
| function | `clientFixture` | [23](../../tests/group-progress-reader.test.ts#L23) |
| method | `clientFixture.from` | [30](../../tests/group-progress-reader.test.ts#L30) |
| method | `clientFixture.from.select` | [37](../../tests/group-progress-reader.test.ts#L37) |
| method | `clientFixture.from.eq` | [41](../../tests/group-progress-reader.test.ts#L41) |
| method | `clientFixture.from.order` | [46](../../tests/group-progress-reader.test.ts#L46) |
| method | `clientFixture.from.gt` | [51](../../tests/group-progress-reader.test.ts#L51) |
| method | `clientFixture.from.limit` | [56](../../tests/group-progress-reader.test.ts#L56) |
| method | `clientFixture.from.then` | [61](../../tests/group-progress-reader.test.ts#L61) |
| function | `service` | [84](../../tests/group-progress-reader.test.ts#L84) |

### tests/group-push-policy.test.ts

[Volledige bron](../../tests/group-push-policy.test.ts), 206 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `gate` | [17](../../tests/group-push-policy.test.ts#L17) |

### tests/group-reading.test.ts

[Volledige bron](../../tests/group-reading.test.ts), 37 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `entry` | [9](../../tests/group-reading.test.ts#L9) |

### tests/group-typing.test.ts

[Volledige bron](../../tests/group-typing.test.ts), 498 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `settle` | [15](../../tests/group-typing.test.ts#L15) |
| function | `fixture` | [18](../../tests/group-typing.test.ts#L18) |
| method | `fixture.signal` | [22](../../tests/group-typing.test.ts#L22) |
| method | `fixture.ready` | [23](../../tests/group-typing.test.ts#L23) |
| method | `fixture.connectTyping` | [28](../../tests/group-typing.test.ts#L28) |
| method | `fixture.advance` | [56](../../tests/group-typing.test.ts#L56) |
| method | `fixture.start` | [60](../../tests/group-typing.test.ts#L60) |
| method | `fixture.signal` | [64](../../tests/group-typing.test.ts#L64) |
| function | `portFixture` | [146](../../tests/group-typing.test.ts#L146) |
| method | `portFixture.open` | [158](../../tests/group-typing.test.ts#L158) |
| class | `Controller` | [364](../../tests/group-typing.test.ts#L364) |
| method | `Controller.setCanSend` | [367](../../tests/group-typing.test.ts#L367) |
| method | `Controller.start` | [368](../../tests/group-typing.test.ts#L368) |
| method | `Controller.stop` | [371](../../tests/group-typing.test.ts#L371) |
| method | `Controller.focus` | [374](../../tests/group-typing.test.ts#L374) |
| method | `Controller.blur` | [377](../../tests/group-typing.test.ts#L377) |
| method | `Controller.activity` | [383](../../tests/group-typing.test.ts#L383) |
| method | `focus` | [422](../../tests/group-typing.test.ts#L422) |
| method | `activity` | [423](../../tests/group-typing.test.ts#L423) |
| type | `Element` | [447](../../tests/group-typing.test.ts#L447) |

### tests/helpers/audio-service-harness.ts

[Volledige bron](../../tests/helpers/audio-service-harness.ts), 119 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `audioServiceHarness` | [22](../../tests/helpers/audio-service-harness.ts#L22) |
| function-variable | `audioServiceHarness.path` | [34](../../tests/helpers/audio-service-harness.ts#L34) |
| class | `audioServiceHarness.Directory` | [36](../../tests/helpers/audio-service-harness.ts#L36) |
| method | `audioServiceHarness.Directory.create` | [41](../../tests/helpers/audio-service-harness.ts#L41) |
| class | `audioServiceHarness.File` | [45](../../tests/helpers/audio-service-harness.ts#L45) |
| method | `audioServiceHarness.File.create` | [62](../../tests/helpers/audio-service-harness.ts#L62) |
| method | `audioServiceHarness.File.delete` | [65](../../tests/helpers/audio-service-harness.ts#L65) |
| method | `audioServiceHarness.File.move` | [68](../../tests/helpers/audio-service-harness.ts#L68) |
| method | `audioServiceHarness.File.text` | [72](../../tests/helpers/audio-service-harness.ts#L72) |
| method | `audioServiceHarness.File.write` | [75](../../tests/helpers/audio-service-harness.ts#L75) |
| method | `audioServiceHarness.File.open` | [78](../../tests/helpers/audio-service-harness.ts#L78) |
| method | `audioServiceHarness.File.open.close` | [83](../../tests/helpers/audio-service-harness.ts#L83) |
| method | `audioServiceHarness.File.downloadFileAsync` | [86](../../tests/helpers/audio-service-harness.ts#L86) |
| method | `audioServiceHarness.require` | [108](../../tests/helpers/audio-service-harness.ts#L108) |

### tests/helpers/componentHarness.ts

[Volledige bron](../../tests/helpers/componentHarness.ts), 151 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `TestElement` | [6](../../tests/helpers/componentHarness.ts#L6) |
| function | `componentHarness` | [9](../../tests/helpers/componentHarness.ts#L9) |
| function-variable | `componentHarness.same` | [14](../../tests/helpers/componentHarness.ts#L14) |
| function-variable | `componentHarness.memo` | [16](../../tests/helpers/componentHarness.ts#L16) |
| method | `componentHarness.createElement` | [24](../../tests/helpers/componentHarness.ts#L24) |
| method | `componentHarness.useState` | [27](../../tests/helpers/componentHarness.ts#L27) |
| method | `componentHarness.useRef` | [41](../../tests/helpers/componentHarness.ts#L41) |
| method | `componentHarness.useEffect` | [48](../../tests/helpers/componentHarness.ts#L48) |
| method | `componentHarness.render` | [59](../../tests/helpers/componentHarness.ts#L59) |
| function | `loadComponentModule` | [75](../../tests/helpers/componentHarness.ts#L75) |
| method | `loadComponentModule.require` | [91](../../tests/helpers/componentHarness.ts#L91) |
| function | `elements` | [99](../../tests/helpers/componentHarness.ts#L99) |
| function | `findElement` | [117](../../tests/helpers/componentHarness.ts#L117) |
| function-variable | `press` | [128](../../tests/helpers/componentHarness.ts#L128) |
| function-variable | `change` | [130](../../tests/helpers/componentHarness.ts#L130) |

### tests/helpers/hook-component-harness.ts

[Volledige bron](../../tests/helpers/hook-component-harness.ts), 126 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `HookNode` | [7](../../tests/helpers/hook-component-harness.ts#L7) |
| function | `hookNodes` | [8](../../tests/helpers/hook-component-harness.ts#L8) |
| function | `mountHookComponent` | [14](../../tests/helpers/hook-component-harness.ts#L14) |
| function-variable | `mountHookComponent.same` | [26](../../tests/helpers/hook-component-harness.ts#L26) |
| method | `mountHookComponent.useRef` | [34](../../tests/helpers/hook-component-harness.ts#L34) |
| method | `mountHookComponent.useState` | [39](../../tests/helpers/hook-component-harness.ts#L39) |
| method | `mountHookComponent.useMemo` | [53](../../tests/helpers/hook-component-harness.ts#L53) |
| method | `mountHookComponent.useEffect` | [59](../../tests/helpers/hook-component-harness.ts#L59) |
| method | `mountHookComponent.require` | [89](../../tests/helpers/hook-component-harness.ts#L89) |
| function | `mountHookComponent.render` | [96](../../tests/helpers/hook-component-harness.ts#L96) |
| method | `mountHookComponent.find` | [107](../../tests/helpers/hook-component-harness.ts#L107) |
| method | `mountHookComponent.update` | [113](../../tests/helpers/hook-component-harness.ts#L113) |
| method | `mountHookComponent.settle` | [117](../../tests/helpers/hook-component-harness.ts#L117) |

### tests/helpers/native-pan-responder.ts

[Volledige bron](../../tests/helpers/native-pan-responder.ts), 40 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `nativePanResponder` | [8](../../tests/helpers/native-pan-responder.ts#L8) |
| method | `nativePanResponder.transformSync` | [11](../../tests/helpers/native-pan-responder.ts#L11) |
| function-variable | `nativePanResponder.load` | [17](../../tests/helpers/native-pan-responder.ts#L17) |
| method | `nativePanResponder.load.require` | [31](../../tests/helpers/native-pan-responder.ts#L31) |

### tests/hifz-motivation.test.ts

[Volledige bron](../../tests/hifz-motivation.test.ts), 83 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `entry` | [54](../../tests/hifz-motivation.test.ts#L54) |

### tests/hifz-slider.test.ts

[Volledige bron](../../tests/hifz-slider.test.ts), 13 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/hizb-analytics.test.ts

[Volledige bron](../../tests/hizb-analytics.test.ts), 70 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `row` | [31](../../tests/hizb-analytics.test.ts#L31) |

### tests/hizb-opening.test.ts

[Volledige bron](../../tests/hizb-opening.test.ts), 56 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/home-resume-reference.test.ts

[Volledige bron](../../tests/home-resume-reference.test.ts), 35 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/i18n.test.ts

[Volledige bron](../../tests/i18n.test.ts), 125 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/import-compatibility.test.ts

[Volledige bron](../../tests/import-compatibility.test.ts), 134 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/independent-reminder-review.test.ts

[Volledige bron](../../tests/independent-reminder-review.test.ts), 61 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `hour` | [14](../../tests/independent-reminder-review.test.ts#L14) |
| function-variable | `reminder` | [44](../../tests/independent-reminder-review.test.ts#L44) |

### tests/ios-submit-config.test.ts

[Volledige bron](../../tests/ios-submit-config.test.ts), 73 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `prepare` | [18](../../tests/ios-submit-config.test.ts#L18) |

### tests/journey.test.ts

[Volledige bron](../../tests/journey.test.ts), 23 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/lane-lexicon.test.ts

[Volledige bron](../../tests/lane-lexicon.test.ts), 122 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `port` | [18](../../tests/lane-lexicon.test.ts#L18) |
| function-variable | `hash` | [24](../../tests/lane-lexicon.test.ts#L24) |

### tests/legacy-room-migration.test.ts

[Volledige bron](../../tests/legacy-room-migration.test.ts), 417 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `legacyFixture` | [248](../../tests/legacy-room-migration.test.ts#L248) |

### tests/lexicon-native-content.test.ts

[Volledige bron](../../tests/lexicon-native-content.test.ts), 164 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Element` | [9](../../tests/lexicon-native-content.test.ts#L9) |
| function | `renderComponent` | [11](../../tests/lexicon-native-content.test.ts#L11) |
| function-variable | `render` | [54](../../tests/lexicon-native-content.test.ts#L54) |
| method | `render.onRetry` | [57](../../tests/lexicon-native-content.test.ts#L57) |
| method | `render.onOccurrence` | [57](../../tests/lexicon-native-content.test.ts#L57) |
| method | `render.onRoot` | [57](../../tests/lexicon-native-content.test.ts#L57) |
| method | `render.onLemma` | [57](../../tests/lexicon-native-content.test.ts#L57) |
| function | `assertNativeText` | [61](../../tests/lexicon-native-content.test.ts#L61) |
| method | `onKind` | [149](../../tests/lexicon-native-content.test.ts#L149) |
| method | `onChange` | [150](../../tests/lexicon-native-content.test.ts#L150) |
| method | `onSearch` | [151](../../tests/lexicon-native-content.test.ts#L151) |
| method | `onOpen` | [152](../../tests/lexicon-native-content.test.ts#L152) |

### tests/lexicon.test.ts

[Volledige bron](../../tests/lexicon.test.ts), 292 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `sha256` | [14](../../tests/lexicon.test.ts#L14) |

### tests/local-notification-preferences.test.ts

[Volledige bron](../../tests/local-notification-preferences.test.ts), 32 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/local-reminder-reconciliation.test.ts

[Volledige bron](../../tests/local-reminder-reconciliation.test.ts), 405 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `time` | [14](../../tests/local-reminder-reconciliation.test.ts#L14) |
| function | `planned` | [15](../../tests/local-reminder-reconciliation.test.ts#L15) |
| function | `fixture` | [34](../../tests/local-reminder-reconciliation.test.ts#L34) |
| function | `fixture.load` | [70](../../tests/local-reminder-reconciliation.test.ts#L70) |
| class | `fixture.load.ClockDate` | [95](../../tests/local-reminder-reconciliation.test.ts#L95) |
| method | `fixture.load.ClockDate.now` | [99](../../tests/local-reminder-reconciliation.test.ts#L99) |

### tests/local-reminders-panel.test.ts

[Volledige bron](../../tests/local-reminders-panel.test.ts), 169 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `fixture` | [17](../../tests/local-reminders-panel.test.ts#L17) |
| function-variable | `fixture.render` | [71](../../tests/local-reminders-panel.test.ts#L71) |
| function | `fixture.edit` | [72](../../tests/local-reminders-panel.test.ts#L72) |

### tests/metro-native-artifacts.test.ts

[Volledige bron](../../tests/metro-native-artifacts.test.ts), 184 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `blockList` | [9](../../tests/metro-native-artifacts.test.ts#L9) |
| function-variable | `ignored` | [33](../../tests/metro-native-artifacts.test.ts#L33) |
| method | `startWatching` | [124](../../tests/metro-native-artifacts.test.ts#L124) |
| method | `stopWatching` | [125](../../tests/metro-native-artifacts.test.ts#L125) |
| method | `onFileEvent` | [126](../../tests/metro-native-artifacts.test.ts#L126) |
| method | `onError` | [127](../../tests/metro-native-artifacts.test.ts#L127) |

### tests/mushaf-download-lifecycle.test.ts

[Volledige bron](../../tests/mushaf-download-lifecycle.test.ts), 128 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `find` | [104](../../tests/mushaf-download-lifecycle.test.ts#L104) |

### tests/mushaf-download-manager.test.ts

[Volledige bron](../../tests/mushaf-download-manager.test.ts), 215 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `deferred` | [6](../../tests/mushaf-download-manager.test.ts#L6) |
| function | `clock` | [13](../../tests/mushaf-download-manager.test.ts#L13) |
| method | `clock.advance` | [18](../../tests/mushaf-download-manager.test.ts#L18) |

### tests/mushaf-fullscreen.test.ts

[Volledige bron](../../tests/mushaf-fullscreen.test.ts), 139 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Element` | [25](../../tests/mushaf-fullscreen.test.ts#L25) |
| function-variable | `render` | [72](../../tests/mushaf-fullscreen.test.ts#L72) |
| function | `find` | [76](../../tests/mushaf-fullscreen.test.ts#L76) |

### tests/mushaf-gesture-bridge.test.ts

[Volledige bron](../../tests/mushaf-gesture-bridge.test.ts), 168 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `nativeMotion` | [8](../../tests/mushaf-gesture-bridge.test.ts#L8) |
| function-variable | `emit` | [105](../../tests/mushaf-gesture-bridge.test.ts#L105) |

### tests/mushaf-library.test.ts

[Volledige bron](../../tests/mushaf-library.test.ts), 168 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `bytes` | [27](../../tests/mushaf-library.test.ts#L27) |
| method | `has` | [46](../../tests/mushaf-library.test.ts#L46) |
| method | `fetch` | [49](../../tests/mushaf-library.test.ts#L49) |
| method | `has` | [71](../../tests/mushaf-library.test.ts#L71) |
| method | `fetch` | [74](../../tests/mushaf-library.test.ts#L74) |
| method | `ignored` | [91](../../tests/mushaf-library.test.ts#L91) |
| method | `hasCurrent` | [94](../../tests/mushaf-library.test.ts#L94) |
| method | `validatedSource` | [97](../../tests/mushaf-library.test.ts#L97) |
| method | `copyAtomic` | [100](../../tests/mushaf-library.test.ts#L100) |
| method | `ignored` | [115](../../tests/mushaf-library.test.ts#L115) |
| method | `hasCurrent` | [118](../../tests/mushaf-library.test.ts#L118) |
| method | `validatedSource` | [121](../../tests/mushaf-library.test.ts#L121) |
| method | `copyAtomic` | [124](../../tests/mushaf-library.test.ts#L124) |

### tests/mushaf-native-mount.test.ts

[Volledige bron](../../tests/mushaf-native-mount.test.ts), 526 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [13](../../tests/mushaf-native-mount.test.ts#L13) |
| type | `Effect` | [14](../../tests/mushaf-native-mount.test.ts#L14) |
| function | `textBuffer` | [16](../../tests/mushaf-native-mount.test.ts#L16) |
| function | `wordSpan` | [22](../../tests/mushaf-native-mount.test.ts#L22) |
| function | `findMarker` | [35](../../tests/mushaf-native-mount.test.ts#L35) |
| function | `mount` | [62](../../tests/mushaf-native-mount.test.ts#L62) |
| method | `mount.useState` | [87](../../tests/mushaf-native-mount.test.ts#L87) |
| method | `mount.useRef` | [97](../../tests/mushaf-native-mount.test.ts#L97) |
| method | `mount.useEffect` | [103](../../tests/mushaf-native-mount.test.ts#L103) |
| function | `mount.createFixture` | [120](../../tests/mushaf-native-mount.test.ts#L120) |
| function | `mount.render` | [230](../../tests/mushaf-native-mount.test.ts#L230) |
| function | `mount.render.find` | [255](../../tests/mushaf-native-mount.test.ts#L255) |
| function-variable | `event` | [346](../../tests/mushaf-native-mount.test.ts#L346) |
| function-variable | `event` | [493](../../tests/mushaf-native-mount.test.ts#L493) |

### tests/mushaf-page-metrics.test.ts

[Volledige bron](../../tests/mushaf-page-metrics.test.ts), 96 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/mushaf-page-turn.test.ts

[Volledige bron](../../tests/mushaf-page-turn.test.ts), 56 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/mushaf-presentation-propagation.test.ts

[Volledige bron](../../tests/mushaf-presentation-propagation.test.ts), 94 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/mushaf-reading-toggle.test.ts

[Volledige bron](../../tests/mushaf-reading-toggle.test.ts), 391 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [17](../../tests/mushaf-reading-toggle.test.ts#L17) |
| function | `nodes` | [18](../../tests/mushaf-reading-toggle.test.ts#L18) |
| function | `readerControls` | [25](../../tests/mushaf-reading-toggle.test.ts#L25) |
| method | `readerControls.owner` | [101](../../tests/mushaf-reading-toggle.test.ts#L101) |
| method | `readerControls.render` | [104](../../tests/mushaf-reading-toggle.test.ts#L104) |

### tests/mushaf-reading.test.ts

[Volledige bron](../../tests/mushaf-reading.test.ts), 30 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/mushaf-resume.test.ts

[Volledige bron](../../tests/mushaf-resume.test.ts), 78 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/mushaf-swipe-intent.test.ts

[Volledige bron](../../tests/mushaf-swipe-intent.test.ts), 154 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `swipe` | [7](../../tests/mushaf-swipe-intent.test.ts#L7) |

### tests/mushaf-vertical-rail.test.ts

[Volledige bron](../../tests/mushaf-vertical-rail.test.ts), 148 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [8](../../tests/mushaf-vertical-rail.test.ts#L8) |
| function | `rail` | [10](../../tests/mushaf-vertical-rail.test.ts#L10) |
| method | `rail.update` | [15](../../tests/mushaf-vertical-rail.test.ts#L15) |
| method | `rail.useState` | [30](../../tests/mushaf-vertical-rail.test.ts#L30) |
| method | `rail.useEffect` | [40](../../tests/mushaf-vertical-rail.test.ts#L40) |
| method | `rail.useImperativeHandle` | [41](../../tests/mushaf-vertical-rail.test.ts#L41) |

### tests/mushaf-word-gestures.test.ts

[Volledige bron](../../tests/mushaf-word-gestures.test.ts), 383 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [13](../../tests/mushaf-word-gestures.test.ts#L13) |
| function | `render` | [36](../../tests/mushaf-word-gestures.test.ts#L36) |
| function | `render.visit` | [125](../../tests/mushaf-word-gestures.test.ts#L125) |
| function | `render.event` | [134](../../tests/mushaf-word-gestures.test.ts#L134) |
| function | `buffer` | [251](../../tests/mushaf-word-gestures.test.ts#L251) |

### tests/mushaf-word-selection.test.ts

[Volledige bron](../../tests/mushaf-word-selection.test.ts), 1166 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [27](../../tests/mushaf-word-selection.test.ts#L27) |
| function-variable | `event` | [59](../../tests/mushaf-word-selection.test.ts#L59) |
| function | `screen` | [84](../../tests/mushaf-word-selection.test.ts#L84) |
| function-variable | `screen.same` | [117](../../tests/mushaf-word-selection.test.ts#L117) |
| method | `screen.useState` | [126](../../tests/mushaf-word-selection.test.ts#L126) |
| method | `screen.useRef` | [138](../../tests/mushaf-word-selection.test.ts#L138) |
| method | `screen.useMemo` | [143](../../tests/mushaf-word-selection.test.ts#L143) |
| method | `screen.useEffect` | [149](../../tests/mushaf-word-selection.test.ts#L149) |
| method | `screen.useLayoutEffect` | [167](../../tests/mushaf-word-selection.test.ts#L167) |
| function-variable | `screen.setImmersive` | [177](../../tests/mushaf-word-selection.test.ts#L177) |
| function | `screen.render` | [322](../../tests/mushaf-word-selection.test.ts#L322) |
| function | `screen.render.visit` | [347](../../tests/mushaf-word-selection.test.ts#L347) |
| function-variable | `native` | [403](../../tests/mushaf-word-selection.test.ts#L403) |
| function-variable | `horizontal` | [434](../../tests/mushaf-word-selection.test.ts#L434) |
| function-variable | `choose` | [651](../../tests/mushaf-word-selection.test.ts#L651) |

### tests/mushafScrubber.test.ts

[Volledige bron](../../tests/mushafScrubber.test.ts), 47 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/mutashabihat.test.ts

[Volledige bron](../../tests/mutashabihat.test.ts), 70 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/native-pdf-crop.test.ts

[Volledige bron](../../tests/native-pdf-crop.test.ts), 215 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `adapterHarness` | [112](../../tests/native-pdf-crop.test.ts#L112) |
| function-variable | `available` | [132](../../tests/native-pdf-crop.test.ts#L132) |

### tests/navigationDock.test.ts

[Volledige bron](../../tests/navigationDock.test.ts), 229 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [14](../../tests/navigationDock.test.ts#L14) |
| function | `dock` | [15](../../tests/navigationDock.test.ts#L15) |
| method | `dock.useState` | [27](../../tests/navigationDock.test.ts#L27) |
| function | `dock.render` | [100](../../tests/navigationDock.test.ts#L100) |
| function | `dock.render.visit` | [114](../../tests/navigationDock.test.ts#L114) |
| function-variable | `checkbox` | [145](../../tests/navigationDock.test.ts#L145) |

### tests/note-counts.test.ts

[Volledige bron](../../tests/note-counts.test.ts), 87 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/notes-editor.test.ts

[Volledige bron](../../tests/notes-editor.test.ts), 460 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `load` | [20](../../tests/notes-editor.test.ts#L20) |
| method | `load.require` | [32](../../tests/notes-editor.test.ts#L32) |
| function | `makeNote` | [44](../../tests/notes-editor.test.ts#L44) |
| function-variable | `ids` | [178](../../tests/notes-editor.test.ts#L178) |
| type | `AlertButton` | [208](../../tests/notes-editor.test.ts#L208) |
| function | `editorHarness` | [209](../../tests/notes-editor.test.ts#L209) |
| function-variable | `editorHarness.persistence` | [216](../../tests/notes-editor.test.ts#L216) |
| method | `editorHarness.useState` | [223](../../tests/notes-editor.test.ts#L223) |
| method | `editorHarness.useRef` | [234](../../tests/notes-editor.test.ts#L234) |
| function | `editorHarness.render` | [257](../../tests/notes-editor.test.ts#L257) |
| method | `delete` | [411](../../tests/notes-editor.test.ts#L411) |
| method | `write` | [414](../../tests/notes-editor.test.ts#L414) |
| method | `click` | [435](../../tests/notes-editor.test.ts#L435) |
| method | `createObjectURL` | [446](../../tests/notes-editor.test.ts#L446) |

### tests/notes-format.test.ts

[Volledige bron](../../tests/notes-format.test.ts), 137 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `activeWithoutFlag` | [70](../../tests/notes-format.test.ts#L70) |

### tests/notes-import-library.test.ts

[Volledige bron](../../tests/notes-import-library.test.ts), 265 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `note` | [22](../../tests/notes-import-library.test.ts#L22) |
| function-variable | `commit` | [193](../../tests/notes-import-library.test.ts#L193) |
| method | `usePreventRemove` | [203](../../tests/notes-import-library.test.ts#L203) |
| method | `setOptions` | [233](../../tests/notes-import-library.test.ts#L233) |
| function-variable | `render` | [234](../../tests/notes-import-library.test.ts#L234) |

### tests/notes-library-adapters.test.ts

[Volledige bron](../../tests/notes-library-adapters.test.ts), 179 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `load` | [7](../../tests/notes-library-adapters.test.ts#L7) |
| method | `text` | [54](../../tests/notes-library-adapters.test.ts#L54) |
| type | `Gesture` | [116](../../tests/notes-library-adapters.test.ts#L116) |
| type | `Handlers` | [117](../../tests/notes-library-adapters.test.ts#L117) |
| method | `setValue` | [139](../../tests/notes-library-adapters.test.ts#L139) |
| method | `getTranslateTransform` | [140](../../tests/notes-library-adapters.test.ts#L140) |

### tests/notification-destinations.test.ts

[Volledige bron](../../tests/notification-destinations.test.ts), 66 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/notification-native-permission.test.ts

[Volledige bron](../../tests/notification-native-permission.test.ts), 393 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `module` | [13](../../tests/notification-native-permission.test.ts#L13) |
| function | `fixture` | [33](../../tests/notification-native-permission.test.ts#L33) |
| function | `startupFixture` | [107](../../tests/notification-native-permission.test.ts#L107) |
| function-variable | `startupFixture.load` | [117](../../tests/notification-native-permission.test.ts#L117) |

### tests/notification-system.test.ts

[Volledige bron](../../tests/notification-system.test.ts), 115 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `fixture` | [11](../../tests/notification-system.test.ts#L11) |
| function-variable | `fixture.resumed` | [13](../../tests/notification-system.test.ts#L13) |
| method | `fixture.onResume` | [27](../../tests/notification-system.test.ts#L27) |
| function-variable | `settle` | [36](../../tests/notification-system.test.ts#L36) |

### tests/onboarding-planning-ui.test.ts

[Volledige bron](../../tests/onboarding-planning-ui.test.ts), 98 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `demo` | [8](../../tests/onboarding-planning-ui.test.ts#L8) |
| method | `demo.PlanningDemo` | [44](../../tests/onboarding-planning-ui.test.ts#L44) |
| function-variable | `demo.render` | [48](../../tests/onboarding-planning-ui.test.ts#L48) |

### tests/onboarding.test.ts

[Volledige bron](../../tests/onboarding.test.ts), 39 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/pdf-crop-cache-native.test.ts

[Volledige bron](../../tests/pdf-crop-cache-native.test.ts), 187 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `StoredFile` | [6](../../tests/pdf-crop-cache-native.test.ts#L6) |
| type | `NativeRequest` | [7](../../tests/pdf-crop-cache-native.test.ts#L7) |
| function | `nativeCacheHarness` | [9](../../tests/pdf-crop-cache-native.test.ts#L9) |
| function-variable | `nativeCacheHarness.runNative` | [13](../../tests/pdf-crop-cache-native.test.ts#L13) |
| class | `nativeCacheHarness.Directory` | [18](../../tests/pdf-crop-cache-native.test.ts#L18) |
| method | `nativeCacheHarness.Directory.create` | [23](../../tests/pdf-crop-cache-native.test.ts#L23) |
| class | `nativeCacheHarness.File` | [25](../../tests/pdf-crop-cache-native.test.ts#L25) |
| method | `nativeCacheHarness.File.bytes` | [35](../../tests/pdf-crop-cache-native.test.ts#L35) |
| method | `nativeCacheHarness.File.write` | [38](../../tests/pdf-crop-cache-native.test.ts#L38) |
| method | `nativeCacheHarness.File.delete` | [41](../../tests/pdf-crop-cache-native.test.ts#L41) |
| method | `nativeCacheHarness.File.move` | [44](../../tests/pdf-crop-cache-native.test.ts#L44) |
| method | `nativeCacheHarness.prepareCroppedPdf` | [55](../../tests/pdf-crop-cache-native.test.ts#L55) |
| method | `nativeCacheHarness.cachedCroppedPdfUri` | [56](../../tests/pdf-crop-cache-native.test.ts#L56) |

### tests/pdf-leading-tiles.test.ts

[Volledige bron](../../tests/pdf-leading-tiles.test.ts), 111 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `javaCommand` | [8](../../tests/pdf-leading-tiles.test.ts#L8) |

### tests/pdf-native-runtime.test.ts

[Volledige bron](../../tests/pdf-native-runtime.test.ts), 221 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `javaCommand` | [10](../../tests/pdf-native-runtime.test.ts#L10) |
| function | `method` | [29](../../tests/pdf-native-runtime.test.ts#L29) |

### tests/pdf-reader-zoom.test.ts

[Volledige bron](../../tests/pdf-reader-zoom.test.ts), 395 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [11](../../tests/pdf-reader-zoom.test.ts#L11) |
| function | `pdfHarness` | [13](../../tests/pdf-reader-zoom.test.ts#L13) |
| function-variable | `pdfHarness.setChrome` | [36](../../tests/pdf-reader-zoom.test.ts#L36) |
| function-variable | `pdfHarness.effect` | [38](../../tests/pdf-reader-zoom.test.ts#L38) |
| method | `pdfHarness.useState` | [57](../../tests/pdf-reader-zoom.test.ts#L57) |
| function | `pdfHarness.render` | [165](../../tests/pdf-reader-zoom.test.ts#L165) |
| function | `pdfHarness.render.visit` | [177](../../tests/pdf-reader-zoom.test.ts#L177) |

### tests/planned-passage.test.ts

[Volledige bron](../../tests/planned-passage.test.ts), 25 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/planning-reminders.test.ts

[Volledige bron](../../tests/planning-reminders.test.ts), 151 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `plan` | [13](../../tests/planning-reminders.test.ts#L13) |
| class | `FakePort` | [38](../../tests/planning-reminders.test.ts#L38) |
| method | `FakePort.list` | [46](../../tests/planning-reminders.test.ts#L46) |
| method | `FakePort.schedule` | [49](../../tests/planning-reminders.test.ts#L49) |
| method | `FakePort.cancel` | [55](../../tests/planning-reminders.test.ts#L55) |

### tests/profiles-service.test.ts

[Volledige bron](../../tests/profiles-service.test.ts), 293 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `profiles` | [14](../../tests/profiles-service.test.ts#L14) |
| method | `profiles.from` | [37](../../tests/profiles-service.test.ts#L37) |
| method | `profiles.from.select` | [40](../../tests/profiles-service.test.ts#L40) |
| method | `profiles.from.select.eq` | [43](../../tests/profiles-service.test.ts#L43) |
| method | `profiles.from.upsert` | [50](../../tests/profiles-service.test.ts#L50) |
| method | `profiles.from` | [57](../../tests/profiles-service.test.ts#L57) |
| method | `profiles.from.upload` | [60](../../tests/profiles-service.test.ts#L60) |
| method | `profiles.from.getPublicUrl` | [64](../../tests/profiles-service.test.ts#L64) |
| function-variable | `profiles.createService` | [71](../../tests/profiles-service.test.ts#L71) |

### tests/progress-actions.test.ts

[Volledige bron](../../tests/progress-actions.test.ts), 119 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/quick-check-in.test.ts

[Volledige bron](../../tests/quick-check-in.test.ts), 61 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/readOnlyAssetDatabase.test.ts

[Volledige bron](../../tests/readOnlyAssetDatabase.test.ts), 121 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `loader` | [7](../../tests/readOnlyAssetDatabase.test.ts#L7) |
| function-variable | `loader.record` | [9](../../tests/readOnlyAssetDatabase.test.ts#L9) |

### tests/reader-chrome-owners.test.ts

[Volledige bron](../../tests/reader-chrome-owners.test.ts), 32 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/reader-lifecycle.test.ts

[Volledige bron](../../tests/reader-lifecycle.test.ts), 722 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Node` | [22](../../tests/reader-lifecycle.test.ts#L22) |
| type | `Effect` | [23](../../tests/reader-lifecycle.test.ts#L23) |
| function | `nodes` | [25](../../tests/reader-lifecycle.test.ts#L25) |
| function | `mountReader` | [32](../../tests/reader-lifecycle.test.ts#L32) |
| function-variable | `mountReader.dispatch` | [43](../../tests/reader-lifecycle.test.ts#L43) |
| function-variable | `mountReader.setChrome` | [44](../../tests/reader-lifecycle.test.ts#L44) |
| function-variable | `mountReader.effect` | [46](../../tests/reader-lifecycle.test.ts#L46) |
| method | `mountReader.useState` | [68](../../tests/reader-lifecycle.test.ts#L68) |
| method | `mountReader.useRef` | [78](../../tests/reader-lifecycle.test.ts#L78) |
| method | `mountReader.render` | [196](../../tests/reader-lifecycle.test.ts#L196) |
| method | `mountReader.unmount` | [202](../../tests/reader-lifecycle.test.ts#L202) |
| function-variable | `find` | [229](../../tests/reader-lifecycle.test.ts#L229) |

### tests/reader-listen-button.test.ts

[Volledige bron](../../tests/reader-listen-button.test.ts), 85 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `render` | [49](../../tests/reader-listen-button.test.ts#L49) |

### tests/reader-page-history.test.ts

[Volledige bron](../../tests/reader-page-history.test.ts), 71 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `entry` | [7](../../tests/reader-page-history.test.ts#L7) |

### tests/reader-parity.test.ts

[Volledige bron](../../tests/reader-parity.test.ts), 951 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Element` | [25](../../tests/reader-parity.test.ts#L25) |
| function | `evaluate` | [26](../../tests/reader-parity.test.ts#L26) |
| function | `nodes` | [48](../../tests/reader-parity.test.ts#L48) |
| function | `hookHarness` | [72](../../tests/reader-parity.test.ts#L72) |
| function-variable | `hookHarness.memo` | [76](../../tests/reader-parity.test.ts#L76) |
| function-variable | `render` | [393](../../tests/reader-parity.test.ts#L393) |
| function-variable | `render` | [619](../../tests/reader-parity.test.ts#L619) |
| function-variable | `render` | [700](../../tests/reader-parity.test.ts#L700) |
| class | `Directory` | [768](../../tests/reader-parity.test.ts#L768) |
| method | `Directory.create` | [773](../../tests/reader-parity.test.ts#L773) |
| class | `File` | [775](../../tests/reader-parity.test.ts#L775) |
| method | `File.bytes` | [785](../../tests/reader-parity.test.ts#L785) |
| method | `File.write` | [788](../../tests/reader-parity.test.ts#L788) |
| method | `File.delete` | [793](../../tests/reader-parity.test.ts#L793) |
| method | `File.move` | [796](../../tests/reader-parity.test.ts#L796) |

### tests/reader-position-persistence.test.ts

[Volledige bron](../../tests/reader-position-persistence.test.ts), 37 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/reader-scroll-anchor.test.ts

[Volledige bron](../../tests/reader-scroll-anchor.test.ts), 56 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/reader-source-assets.test.ts

[Volledige bron](../../tests/reader-source-assets.test.ts), 75 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `sha256` | [16](../../tests/reader-source-assets.test.ts#L16) |

### tests/reading-journey.test.ts

[Volledige bron](../../tests/reading-journey.test.ts), 101 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/reading-mode-layout.test.ts

[Volledige bron](../../tests/reading-mode-layout.test.ts), 36 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/reading-plan-screen.test.ts

[Volledige bron](../../tests/reading-plan-screen.test.ts), 85 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `render` | [59](../../tests/reading-plan-screen.test.ts#L59) |

### tests/reading-plan.test.ts

[Volledige bron](../../tests/reading-plan.test.ts), 120 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `row` | [16](../../tests/reading-plan.test.ts#L16) |
| function-variable | `closeTo` | [29](../../tests/reading-plan.test.ts#L29) |

### tests/reading-statistics-page-navigation.test.ts

[Volledige bron](../../tests/reading-statistics-page-navigation.test.ts), 104 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/realtime-readiness.test.ts

[Volledige bron](../../tests/realtime-readiness.test.ts), 93 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `anonKey` | [10](../../tests/realtime-readiness.test.ts#L10) |
| method | `on` | [53](../../tests/realtime-readiness.test.ts#L53) |
| method | `subscribe` | [56](../../tests/realtime-readiness.test.ts#L56) |
| method | `channel` | [61](../../tests/realtime-readiness.test.ts#L61) |
| method | `removeChannel` | [65](../../tests/realtime-readiness.test.ts#L65) |

### tests/reducer.test.ts

[Volledige bron](../../tests/reducer.test.ts), 96 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/reference-database-platform.test.ts

[Volledige bron](../../tests/reference-database-platform.test.ts), 110 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `loader` | [8](../../tests/reference-database-platform.test.ts#L8) |

### tests/release-config.test.ts

[Volledige bron](../../tests/release-config.test.ts), 107 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `check` | [20](../../tests/release-config.test.ts#L20) |

### tests/reminder-transaction.test.ts

[Volledige bron](../../tests/reminder-transaction.test.ts), 36 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/repeat-sheet.test.ts

[Volledige bron](../../tests/repeat-sheet.test.ts), 309 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `mount` | [14](../../tests/repeat-sheet.test.ts#L14) |
| method | `mount.setRate` | [62](../../tests/repeat-sheet.test.ts#L62) |
| method | `mount.playQueue` | [63](../../tests/repeat-sheet.test.ts#L63) |
| method | `mount.onClose` | [79](../../tests/repeat-sheet.test.ts#L79) |
| function-variable | `mount.render` | [88](../../tests/repeat-sheet.test.ts#L88) |
| method | `mount.field` | [94](../../tests/repeat-sheet.test.ts#L94) |
| method | `mount.pages` | [99](../../tests/repeat-sheet.test.ts#L99) |
| method | `mount.mode` | [108](../../tests/repeat-sheet.test.ts#L108) |
| method | `mount.count` | [117](../../tests/repeat-sheet.test.ts#L117) |
| method | `mount.reciter` | [126](../../tests/repeat-sheet.test.ts#L126) |
| method | `mount.start` | [131](../../tests/repeat-sheet.test.ts#L131) |
| function-variable | `fileNames` | [144](../../tests/repeat-sheet.test.ts#L144) |

### tests/reveal-viewport.test.ts

[Volledige bron](../../tests/reveal-viewport.test.ts), 56 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/secure-session.test.ts

[Volledige bron](../../tests/secure-session.test.ts), 48 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/segments-literal.test.ts

[Volledige bron](../../tests/segments-literal.test.ts), 50 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Element` | [9](../../tests/segments-literal.test.ts#L9) |

### tests/selectable-mushaf-text.test.ts

[Volledige bron](../../tests/selectable-mushaf-text.test.ts), 188 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `sourceWord` | [33](../../tests/selectable-mushaf-text.test.ts#L33) |
| function | `fullPage` | [44](../../tests/selectable-mushaf-text.test.ts#L44) |
| function | `measured` | [55](../../tests/selectable-mushaf-text.test.ts#L55) |

### tests/selectable-mushaf.test.ts

[Volledige bron](../../tests/selectable-mushaf.test.ts), 237 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `word` | [14](../../tests/selectable-mushaf.test.ts#L14) |
| function | `response` | [26](../../tests/selectable-mushaf.test.ts#L26) |

### tests/selectable-warsh.test.ts

[Volledige bron](../../tests/selectable-warsh.test.ts), 275 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `parseExcerpt` | [15](../../tests/selectable-warsh.test.ts#L15) |
| function | `serviceModule` | [148](../../tests/selectable-warsh.test.ts#L148) |

### tests/shared-text.test.ts

[Volledige bron](../../tests/shared-text.test.ts), 41 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/snapshot-writer.test.ts

[Volledige bron](../../tests/snapshot-writer.test.ts), 71 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `gate` | [5](../../tests/snapshot-writer.test.ts#L5) |

### tests/state-hydration.test.ts

[Volledige bron](../../tests/state-hydration.test.ts), 267 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `memoryStorage` | [17](../../tests/state-hydration.test.ts#L17) |
| method | `memoryStorage.getItem` | [23](../../tests/state-hydration.test.ts#L23) |
| method | `memoryStorage.setItem` | [26](../../tests/state-hydration.test.ts#L26) |
| function-variable | `importLegacy` | [66](../../tests/state-hydration.test.ts#L66) |
| function-variable | `migration` | [164](../../tests/state-hydration.test.ts#L164) |

### tests/statistics-surface.test.ts

[Volledige bron](../../tests/statistics-surface.test.ts), 202 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `Element` | [7](../../tests/statistics-surface.test.ts#L7) |
| type | `Props` | [8](../../tests/statistics-surface.test.ts#L8) |
| function | `flatten` | [11](../../tests/statistics-surface.test.ts#L11) |
| function | `textContent` | [16](../../tests/statistics-surface.test.ts#L16) |
| function | `fixture` | [22](../../tests/statistics-surface.test.ts#L22) |
| function | `fixture.load` | [55](../../tests/statistics-surface.test.ts#L55) |
| function | `fixture.render` | [75](../../tests/statistics-surface.test.ts#L75) |
| function | `fixture.decoration` | [79](../../tests/statistics-surface.test.ts#L79) |
| function | `fixture.pattern` | [88](../../tests/statistics-surface.test.ts#L88) |

### tests/statistics.test.ts

[Volledige bron](../../tests/statistics.test.ts), 281 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `row` | [18](../../tests/statistics.test.ts#L18) |

### tests/store-commit.test.ts

[Volledige bron](../../tests/store-commit.test.ts), 215 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `TestSession` | [11](../../tests/store-commit.test.ts#L11) |
| type | `TestAuth` | [12](../../tests/store-commit.test.ts#L12) |
| function | `storeHarness` | [17](../../tests/store-commit.test.ts#L17) |

### tests/study-domain.test.ts

[Volledige bron](../../tests/study-domain.test.ts), 15 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/study-providers.test.ts

[Volledige bron](../../tests/study-providers.test.ts), 130 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/study-request.test.ts

[Volledige bron](../../tests/study-request.test.ts), 188 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `deferred` | [17](../../tests/study-request.test.ts#L17) |
| method | `start` | [142](../../tests/study-request.test.ts#L142) |
| method | `start` | [175](../../tests/study-request.test.ts#L175) |

### tests/study-source-navigation.test.ts

[Volledige bron](../../tests/study-source-navigation.test.ts), 127 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `mount` | [15](../../tests/study-source-navigation.test.ts#L15) |
| function-variable | `mount.nodes` | [49](../../tests/study-source-navigation.test.ts#L49) |
| method | `mount.find` | [55](../../tests/study-source-navigation.test.ts#L55) |
| method | `mount.settle` | [63](../../tests/study-source-navigation.test.ts#L63) |
| function-variable | `previous` | [75](../../tests/study-source-navigation.test.ts#L75) |
| function-variable | `next` | [76](../../tests/study-source-navigation.test.ts#L76) |

### tests/tracking-parity.test.ts

[Volledige bron](../../tests/tracking-parity.test.ts), 185 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function-variable | `entry` | [121](../../tests/tracking-parity.test.ts#L121) |

### tests/tracking-recheck-components.test.ts

[Volledige bron](../../tests/tracking-recheck-components.test.ts), 148 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| method | `navigate` | [57](../../tests/tracking-recheck-components.test.ts#L57) |
| function | `renderChecklist` | [63](../../tests/tracking-recheck-components.test.ts#L63) |

### tests/tracking-ui.test.ts

[Volledige bron](../../tests/tracking-ui.test.ts), 525 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `mount` | [39](../../tests/tracking-ui.test.ts#L39) |
| function-variable | `mount.persist` | [51](../../tests/tracking-ui.test.ts#L51) |
| function-variable | `mount.dispatch` | [57](../../tests/tracking-ui.test.ts#L57) |
| function-variable | `mount.commit` | [60](../../tests/tracking-ui.test.ts#L60) |
| method | `mount.navigate` | [122](../../tests/tracking-ui.test.ts#L122) |
| method | `mount.setParams` | [129](../../tests/tracking-ui.test.ts#L129) |
| method | `mount.now` | [155](../../tests/tracking-ui.test.ts#L155) |
| function | `button` | [187](../../tests/tracking-ui.test.ts#L187) |

### tests/translations.test.ts

[Volledige bron](../../tests/translations.test.ts), 38 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### tests/warsh-font.test.ts

[Volledige bron](../../tests/warsh-font.test.ts), 108 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `unicodeCmap` | [7](../../tests/warsh-font.test.ts#L7) |
| function-variable | `unicodeCmap.u16` | [8](../../tests/warsh-font.test.ts#L8) |
| function-variable | `unicodeCmap.u32` | [9](../../tests/warsh-font.test.ts#L9) |

### tests/warsh-offline-provider.test.ts

[Volledige bron](../../tests/warsh-offline-provider.test.ts), 72 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `loadModule` | [8](../../tests/warsh-offline-provider.test.ts#L8) |
| function-variable | `network` | [30](../../tests/warsh-offline-provider.test.ts#L30) |

## Supabase-functions, migraties en tests

### supabase/functions/apple-account-delete/appleProvider.ts

[Volledige bron](../../../supabase/functions/apple-account-delete/appleProvider.ts), 114 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `AppleConfiguration` | [9](../../../supabase/functions/apple-account-delete/appleProvider.ts#L9) |
| function | `verifyAppleIdentity` | [20](../../../supabase/functions/apple-account-delete/appleProvider.ts#L20) |
| function | `createAppleProvider` | [49](../../../supabase/functions/apple-account-delete/appleProvider.ts#L49) |
| function | `createAppleProvider.clientSecret` | [53](../../../supabase/functions/apple-account-delete/appleProvider.ts#L53) |
| function | `createAppleProvider.post` | [67](../../../supabase/functions/apple-account-delete/appleProvider.ts#L67) |
| method | `createAppleProvider.exchangeCode` | [90](../../../supabase/functions/apple-account-delete/appleProvider.ts#L90) |
| method | `createAppleProvider.revoke` | [106](../../../supabase/functions/apple-account-delete/appleProvider.ts#L106) |

### supabase/functions/apple-account-delete/appleProvider_test.ts

[Volledige bron](../../../supabase/functions/apple-account-delete/appleProvider_test.ts), 180 regels, rol: test.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `token` | [25](../../../supabase/functions/apple-account-delete/appleProvider_test.ts#L25) |

### supabase/functions/apple-account-delete/handler.ts

[Volledige bron](../../../supabase/functions/apple-account-delete/handler.ts), 124 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| class | `AppleDeletionError` | [1](../../../supabase/functions/apple-account-delete/handler.ts#L1) |
| type | `AppleDeletionPorts` | [9](../../../supabase/functions/apple-account-delete/handler.ts#L9) |
| method | `AppleDeletionPorts.configured` | [10](../../../supabase/functions/apple-account-delete/handler.ts#L10) |
| method | `AppleDeletionPorts.actor` | [11](../../../supabase/functions/apple-account-delete/handler.ts#L11) |
| method | `AppleDeletionPorts.preflight` | [14](../../../supabase/functions/apple-account-delete/handler.ts#L14) |
| method | `AppleDeletionPorts.verifyIdentity` | [15](../../../supabase/functions/apple-account-delete/handler.ts#L15) |
| method | `AppleDeletionPorts.exchangeCode` | [19](../../../supabase/functions/apple-account-delete/handler.ts#L19) |
| method | `AppleDeletionPorts.authenticate` | [22](../../../supabase/functions/apple-account-delete/handler.ts#L22) |
| method | `AppleDeletionPorts.revoke` | [26](../../../supabase/functions/apple-account-delete/handler.ts#L26) |
| method | `AppleDeletionPorts.deleteAccount` | [27](../../../supabase/functions/apple-account-delete/handler.ts#L27) |
| method | `AppleDeletionPorts.closeSession` | [28](../../../supabase/functions/apple-account-delete/handler.ts#L28) |
| function-variable | `response` | [30](../../../supabase/functions/apple-account-delete/handler.ts#L30) |
| function | `createAppleDeletionHandler` | [37](../../../supabase/functions/apple-account-delete/handler.ts#L37) |

### supabase/functions/apple-account-delete/index.ts

[Volledige bron](../../../supabase/functions/apple-account-delete/index.ts), 88 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `api` | [13](../../../supabase/functions/apple-account-delete/index.ts#L13) |
| method | `actor` | [47](../../../supabase/functions/apple-account-delete/index.ts#L47) |
| method | `authenticate` | [71](../../../supabase/functions/apple-account-delete/index.ts#L71) |

### supabase/functions/group-push/apns-contract.ts

[Volledige bron](../../../supabase/functions/group-push/apns-contract.ts), 34 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| type | `ApnsDelivery` | [3](../../../supabase/functions/group-push/apns-contract.ts#L3) |
| type | `ApnsAuth` | [6](../../../supabase/functions/group-push/apns-contract.ts#L6) |
| function | `buildApnsRequest` | [8](../../../supabase/functions/group-push/apns-contract.ts#L8) |
| function | `apnsOutcome` | [29](../../../supabase/functions/group-push/apns-contract.ts#L29) |

### supabase/functions/group-push/index.ts

[Volledige bron](../../../supabase/functions/group-push/index.ts), 123 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `rpc` | [6](../../../supabase/functions/group-push/index.ts#L6) |
| function-variable | `b64` | [15](../../../supabase/functions/group-push/index.ts#L15) |
| function-variable | `encode` | [16](../../../supabase/functions/group-push/index.ts#L16) |
| function | `credentials` | [18](../../../supabase/functions/group-push/index.ts#L18) |
| function | `apnsCredentials` | [38](../../../supabase/functions/group-push/index.ts#L38) |
| function | `sendApns` | [60](../../../supabase/functions/group-push/index.ts#L60) |

### supabase/functions/group-push/notification-copy.ts

[Volledige bron](../../../supabase/functions/group-push/notification-copy.ts), 10 regels, rol: implementation.

| Soort | Declaratie | Regel |
| --- | --- | --- |
| function | `curatedReplyText` | [9](../../../supabase/functions/group-push/notification-copy.ts#L9) |

### supabase/migrations/20260904210000_group_detail_v2_foundation.sql

[Volledige bron](../../../supabase/migrations/20260904210000_group_detail_v2_foundation.sql), 827 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260904211000_fix_post_comment_parent_integrity.sql

[Volledige bron](../../../supabase/migrations/20260904211000_fix_post_comment_parent_integrity.sql), 41 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260904220000_group_detail_v2_legacy_compat.sql

[Volledige bron](../../../supabase/migrations/20260904220000_group_detail_v2_legacy_compat.sql), 74 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260904221000_migrate_reading_groups_to_v2.sql

[Volledige bron](../../../supabase/migrations/20260904221000_migrate_reading_groups_to_v2.sql), 308 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260904230000_group_detail_v2_app_api.sql

[Volledige bron](../../../supabase/migrations/20260904230000_group_detail_v2_app_api.sql), 523 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260904233000_group_feed_v2_actions.sql

[Volledige bron](../../../supabase/migrations/20260904233000_group_feed_v2_actions.sql), 359 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260904_add_reading_group_owner_delete_policy.sql

[Volledige bron](../../../supabase/migrations/20260904_add_reading_group_owner_delete_policy.sql), 6 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260905010000_group_membership_v2_actions.sql

[Volledige bron](../../../supabase/migrations/20260905010000_group_membership_v2_actions.sql), 582 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260905020000_group_media_v2_actions.sql

[Volledige bron](../../../supabase/migrations/20260905020000_group_media_v2_actions.sql), 384 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260905030000_group_tasks_v2_actions.sql

[Volledige bron](../../../supabase/migrations/20260905030000_group_tasks_v2_actions.sql), 254 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260905040000_group_events_profiles_points_v3.sql

[Volledige bron](../../../supabase/migrations/20260905040000_group_events_profiles_points_v3.sql), 518 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260906010000_group_management_api_v2.sql

[Volledige bron](../../../supabase/migrations/20260906010000_group_management_api_v2.sql), 688 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260907010000_group_logos.sql

[Volledige bron](../../../supabase/migrations/20260907010000_group_logos.sql), 69 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260916010000_notification_delivery_foundation.sql

[Volledige bron](../../../supabase/migrations/20260916010000_notification_delivery_foundation.sql), 114 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20260916020000_notification_grants_and_legacy_lockdown.sql

[Volledige bron](../../../supabase/migrations/20260916020000_notification_grants_and_legacy_lockdown.sql), 17 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261007010000_account_management.sql

[Volledige bron](../../../supabase/migrations/20261007010000_account_management.sql), 100 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261009070000_idempotent_group_invitation_acceptance.sql

[Volledige bron](../../../supabase/migrations/20261009070000_idempotent_group_invitation_acceptance.sql), 105 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261009120000_group_member_permissions.sql

[Volledige bron](../../../supabase/migrations/20261009120000_group_member_permissions.sql), 102 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261009140000_live_group_profile_names.sql

[Volledige bron](../../../supabase/migrations/20261009140000_live_group_profile_names.sql), 74 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261009160000_allow_redacted_deleted_comments.sql

[Volledige bron](../../../supabase/migrations/20261009160000_allow_redacted_deleted_comments.sql), 67 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261009180000_group_reply_push.sql

[Volledige bron](../../../supabase/migrations/20261009180000_group_reply_push.sql), 140 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261009181000_group_push_dispatcher.sql

[Volledige bron](../../../supabase/migrations/20261009181000_group_push_dispatcher.sql), 46 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261009190000_immediate_group_push_and_mute.sql

[Volledige bron](../../../supabase/migrations/20261009190000_immediate_group_push_and_mute.sql), 66 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261113090000_group_push_ios.sql

[Volledige bron](../../../supabase/migrations/20261113090000_group_push_ios.sql), 51 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261114120000_group_feed_realtime.sql

[Volledige bron](../../../supabase/migrations/20261114120000_group_feed_realtime.sql), 30 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/migrations/20261115090000_group_typing_private.sql

[Volledige bron](../../../supabase/migrations/20261115090000_group_typing_private.sql), 121 regels, rol: implementation.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_comment_deletion.sql

[Volledige bron](../../../supabase/tests/group_comment_deletion.sql), 35 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_detail_v2_app_api.sql

[Volledige bron](../../../supabase/tests/group_detail_v2_app_api.sql), 109 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_detail_v2_authorization.sql

[Volledige bron](../../../supabase/tests/group_detail_v2_authorization.sql), 109 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_detail_v2_foundation.sql

[Volledige bron](../../../supabase/tests/group_detail_v2_foundation.sql), 93 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_detail_v2_legacy_migration.sql

[Volledige bron](../../../supabase/tests/group_detail_v2_legacy_migration.sql), 121 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_events_profiles_points_v3.sql

[Volledige bron](../../../supabase/tests/group_events_profiles_points_v3.sql), 89 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_feed_v2_actions.sql

[Volledige bron](../../../supabase/tests/group_feed_v2_actions.sql), 126 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_logos.sql

[Volledige bron](../../../supabase/tests/group_logos.sql), 38 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_management_api_v2.sql

[Volledige bron](../../../supabase/tests/group_management_api_v2.sql), 143 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_media_v2_actions.sql

[Volledige bron](../../../supabase/tests/group_media_v2_actions.sql), 143 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_member_permissions.sql

[Volledige bron](../../../supabase/tests/group_member_permissions.sql), 85 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_membership_v2_actions.sql

[Volledige bron](../../../supabase/tests/group_membership_v2_actions.sql), 134 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_profile_names.sql

[Volledige bron](../../../supabase/tests/group_profile_names.sql), 34 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_reply_push.sql

[Volledige bron](../../../supabase/tests/group_reply_push.sql), 56 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_reply_push_ios.sql

[Volledige bron](../../../supabase/tests/group_reply_push_ios.sql), 38 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_tasks_v2_actions.sql

[Volledige bron](../../../supabase/tests/group_tasks_v2_actions.sql), 91 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/group_typing_private.sql

[Volledige bron](../../../supabase/tests/group_typing_private.sql), 83 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

### supabase/tests/invitation_acceptance_idempotency.sql

[Volledige bron](../../../supabase/tests/invitation_acceptance_idempotency.sql), 58 regels, rol: test.

Geen benoemde declaraties in deze index; zie de volledige bron.

