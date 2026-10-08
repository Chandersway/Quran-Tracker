package com.Ameender.qurantracker.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.os.Build
import android.net.Uri
import com.Ameender.qurantracker.data.SupabaseService
import com.Ameender.qurantracker.data.AuthenticationState
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import com.Ameender.qurantracker.MainActivity
import com.Ameender.qurantracker.data.LanguageEntryStage
import com.Ameender.qurantracker.data.LanguageEntryStore
import com.Ameender.qurantracker.data.PendingNavigationStore
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test

/** Emulator-only integration. Preserve existing preference values; never clear app data or auth. */
class OnboardingActivityIntegrationTest {
    @get:Rule val compose = createEmptyComposeRule()

    private fun withEntry(stage: String, block: (ActivityScenario<MainActivity>, Context) -> Unit) {
        assumeTrue(Build.HARDWARE == "ranchu" || Build.HARDWARE == "goldfish")
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext
        val pending = PendingNavigationStore(context)
        assumeTrue(pending.groupCode == null && pending.groupToken == null && pending.notification == null)
        val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)
        val keys = listOf("onboarding_language_stage_v1", "onboarding_intro_step_v1", "app_language")
        val before = keys.associateWith { prefs.getString(it, null) }
        if (Build.VERSION.SDK_INT >= 33) {
            instrumentation.uiAutomation.grantRuntimePermission(context.packageName, Manifest.permission.POST_NOTIFICATIONS)
        }
        try {
            prefs.edit().putString(keys[0], stage).remove(keys[1]).putString(keys[2], "nl").commit()
            ActivityScenario.launch<MainActivity>(Intent(context, MainActivity::class.java).setAction(Intent.ACTION_MAIN)).use {
                block(it, context)
            }
        } finally {
            val edit = prefs.edit()
            before.forEach { (key, value) -> if (value == null) edit.remove(key) else edit.putString(key, value) }
            edit.commit()
        }
    }

    @Test fun firstRunRestoresProgressCompletesAndMenuReplayKeepsCompletion() = withEntry("LANGUAGE") { activity, context ->
        compose.onNodeWithTag("language_continue").performScrollTo().performClick()
        repeat(3) { compose.onNodeWithTag("intro_next").performScrollTo().performClick() }
        activity.recreate()
        compose.onNodeWithTag("intro_dot_planning", true).assertIsSelected()
        repeat(2) { compose.onNodeWithTag("intro_next").performScrollTo().performClick() }
        activity.recreate()
        compose.onNodeWithTag("intro_dot_groups", true).assertIsSelected()
        compose.onNodeWithTag("intro_next").performScrollTo().performClick()
        compose.onNodeWithTag("onboarding_shell").assertDoesNotExist()
        assertEquals(LanguageEntryStage.COMPLETED, LanguageEntryStore(context).initialStage)
        activity.recreate()
        compose.onNodeWithTag("onboarding_shell").assertDoesNotExist()
        compose.onNodeWithContentDescription(AppText.strings("nl").t("settings.title")).performClick()
        compose.onNodeWithText(AppText.strings("nl").t("onboarding.replay")).performScrollTo().performClick()
        compose.onNodeWithTag("intro_dot_reading", true).assertIsSelected()
        assertEquals(LanguageEntryStage.COMPLETED, LanguageEntryStore(context).initialStage)
        compose.onNodeWithTag("intro_skip").performScrollTo().performClick()
        compose.onNodeWithTag("onboarding_shell").assertDoesNotExist()
        assertEquals("nl", LanguageEntryStore(context).language().code)
    }

    @Test fun skipPersistsAndExistingUserBypassesIntro() = withEntry("INTRO_PENDING") { activity, context ->
        compose.onNodeWithTag("intro_skip").performScrollTo().performClick()
        activity.recreate()
        compose.onNodeWithTag("onboarding_shell").assertDoesNotExist()
        assertEquals(LanguageEntryStage.COMPLETED, LanguageEntryStore(context).initialStage)
    }

    @Test fun existingUserOpensNormalApp() = withEntry("EXISTING_USER") { _, context ->
        compose.onNodeWithTag("onboarding_shell").assertDoesNotExist()
        compose.onNodeWithTag("language_continue").assertDoesNotExist()
        compose.onNodeWithContentDescription(AppText.strings("nl").t("settings.title")).assertIsDisplayed()
        assertEquals(LanguageEntryStage.EXISTING_USER, LanguageEntryStore(context).initialStage)
    }

    @Test fun malformedAuthCallbackDoesNotLockExistingAppInLoading() = withEntry("EXISTING_USER") { _, _ ->
        compose.waitUntil(10_000) { SupabaseService.authenticationState.value != AuthenticationState.Checking }
        val before = SupabaseService.authenticationState.value
        compose.runOnIdle {
            SupabaseService.handleDeeplinks(Intent(Intent.ACTION_VIEW, Uri.parse("qurantracker://auth")))
        }
        compose.runOnIdle { assertEquals(before, SupabaseService.authenticationState.value) }
    }
}
