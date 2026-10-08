package com.Ameender.qurantracker.ui

import android.graphics.Bitmap
import androidx.compose.foundation.layout.*
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
import org.junit.Rule
import org.junit.Test
import java.io.File

class OnboardingPlanningPreviewTest {
    @get:Rule val compose = createComposeRule()
    private val language = mutableStateOf("nl")
    private val step = mutableStateOf(OnboardingStep.PLANNING)
    private fun show(small: Boolean = false) {
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalLayoutDirection provides if(language.value == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(density.density, if(small) 2f else 1f)) {
                QuranTrackerTheme(if(small) "dark" else "light") {
                    Box(if(small) Modifier.size(320.dp,480.dp) else Modifier) {
                        OnboardingShell(language.value, step.value, { step.value = it }, {}, { step.value = OnboardingStep.GROUPS })
                    }
                }
            }
        }
    }
    private fun tap(tag: String) = compose.onNodeWithTag(tag).performScrollTo().performClick()
    @Test fun dateTimeUnitReminderAndSingleResultWork() {
        show()
        screenshot("planning-nl")
        tap("planning_demo_unit")
        tap("planning_demo_choose_juz")
        tap("planning_demo_date")
        tap("planning_demo_day_2")
        tap("notification_time_Herinneringstijd")
        compose.onNodeWithTag("notification_hour").performTextReplacement("25")
        compose.onNodeWithTag("notification_time_save").assertIsNotEnabled()
        compose.onNodeWithTag("notification_hour").performTextReplacement("21")
        compose.onNodeWithTag("notification_minute").performTextReplacement("15")
        compose.onNodeWithTag("notification_time_save").performClick()
        repeat(3) { tap("planning_demo_schedule") }
        compose.onAllNodesWithTag("planning_demo_result").assertCountEquals(1)
        compose.onNodeWithTag("planning_demo_result").performScrollTo().assertIsDisplayed()
        compose.onNodeWithText("Herinnering aan · alleen een voorbeeld").assertExists()
        screenshot("planning-scheduled")
        tap("planning_demo_reminder")
        tap("planning_demo_schedule")
        compose.onNodeWithText("Zonder herinnering").performScrollTo().assertIsDisplayed()
        tap("intro_next"); tap("intro_previous")
        compose.onNodeWithTag("planning_demo_result").assertDoesNotExist()
        tap("intro_previous"); tap("intro_next")
        tap("intro_skip")
        compose.onNodeWithTag("planning_demo_schedule").assertDoesNotExist()
    }
    @Test fun smallDarkScreenInAllLanguages() {
        show(true)
        for(locale in listOf("nl","en","ar")) {
            compose.runOnIdle { language.value = locale }
            tap("planning_demo_date"); tap("planning_demo_day_1")
            tap("planning_demo_unit"); tap("planning_demo_choose_surah")
            tap("planning_demo_schedule")
            compose.onNodeWithTag("planning_demo_result").performScrollTo().assertIsDisplayed()
            compose.onNodeWithTag("intro_next").performScrollTo().assertIsDisplayed()
        }
    }
    @Test fun arabicPreview() {
        language.value = "ar"
        show()
        tap("planning_demo_schedule")
        screenshot("planning-ar")
    }
    private fun screenshot(name: String) {
        val bitmap = compose.onRoot().captureToImage().asAndroidBitmap()
        File(InstrumentationRegistry.getInstrumentation().targetContext.getExternalFilesDir(null), "$name.png")
            .outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG,100,it) }
    }
}
