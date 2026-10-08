package com.Ameender.qurantracker.ui

import android.graphics.Bitmap
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.*
import androidx.test.platform.app.InstrumentationRegistry
import com.Ameender.qurantracker.data.OnboardingStep
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import java.io.File

class OnboardingHifzPreviewTest {
    @get:Rule val compose = createComposeRule()
    private val language = mutableStateOf("nl")

    private fun show(small: Boolean = false) {
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalLayoutDirection provides if (language.value == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(density.density, if (small) 2f else 1f)) {
                QuranTrackerTheme(if (small) "dark" else "light") {
                    Box(if (small) Modifier.size(320.dp, 480.dp) else Modifier) {
                        OnboardingShell(language.value, OnboardingStep.HIFZ, {}, {}, {})
                    }
                }
            }
        }
    }
    private fun slider(value: Float) {
        compose.onNodeWithTag("hifz_demo_slider").performScrollTo()
            .performSemanticsAction(SemanticsActions.SetProgress) { it(value) }
    }
    private fun open() = compose.onNodeWithTag("hifz_demo_card").performScrollTo().performClick()

    @Test fun longPressSliderSaveClearAndCancelAreLocal() {
        show()
        compose.onNodeWithTag("hifz_demo_score", useUnmergedTree = true).performScrollTo().assertTextEquals("Hifz-score: 75/100")
        screenshot("hifz-nl")
        compose.onNodeWithTag("hifz_demo_card").performTouchInput { longClick() }
        compose.onNodeWithTag("hifz_demo_draft").assertTextEquals("75/100")
        screenshot("hifz-dialog-nl")
        slider(100f)
        compose.onNodeWithTag("hifz_demo_save").performClick()
        compose.onNodeWithTag("hifz_demo_score", useUnmergedTree = true).assertTextEquals("Hifz-score: 100/100")
        open(); slider(25f)
        compose.onNodeWithTag("hifz_demo_cancel").performClick()
        compose.onNodeWithTag("hifz_demo_score", useUnmergedTree = true).assertTextEquals("Hifz-score: 100/100")
        open(); slider(0f)
        compose.onNodeWithTag("hifz_demo_save").performClick()
        compose.onNodeWithTag("hifz_demo_score", useUnmergedTree = true).assertTextEquals("Niet beoordeeld")
        open(); slider(75f)
        compose.onNodeWithTag("hifz_demo_save").performClick()
        open()
        compose.onNodeWithTag("hifz_demo_clear").performClick()
        compose.onNodeWithTag("hifz_demo_score", useUnmergedTree = true).assertTextEquals("Niet beoordeeld")
        compose.runOnIdle {
            assertEquals(MidNavy, hifzScoreSurface(0))
            assertEquals(BorderNavy, hifzScoreBorder(0))
            assertEquals(HifzScoreSurfaces[7], hifzScoreSurface(75))
        }
    }

    @Test fun languagesAndAccessibleSliderWorkAtDoubleTextSize() {
        show(small = true)
        for (locale in listOf("nl", "en", "ar")) {
            compose.runOnIdle { language.value = locale }
            open(); slider(75f)
            compose.onNodeWithTag("hifz_demo_draft").performScrollTo().assertTextEquals("75/100")
            compose.onNodeWithTag("hifz_demo_save").assertIsDisplayed().performClick()
            compose.onNodeWithTag("hifz_demo_score", useUnmergedTree = true).performScrollTo()
                .assertTextEquals(AppText.strings(locale).t("onboarding.hifz.score", 75))
        }
        open()
        compose.onNodeWithTag("hifz_demo_clear").assertIsDisplayed().performClick()
    }

    @Test fun arabicScreenshotsAndDialogDismissal() {
        language.value = "ar"
        show()
        screenshot("hifz-ar")
        open()
        screenshot("hifz-dialog-ar")
        compose.onNodeWithTag("hifz_demo_cancel").performClick()
        compose.onNodeWithTag("hifz_demo_score", true).assertTextEquals(AppText.strings("ar").t("onboarding.hifz.score", 75))
    }

    private fun screenshot(name: String) {
        compose.waitForIdle()
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val bitmap = (if (name.contains("dialog")) compose.onNode(isDialog()) else compose.onRoot())
            .captureToImage().asAndroidBitmap()
        File(instrumentation.targetContext.getExternalFilesDir(null), "$name.png").outputStream().use {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)
        }
    }
}
