package com.Ameender.qurantracker.ui

import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.assertFalse
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.text.TextLayoutResult
import com.Ameender.qurantracker.data.OnboardingStep

class OnboardingReadingPreviewTest {
    @get:Rule val compose = createComposeRule()

    @Test fun demoCountersAreIndependentAndDoNotBecomeRealRegistrations() {
        compose.setContent {
            QuranTrackerTheme { OnboardingShell("nl", OnboardingStep.READING, {}, {}, {}) }
        }
        compose.onNodeWithText("Elk leesmoment telt").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("reading_demo_count").performScrollTo().assertTextEquals("3× gelezen")
        compose.onNodeWithTag("reading_demo_register").performScrollTo().performClick()
        compose.onNodeWithTag("reading_demo_count").assertTextEquals("4× gelezen")
        for (unit in listOf("surah", "rub", "juz")) {
            compose.onNodeWithTag("reading_demo_$unit").performScrollTo().performClick().assertIsSelected()
            compose.onNodeWithTag("reading_demo_count").performScrollTo().assertTextEquals("3× gelezen")
        }
        compose.onNodeWithTag("reading_demo_hizb").performScrollTo().performClick()
        compose.onNodeWithTag("reading_demo_count").performScrollTo().assertTextEquals("4× gelezen")
        compose.onNodeWithText("Voorbeeld · niets wordt opgeslagen").performScrollTo().assertIsDisplayed()
        compose.onNodeWithTag("reading_demo_quick_check").performScrollTo().assertIsDisplayed()
    }

    @Test fun allLanguagesFitSmallScreenWithDoubleTextAndNavigationStillWorks() {
        val language = mutableStateOf("nl")
        val step = mutableStateOf(OnboardingStep.READING)
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalDensity provides Density(density.density, 2f),
                LocalLayoutDirection provides if (language.value == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr) {
                QuranTrackerTheme("dark") {
                    Box(Modifier.size(320.dp, 480.dp)) {
                        OnboardingShell(language.value, step.value, { step.value = it }, {}, {})
                    }
                }
            }
        }
        for (locale in listOf("nl", "en", "ar")) {
            compose.runOnIdle { language.value = locale; step.value = OnboardingStep.READING }
            for (unit in listOf("surah", "hizb", "rub", "juz")) {
                compose.onNodeWithTag("reading_demo_$unit").performScrollTo().assertIsDisplayed().performClick()
            }
            compose.onNodeWithTag("reading_demo_register").performScrollTo().assertIsDisplayed().performClick()
            val layouts = mutableListOf<TextLayoutResult>()
            compose.onNodeWithText(AppText.strings(locale).t("onboarding.reading.register"), useUnmergedTree = true)
                .performSemanticsAction(SemanticsActions.GetTextLayoutResult) { it(layouts) }
            layouts.forEach { assertFalse("Registration label clipped in $locale: size=${it.size}, lines=${it.lineCount}, width=${it.didOverflowWidth}, height=${it.didOverflowHeight}, max=${it.layoutInput.maxLines}, constraints=${it.layoutInput.constraints}", it.hasVisualOverflow) }
            compose.onNodeWithTag("intro_next").performScrollTo().performClick()
            compose.onNodeWithTag("intro_title").performScrollTo()
                .assertTextEquals(AppText.strings(locale).t(OnboardingStep.HIFZ.titleKey))
            compose.onNodeWithTag("intro_previous").performScrollTo().performClick()
            compose.onNodeWithTag("reading_demo_count").performScrollTo()
                .assertTextEquals(AppText.strings(locale).t("onboarding.reading.count", 3))
        }
    }
}
