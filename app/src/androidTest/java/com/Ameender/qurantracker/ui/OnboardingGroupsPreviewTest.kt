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
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import java.io.File

class OnboardingGroupsPreviewTest {
    @get:Rule val compose = createComposeRule()
    private val language = mutableStateOf("nl")
    private val step = mutableStateOf(OnboardingStep.GROUPS)
    private var completed = false
    private fun show(small: Boolean = false, scale: Float = 1f) {
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalLayoutDirection provides if(language.value == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(density.density, scale)) {
                QuranTrackerTheme(if(small) "dark" else "light") {
                    Box(if(small) Modifier.size(320.dp,480.dp) else Modifier) {
                        OnboardingShell(language.value, step.value, { step.value = it }, {}, { completed = true })
                    }
                }
            }
        }
    }
    private fun tap(tag: String) = compose.onNodeWithTag(tag).performScrollTo().performClick()
    private fun checkPoints() {
        onboardingGroupPoints.forEach { (name, points) ->
            compose.onNodeWithTag("groups_demo_points_$name", true).performScrollTo().assertIsDisplayed()
                .assertTextEquals(AppText.strings(language.value).t("onboarding.groups.points", points))
        }
    }
    @Test fun demoActionsAndFinalStepWork() {
        show()
        checkPoints()
        screenshot("groups-nl")
        tap("groups_demo_create")
        compose.onNodeWithTag("groups_demo_feedback").performScrollTo().assertTextEquals(AppText.strings("nl").t("onboarding.groups.createInfo"))
        tap("groups_demo_join")
        compose.onNodeWithTag("groups_demo_feedback").performScrollTo().assertTextEquals(AppText.strings("nl").t("onboarding.groups.joinInfo"))
        tap("intro_previous"); tap("intro_next")
        compose.onNodeWithText("Beginnen").performScrollTo().assertIsDisplayed()
        tap("intro_next")
        compose.runOnIdle { assertTrue(completed) }
    }
    @Test fun arabicAndEnglishAndSkip() {
        show()
        for(locale in listOf("en","ar")) {
            compose.runOnIdle { language.value = locale }
            checkPoints()
        }
        screenshot("groups-ar")
        tap("intro_skip")
        compose.runOnIdle { assertTrue(completed) }
    }
    @Test fun smallDarkScreen() {
        show(true)
        checkPoints()
        screenshot("groups-small")
        tap("groups_demo_create"); tap("groups_demo_join")
        tap("intro_next")
    }
    @Test fun doubleTextInAllLanguages() {
        show(true, 2f)
        for(locale in listOf("nl","en","ar")) {
            compose.runOnIdle { language.value = locale }
            checkPoints()
            screenshot("groups-large-$locale")
            tap("groups_demo_create"); tap("groups_demo_join")
            compose.onNodeWithTag("intro_next").performScrollTo().assertIsDisplayed()
        }
    }
    private fun screenshot(name: String) {
        val bitmap = compose.onRoot().captureToImage().asAndroidBitmap()
        File(InstrumentationRegistry.getInstrumentation().targetContext.getExternalFilesDir(null), "$name.png")
            .outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG,100,it) }
    }
}
