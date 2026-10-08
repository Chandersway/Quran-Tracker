package com.Ameender.qurantracker.ui

import androidx.compose.runtime.*
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.test.espresso.Espresso.pressBack
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.test.platform.app.InstrumentationRegistry
import android.graphics.Bitmap
import java.io.File
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class OnboardingReplayTest {
    @get:Rule val compose = createComposeRule()

    @Test fun replayStartsAtOneRestoresStepAndSkipCloses() {
        val restore = StateRestorationTester(compose)
        var visible by mutableStateOf(true)
        restore.setContent {
            QuranTrackerTheme(themeMode = "light") {
                if (visible) OnboardingReplay("nl") { visible = false }
            }
        }
        compose.onNodeWithTag("intro_dot_reading", true).assertIsSelected()
        repeat(3) { compose.onNodeWithTag("intro_next").performScrollTo().performClick() }
        restore.emulateSavedInstanceStateRestore()
        compose.onNodeWithTag("intro_dot_planning", true).assertIsSelected()
        compose.onNodeWithTag("intro_skip").performScrollTo().performClick()
        compose.onNodeWithTag("onboarding_shell").assertDoesNotExist()
        compose.runOnIdle { visible = true }
        compose.onNodeWithTag("intro_dot_reading", true).assertIsSelected()
    }

    @Test fun replayAllSixStepsAndStartCloseWithoutAnotherGate() {
        var visible by mutableStateOf(true)
        var closed = 0
        compose.setContent {
            QuranTrackerTheme(themeMode = "dark") {
                if (visible) OnboardingReplay("en") { closed++; visible = false }
            }
        }
        repeat(5) { compose.onNodeWithTag("intro_next").performScrollTo().performClick() }
        compose.onNodeWithTag("intro_title").performScrollTo()
        val bitmap = compose.onNodeWithTag("onboarding_shell").captureToImage().asAndroidBitmap()
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        File(context.getExternalFilesDir(null), "onboarding-replay.png").outputStream().use {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
        compose.onNodeWithTag("intro_next").assertTextContains(AppText.strings("en").t("onboarding.start"))
            .performScrollTo().performClick()
        compose.runOnIdle { assertEquals(1, closed) }
        compose.onNodeWithTag("onboarding_shell").assertDoesNotExist()
    }

    @Test fun systemBackGoesToPreviousAndClosesAtFirstStep() {
        var visible by mutableStateOf(true)
        compose.setContent {
            QuranTrackerTheme(themeMode = "light") {
                if (visible) OnboardingReplay("nl") { visible = false }
            }
        }
        compose.onNodeWithTag("intro_next").performScrollTo().performClick()
        pressBack()
        compose.onNodeWithTag("intro_dot_reading", true).assertIsSelected()
        pressBack()
        compose.onNodeWithTag("onboarding_shell").assertDoesNotExist()
    }
}
