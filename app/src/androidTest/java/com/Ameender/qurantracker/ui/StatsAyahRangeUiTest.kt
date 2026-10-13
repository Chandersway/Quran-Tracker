package com.Ameender.qurantracker.ui

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.Ameender.qurantracker.data.ReadingHistory
import org.junit.Rule
import org.junit.Test

class StatsAyahRangeUiTest {
    @get:Rule val compose = createComposeRule()
    @Test fun hizbRegistrationShowsNumberSurahsAndCanonicalOpening() {
        val text = AppText.strings("nl")
        val history = ReadingHistory(surahId = 1, surahName = "Opening ayah text", type = "ayah", contentType = "hizb", action = "read", extraInfo = "Opening ayah text")
        compose.setContent { QuranTrackerTheme("dark") { ReadingHistoryRow(history, text) } }
        compose.onNodeWithText("Hizb 1").assertIsDisplayed()
        compose.onNodeWithText(statsHistoryOpening(history)!!).assertIsDisplayed()
        compose.onNodeWithText(statsHistoryAyahRange(history, text)!!).assertIsDisplayed()
        compose.onNodeWithText("Opening ayah text").assertDoesNotExist()
    }

    @Test fun rangeIsVisibleWithoutOpeningAnotherScreen() {
        val text = AppText.strings("nl")
        val history = ReadingHistory(surahId = 1, surahName = "Hizb 1", type = "hizb", action = "read")
        compose.setContent { QuranTrackerTheme("dark") { ReadingHistoryRow(history, text) } }
        compose.onNodeWithText(statsHistoryAyahRange(history, text)!!).assertIsDisplayed()
    }
}
