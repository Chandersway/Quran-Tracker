package com.Ameender.qurantracker.ui

import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.test.platform.app.InstrumentationRegistry
import android.graphics.Bitmap
import java.io.File
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.Ameender.qurantracker.data.AppLanguage
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class LanguageSelectionScreenTest {
    @get:Rule val compose = createComposeRule()

    @Test fun selectionUpdatesTranslationDirectionAndContinue() {
        val language = mutableStateOf(AppLanguage.Dutch)
        var continued: AppLanguage? = null
        compose.setContent {
            CompositionLocalProvider(LocalLayoutDirection provides
                if (language.value == AppLanguage.Arabic) LayoutDirection.Rtl else LayoutDirection.Ltr) {
                QuranTrackerTheme(themeMode = "light") {
                    LanguageSelectionScreen(language.value, { language.value = it }, { continued = language.value })
                }
            }
        }
        screenshot("language-nl")
        for (option in listOf(AppLanguage.English, AppLanguage.Arabic, AppLanguage.Dutch)) {
            compose.onNodeWithTag("language_${option.code}").performClick().assertIsSelected()
            compose.onNodeWithText(AppText.strings(option.code).t("onboarding.language.title")).assertIsDisplayed()
        }
        compose.onNodeWithTag("language_ar").performClick()
        screenshot("language-ar")
        compose.onNodeWithTag("language_continue").performScrollTo().performClick()
        compose.runOnIdle { assertEquals(AppLanguage.Arabic, continued) }
    }

    @Test fun darkArabicLargeTextRemainsScrollableAndSelectable() {
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl,
                LocalDensity provides Density(density.density, 2f)) {
                QuranTrackerTheme(themeMode = "dark") {
                    Box(Modifier.size(width = 320.dp, height = 480.dp)) {
                    LanguageSelectionScreen(AppLanguage.Arabic, {}, {})
                    }
                }
            }
        }
        compose.onNodeWithTag("language_ar").performScrollTo().assertIsSelected()
        compose.onNodeWithTag("language_continue").performScrollTo().assertIsDisplayed().performClick()
        screenshot("language-ar-dark-large")
    }

    private fun screenshot(name: String) {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val bitmap = compose.onRoot().captureToImage().asAndroidBitmap()
        File(context.getExternalFilesDir(null), "$name.png").outputStream().use {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
    }
}
