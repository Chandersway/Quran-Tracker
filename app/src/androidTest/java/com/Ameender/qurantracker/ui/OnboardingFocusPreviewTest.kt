package com.Ameender.qurantracker.ui

import android.graphics.Bitmap
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.*
import androidx.test.platform.app.InstrumentationRegistry
import com.Ameender.qurantracker.data.OnboardingStep
import org.junit.Rule
import org.junit.Test
import java.io.File

class OnboardingFocusPreviewTest {
    @get:Rule val compose = createComposeRule()
    private val step = mutableStateOf(OnboardingStep.POMODORO)
    private val language = mutableStateOf("nl")
    private fun show(small: Boolean = false) {
        compose.setContent {
            val density = LocalDensity.current
            CompositionLocalProvider(LocalLayoutDirection provides if (language.value == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(density.density, if(small) 2f else 1f)) {
                QuranTrackerTheme(if (small) "dark" else "light") {
                    Box(if(small) Modifier.size(320.dp,480.dp) else Modifier) {
                        OnboardingShell(language.value, step.value, { step.value = it }, {}, { step.value = OnboardingStep.GROUPS })
                    }
                }
            }
        }
    }
    private fun toggle() = compose.onNodeWithTag("focus_demo_toggle").performScrollTo().performClick()
    @Test fun startPauseResumeAndLeavingResetDemo() {
        show()
        compose.onNodeWithTag("focus_demo_time").assertContentDescriptionEquals("Nog 25 minuten en 0 seconden")
        screenshot("focus-nl")
        toggle()
        compose.onNodeWithTag("focus_demo_status").assertTextEquals("Leesfase · timer loopt")
        screenshot("focus-running")
        toggle()
        compose.onNodeWithTag("focus_demo_status").assertTextEquals("Pauze · timer staat stil")
        screenshot("focus-paused")
        toggle()
        compose.onNodeWithTag("intro_next").performScrollTo().performClick()
        compose.onNodeWithTag("intro_previous").performScrollTo().performClick()
        compose.onNodeWithTag("focus_demo_status").assertTextEquals("Leesfase · klaar om te starten")
        toggle()
        compose.onNodeWithTag("intro_previous").performScrollTo().performClick()
        compose.onNodeWithTag("intro_next").performScrollTo().performClick()
        compose.onNodeWithTag("focus_demo_status").assertTextEquals("Leesfase · klaar om te starten")
        toggle()
        compose.onNodeWithTag("intro_skip").performScrollTo().performClick()
        compose.onNodeWithTag("focus_demo_toggle").assertDoesNotExist()
    }
    @Test fun smallDarkScreenAndThreeLanguages() {
        show(true)
        for(locale in listOf("nl","en","ar")) {
            compose.runOnIdle { language.value = locale }
            toggle()
            compose.onNodeWithTag("focus_demo_status").performScrollTo()
                .assertTextEquals(AppText.strings(locale).t("onboarding.pomodoro.reading"))
            toggle()
            compose.onNodeWithTag("intro_next").performScrollTo().assertIsDisplayed()
        }
    }
    @Test fun arabicPreview() {
        language.value = "ar"
        show()
        screenshot("focus-ar")
    }
    @Test fun backgroundPausesAndForegroundDoesNotAutoResume() {
        val owner = object : LifecycleOwner {
            override val lifecycle = LifecycleRegistry(this)
        }
        compose.runOnIdle { owner.lifecycle.currentState = Lifecycle.State.RESUMED }
        compose.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides owner) {
                QuranTrackerTheme { OnboardingFocusPreview("nl") }
            }
        }
        compose.onNodeWithTag("focus_demo_toggle").performClick()
        compose.onNodeWithTag("focus_demo_status").assertTextEquals("Leesfase · timer loopt")
        compose.runOnIdle { owner.lifecycle.currentState = Lifecycle.State.CREATED }
        compose.onNodeWithTag("focus_demo_status").assertTextEquals("Pauze · timer staat stil")
        compose.runOnIdle { owner.lifecycle.currentState = Lifecycle.State.RESUMED }
        compose.onNodeWithTag("focus_demo_status").assertTextEquals("Pauze · timer staat stil")
        compose.runOnIdle { owner.lifecycle.currentState = Lifecycle.State.DESTROYED }
    }
    private fun screenshot(name: String) {
        val bitmap = compose.onRoot().captureToImage().asAndroidBitmap()
        File(InstrumentationRegistry.getInstrumentation().targetContext.getExternalFilesDir(null), "$name.png")
            .outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG,100,it) }
    }
}
