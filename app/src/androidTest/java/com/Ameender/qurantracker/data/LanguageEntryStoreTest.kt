package com.Ameender.qurantracker.data

import android.content.Context
import android.content.ContextWrapper
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.UUID

class LanguageEntryStoreTest {
    @Test fun preferencesAndPendingStageSurviveStoreRecreation() {
        val base = InstrumentationRegistry.getInstrumentation().targetContext
        val testName = "language_entry_test_${UUID.randomUUID()}"
        val isolatedContext = object : ContextWrapper(base) {
            override fun getSharedPreferences(name: String, mode: Int) =
                base.getSharedPreferences(testName, mode)
        }
        val prefs = isolatedContext.getSharedPreferences("settings", Context.MODE_PRIVATE)
        try {
            prefs.edit().putString("onboarding_language_stage_v1", "LANGUAGE").commit()
            for (language in AppLanguage.entries) {
                LanguageEntryStore(isolatedContext).select(language)
                val recreated = LanguageEntryStore(isolatedContext)
                assertEquals(language, recreated.language())
                assertEquals(LanguageEntryStage.LANGUAGE, recreated.initialStage)
            }
            LanguageEntryStore(isolatedContext).continueToIntro(AppLanguage.Arabic)
            val continued = LanguageEntryStore(isolatedContext)
            assertEquals(LanguageEntryStage.INTRO_PENDING, continued.initialStage)
            assertEquals(AppLanguage.Arabic, continued.language())
            assertEquals(OnboardingStep.READING, continued.introStep())
            continued.saveIntroStep(OnboardingStep.PLANNING)
            val resumed = LanguageEntryStore(isolatedContext)
            assertEquals(LanguageEntryStage.INTRO_PENDING, resumed.initialStage)
            assertEquals(OnboardingStep.PLANNING, resumed.introStep())
            resumed.saveIntroStep(OnboardingStep.GROUPS)
            assertEquals(LanguageEntryStage.INTRO_PENDING, LanguageEntryStore(isolatedContext).initialStage)
            resumed.completeIntro()
            assertEquals(LanguageEntryStage.COMPLETED, LanguageEntryStore(isolatedContext).initialStage)
            assertEquals(AppLanguage.Arabic, LanguageEntryStore(isolatedContext).language())
            // Both completion actions use the same idempotent operation; no preference reset.
            resumed.completeIntro()
            assertEquals(LanguageEntryStage.COMPLETED, LanguageEntryStore(isolatedContext).initialStage)
            prefs.edit().putString("theme_mode", "dark").commit()
            for (step in OnboardingStep.entries) {
                resumed.continueToIntro(AppLanguage.English)
                resumed.saveIntroStep(step)
                val restarted = LanguageEntryStore(isolatedContext)
                assertEquals(step, restarted.introStep())
                assertEquals(LanguageEntryStage.INTRO_PENDING, restarted.initialStage)
                restarted.select(AppLanguage.Arabic)
                assertEquals(step, LanguageEntryStore(isolatedContext).introStep())
                assertEquals("dark", prefs.getString("theme_mode", null))
            }
            resumed.completeIntro()
        } finally {
            base.deleteSharedPreferences(testName)
        }
    }
}
