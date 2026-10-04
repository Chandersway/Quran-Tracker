package com.Ameender.qurantracker.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.assertEquals
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import com.Ameender.qurantracker.data.HizbReadingCount

class HizbMultiSelectTest {
    @get:Rule val compose = createComposeRule()

    @Test fun selectDeselectAndScrollThroughAllSixty() {
        var selected by mutableStateOf(emptySet<Int>())
        var language by mutableStateOf("nl")
        compose.setContent {
            CompositionLocalProvider(LocalLayoutDirection provides if (language == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr) {
                MaterialTheme {
                    key(language) {
                        QuickCheckInDialog(AppText.strings(language), language,
                            onDismiss = {}, onSave = { _, numbers, _ -> selected = numbers })
                    }
                }
            }
        }
        for (locale in listOf("nl", "en", "ar", "fr")) {
            compose.runOnIdle { language = locale; selected = emptySet() }
            compose.onNodeWithTag("quick_check_hizb").performClick()
            compose.onNodeWithTag("quick_check_submit").assertIsEnabled()
            compose.onNodeWithTag("hizb_selector").performClick()
            compose.onNodeWithTag("hizb_selection_done").assertIsDisplayed()
            compose.onNodeWithTag("hizb_option_1").assertIsOn()
            compose.onNodeWithTag("hizb_option_2").performClick().assertIsOn()
            compose.onNodeWithTag("hizb_option_1").performClick().assertIsOff()
            compose.onNodeWithTag("hizb_options").performScrollToIndex(59)
            compose.onNodeWithTag("hizb_option_60").performClick().assertIsOn()
            compose.onNodeWithTag("hizb_selection_done").assertIsDisplayed().performClick()
            compose.onNodeWithTag("hizb_selector").assertIsDisplayed().performClick()
            compose.onNodeWithTag("hizb_option_2").assertIsOn()
            compose.onNodeWithTag("hizb_selection_done").performClick()
            compose.onNodeWithTag("quick_check_submit").assertIsEnabled().performClick()
            compose.runOnIdle { assertEquals(setOf(2, 60), selected) }
        }
    }

    @Test fun hizbStepperAndMultipleSelectionShareSaveAction() {
        var saved = emptySet<Int>()
        compose.setContent {
            MaterialTheme {
                QuickCheckInDialog(AppText.strings("nl"), "nl", onDismiss = {},
                    onSave = { _, numbers, _ -> saved = numbers })
            }
        }
        compose.onNodeWithTag("quick_check_hizb").performClick()
        compose.onNodeWithText("+").assertIsDisplayed().performClick()
        compose.onNodeWithTag("quick_check_submit").performClick()
        compose.runOnIdle { assertEquals(setOf(2), saved) }
        compose.onNodeWithTag("hizb_selector").performClick()
        compose.onNodeWithTag("hizb_option_2").assertIsOn()
        compose.onNodeWithTag("hizb_option_3").performClick()
        compose.onNodeWithTag("hizb_selection_done").performClick()
        compose.onNodeWithTag("quick_check_submit").performClick()
        compose.runOnIdle { assertEquals(setOf(2, 3), saved) }
        compose.onNodeWithText("-").performClick()
        compose.onNodeWithTag("quick_check_submit").performClick()
        compose.runOnIdle { assertEquals(setOf(1), saved) }
        compose.onNodeWithTag("hizb_selector").performClick()
        compose.onNodeWithTag("hizb_option_1").performClick()
        compose.onNodeWithTag("hizb_selection_done").performClick()
        compose.onNodeWithTag("quick_check_submit").assertIsNotEnabled()
    }

    @Test fun chartScrollAndTouchWorkInRtl() {
        var selected: Int? = null
        compose.setContent {
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                MaterialTheme { HizbBars((1..60).map { HizbReadingCount(it, if (it == 60) 3 else 0) }, "ar", false, selected) { selected = it } }
            }
        }
        compose.onNodeWithTag("hizb_bar_1").assertIsDisplayed().performClick()
        compose.runOnIdle { assertEquals(1, selected) }
        compose.onNodeWithTag("hizb_chart").performScrollToIndex(59)
        compose.onNodeWithTag("hizb_bar_60").assertIsDisplayed().performClick()
        compose.runOnIdle { assertEquals(60, selected) }
    }
}
