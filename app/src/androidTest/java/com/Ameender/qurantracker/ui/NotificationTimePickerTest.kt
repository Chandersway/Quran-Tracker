package com.Ameender.qurantracker.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NotificationTimePickerTest {
    @get:Rule val compose = createComposeRule()
    @Test fun chooseConfirmValidateAndCancelInAllLanguages() {
        val language = mutableStateOf("nl")
        val minute = mutableStateOf(480)
        compose.setContent {
            MaterialTheme { NotificationTime("Test", minute.value, language.value, true) { minute.value = it } }
        }
        for (locale in listOf("nl", "en", "ar", "fr")) {
            compose.runOnIdle { language.value = locale; minute.value = 480 }
            compose.onNodeWithTag("notification_time_Test").performClick()
            compose.onNodeWithTag("notification_hour").performTextReplacement("25")
            compose.onNodeWithTag("notification_time_save").assertIsNotEnabled()
            compose.onNodeWithTag("notification_hour").performTextReplacement(if (locale == "ar") "٢١" else "21")
            compose.onNodeWithTag("notification_minute").performTextReplacement("37")
            compose.onNodeWithTag("notification_time_save").performClick()
            compose.runOnIdle { assertEquals(1297, minute.value) }
            compose.onNodeWithTag("notification_time_Test").performClick()
            compose.onNodeWithTag("notification_hour").performTextReplacement("10")
            compose.onNodeWithTag("notification_time_cancel").performClick()
            compose.runOnIdle { assertEquals(1297, minute.value) }
        }
    }
}
