package com.Ameender.qurantracker.data

import org.junit.Assert.assertEquals
import org.junit.Test

class LanguageEntryTest {
    @Test fun freshInstallStartsWithLanguage() {
        assertEquals(LanguageEntryStage.LANGUAGE, resolveLanguageEntry(null, false))
    }
    @Test fun existingUsersBypassLanguage() {
        assertEquals(LanguageEntryStage.EXISTING_USER, resolveLanguageEntry(null, true))
    }
    @Test fun interruptedSelectionDoesNotBecomeExistingUser() {
        assertEquals(LanguageEntryStage.LANGUAGE, resolveLanguageEntry("LANGUAGE", true))
    }
    @Test fun continueKeepsPhaseTwoPendingOnRestart() {
        assertEquals(LanguageEntryStage.INTRO_PENDING, resolveLanguageEntry("INTRO_PENDING", true))
    }
    @Test fun existingUserMarkerSurvivesRestart() {
        assertEquals(LanguageEntryStage.EXISTING_USER, resolveLanguageEntry("EXISTING_USER", false))
    }
    @Test fun invalidStateConservativelyPreservesExistingUser() {
        assertEquals(LanguageEntryStage.EXISTING_USER, resolveLanguageEntry("invalid", true))
    }
    @Test fun allSupportedLanguagesRoundTrip() {
        AppLanguage.entries.forEach { assertEquals(it, AppLanguage.fromCode(it.code)) }
        assertEquals(AppLanguage.Dutch, AppLanguage.fromCode("fr"))
        assertEquals(AppLanguage.Dutch, AppLanguage.fromCode(null))
    }
}
