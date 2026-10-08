package com.Ameender.qurantracker.data

import org.junit.Assert.*
import org.junit.Test

class OnboardingStepTest {
    @Test fun sixStepsHaveStableUniqueIdsAndBoundedNavigation() {
        assertEquals(6, OnboardingStep.entries.size)
        assertEquals(6, OnboardingStep.entries.map { it.id }.toSet().size)
        assertNull(OnboardingStep.READING.previous)
        assertNull(OnboardingStep.GROUPS.next)
        OnboardingStep.entries.forEach {
            assertEquals(it, OnboardingStep.fromId(it.id))
            it.next?.let { next -> assertEquals(it, next.previous) }
        }
    }
    @Test fun unknownSavedStepFallsBackSafely() {
        assertEquals(OnboardingStep.READING, OnboardingStep.fromId(null))
        assertEquals(OnboardingStep.READING, OnboardingStep.fromId("obsolete"))
    }
    @Test fun completedAndLegacyUsersRemainOutsideIntroduction() {
        assertEquals(LanguageEntryStage.COMPLETED, resolveLanguageEntry("COMPLETED", true))
        assertEquals(LanguageEntryStage.EXISTING_USER, resolveLanguageEntry("EXISTING_USER", true))
        assertEquals(LanguageEntryStage.INTRO_PENDING, resolveLanguageEntry("INTRO_PENDING", true))
    }
}
