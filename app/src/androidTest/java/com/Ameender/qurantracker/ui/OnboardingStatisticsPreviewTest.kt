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

class OnboardingStatisticsPreviewTest {
    @get:Rule val compose = createComposeRule()
    private val language = mutableStateOf("nl")
    private val step = mutableStateOf(OnboardingStep.STATISTICS)
    private fun show(small: Boolean = false, scale: Float = 1f) {
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalLayoutDirection provides if(language.value == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(density.density, scale)) {
                QuranTrackerTheme(if(small) "dark" else "light") {
                    Box(if(small) Modifier.size(320.dp,480.dp) else Modifier) {
                        OnboardingShell(language.value, step.value, { step.value = it }, {}, { step.value = OnboardingStep.READING })
                    }
                }
            }
        }
    }
    private fun checkCounts() {
        for(item in onboardingReadCounts) {
            compose.onNodeWithTag("stats_demo_count_${item.id}", true).performScrollTo().assertIsDisplayed()
                .assertTextEquals(AppText.strings(language.value).t("onboarding.reading.count", item.count))
        }
    }
    @Test fun countsTranslationsAndNavigation() {
        show()
        checkCounts()
        screenshot("stats-nl")
        for(locale in listOf("en", "ar")) {
            compose.runOnIdle { language.value = locale }
            checkCounts()
        }
        screenshot("stats-ar")
        compose.onNodeWithTag("intro_next").performScrollTo().performClick()
        compose.onNodeWithTag("intro_title").assertTextEquals(AppText.strings("ar").t(OnboardingStep.GROUPS.titleKey))
        compose.onNodeWithTag("intro_previous").performScrollTo().performClick()
        checkCounts()
        compose.onNodeWithTag("intro_previous").performScrollTo().performClick()
        compose.onNodeWithTag("intro_next").performScrollTo().performClick()
        checkCounts()
        compose.onNodeWithTag("intro_skip").performScrollTo().performClick()
        compose.onNodeWithTag("stats_demo_hizb").assertDoesNotExist()
    }
    @Test fun smallDarkScreen() {
        show(true)
        checkCounts()
        screenshot("stats-small")
    }
    @Test fun doubleTextSizeInAllLanguages() {
        show(true, 2f)
        for(locale in listOf("nl", "en", "ar")) {
            compose.runOnIdle { language.value = locale }
            checkCounts()
            screenshot("stats-large-$locale")
            compose.onNodeWithTag("intro_next").performScrollTo().assertIsDisplayed()
        }
    }
    private fun screenshot(name: String) {
        val bitmap = compose.onRoot().captureToImage().asAndroidBitmap()
        File(InstrumentationRegistry.getInstrumentation().targetContext.getExternalFilesDir(null), "$name.png")
            .outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG,100,it) }
    }
}
