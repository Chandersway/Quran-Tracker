package com.Ameender.qurantracker.ui

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import com.Ameender.qurantracker.MainActivity
import com.Ameender.qurantracker.data.*
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test

/** Explicit two-process emulator fixture. Run prepare, adb force-stop, then verify.
 * Never runs during the ordinary suite and never deletes application/user data.
 */
class OnboardingProcessCheckpointTest {
    @get:Rule val compose = createEmptyComposeRule()
    @Test fun checkpoint() {
        val phase = InstrumentationRegistry.getArguments().getString("checkpoint")
        assumeTrue(phase == "prepare" || phase == "verify")
        assumeTrue(Build.HARDWARE == "ranchu" || Build.HARDWARE == "goldfish")
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
        val backup = context.getSharedPreferences("phase10_checkpoint", Context.MODE_PRIVATE)
        val pending = PendingNavigationStore(context)
        val navigation = context.getSharedPreferences("pending_navigation", Context.MODE_PRIVATE)
        val navigationKeys = listOf("group_code", "group_token", "notification")
        val keys = listOf("onboarding_language_stage_v1", "onboarding_intro_step_v1", "app_language")
        if (phase == "prepare") {
            check(!backup.contains("active")) { "Restore the previous fixture before preparing again" }
            val edit = backup.edit().putBoolean("active", true)
            keys.forEach { edit.putString(it, prefs.getString(it, null)) }
            navigationKeys.forEach { edit.putString("navigation_$it", navigation.getString(it, null)) }
            check(edit.commit())
            check(navigation.edit().apply { navigationKeys.forEach { remove(it) } }.commit())
            LanguageEntryStore(context).continueToIntro(AppLanguage.Arabic)
            LanguageEntryStore(context).saveIntroStep(OnboardingStep.POMODORO)
            pending.receive("QAT-1010", null, null)
            ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use {
                compose.onNodeWithTag("intro_dot_pomodoro", true).assertIsSelected()
            }
        } else {
            check(backup.getBoolean("active", false))
            try {
                val restored = LanguageEntryStore(context)
                assertEquals(LanguageEntryStage.INTRO_PENDING, restored.initialStage)
                assertEquals(AppLanguage.Arabic, restored.language())
                assertEquals(OnboardingStep.POMODORO, restored.introStep())
                assertEquals("QAT-1010", pending.groupCode)
                ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java)).use {
                    compose.onNodeWithTag("intro_dot_pomodoro", true).assertIsSelected()
                    compose.onNodeWithTag("intro_title").assertTextEquals(AppText.strings("ar").t(OnboardingStep.POMODORO.titleKey))
                }
            } finally {
                val edit = prefs.edit()
                keys.forEach { key -> backup.getString(key, null)?.let { edit.putString(key, it) } ?: edit.remove(key) }
                check(edit.commit())
                check(navigation.edit().apply {
                    navigationKeys.forEach { key ->
                        backup.getString("navigation_$key", null)?.let { putString(key, it) } ?: remove(key)
                    }
                }.commit())
                context.deleteSharedPreferences("phase10_checkpoint")
            }
        }
    }
}
