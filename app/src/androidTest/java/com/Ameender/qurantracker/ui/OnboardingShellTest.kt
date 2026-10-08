package com.Ameender.qurantracker.ui

import android.graphics.Bitmap
import androidx.activity.OnBackPressedDispatcher
import androidx.activity.compose.LocalOnBackPressedDispatcherOwner
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.*
import androidx.test.platform.app.InstrumentationRegistry
import com.Ameender.qurantracker.data.OnboardingStep
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import java.io.File

class OnboardingShellTest {
    @get:Rule val compose = createComposeRule()
    private val step = mutableStateOf(OnboardingStep.READING)
    private val language = mutableStateOf("nl")
    private var completed = false
    private var returnedToLanguage = false
    private lateinit var back: OnBackPressedDispatcher

    private fun show(small: Boolean = false) {
        compose.setContent {
            back = LocalOnBackPressedDispatcherOwner.current!!.onBackPressedDispatcher
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalLayoutDirection provides if (language.value == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(density.density, if (small) 2f else 1f)
            ) {
                QuranTrackerTheme(themeMode = if (small) "dark" else "light") {
                    Box(if (small) Modifier.size(320.dp, 480.dp) else Modifier) {
                        OnboardingShell(language.value, step.value, { step.value = it },
                            { returnedToLanguage = true }, { completed = true })
                    }
                }
            }
        }
    }

    @Test fun allSixStepsDotsPreviousAndStartWork() {
        show()
        screenshot("intro-nl")
        for (expected in OnboardingStep.entries) {
            compose.onNodeWithTag("intro_title").performScrollTo()
                .assertTextEquals(AppText.strings("nl").t(expected.titleKey))
            compose.onNodeWithTag("intro_dot_${expected.id}", useUnmergedTree = true).assertIsSelected()
            if (expected.previous != null) {
                compose.onNodeWithTag("intro_previous").performScrollTo().performClick()
                compose.runOnIdle { assertEquals(expected.previous, step.value) }
                compose.onNodeWithTag("intro_next").performScrollTo().performClick()
            }
            compose.runOnIdle { assertFalse(completed) }
            compose.onNodeWithTag("intro_next").performScrollTo().performClick()
        }
        compose.runOnIdle { assertTrue(completed) }
    }

    @Test fun skipCompletesWithoutTraversingRemainingSteps() {
        show()
        compose.onNodeWithTag("intro_skip").performScrollTo().performClick()
        compose.runOnIdle { assertTrue(completed); assertEquals(OnboardingStep.READING, step.value) }
    }

    @Test fun systemBackReturnsToPreviousThenLanguageWithoutCompleting() {
        show()
        compose.onNodeWithTag("intro_next").performScrollTo().performClick()
        compose.runOnIdle { back.onBackPressed() }
        compose.runOnIdle { assertEquals(OnboardingStep.READING, step.value) }
        compose.runOnIdle { back.onBackPressed() }
        compose.runOnIdle { assertTrue(returnedToLanguage); assertFalse(completed) }
    }

    @Test fun englishAndArabicAreTranslatedAndMirrored() {
        show()
        for (locale in listOf("en", "ar")) {
            compose.runOnIdle { language.value = locale }
            compose.onNodeWithTag("intro_title").assertTextEquals(AppText.strings(locale).t(OnboardingStep.READING.titleKey))
            val first = compose.onNodeWithTag("intro_dot_reading", true).fetchSemanticsNode().boundsInRoot
            val last = compose.onNodeWithTag("intro_dot_groups", true).fetchSemanticsNode().boundsInRoot
            assertEquals(locale == "ar", first.left > last.left)
        }
        screenshot("intro-ar")
    }

    @Test fun allStepsAreReachableOnSmallDarkScreenAtDoubleTextSize() {
        language.value = "ar"
        show(small = true)
        OnboardingStep.entries.forEach {
            compose.onNodeWithTag("intro_title").performScrollTo().assertIsDisplayed()
            compose.onNodeWithTag("intro_next").performScrollTo().assertIsDisplayed().performClick()
        }
        screenshot("intro-ar-small-dark")
        compose.runOnIdle { assertTrue(completed) }
    }

    private fun screenshot(name: String) {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val bitmap = compose.onRoot().captureToImage().asAndroidBitmap()
        File(context.getExternalFilesDir(null), "$name.png").outputStream().use {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
    }
}
