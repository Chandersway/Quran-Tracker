package com.Ameender.qurantracker.ui

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.geometry.Offset
import com.Ameender.qurantracker.data.ReadingHistory
import org.junit.Rule
import org.junit.Test

class StatsDrilldownUiTest {
    @get:Rule val compose = createComposeRule()

    @Test fun openFilterAndCloseActualRegistrationDetails() {
        val rows = listOf(
            ReadingHistory(id = 1, surahId = 1, surahName = "Al-Fatiha", type = "surah", action = "read", timestamp = 1000),
            ReadingHistory(id = 2, surahId = 2, surahName = "Al-Baqarah", type = "surah", action = "read", timestamp = 2000))
        compose.setContent {
            QuranTrackerTheme("dark") {
                StatsDistributionRingCard("Test", listOf(
                    RingEntry("Al-Fatiha", 1, Gold, listOf(rows[0]), "1"),
                    RingEntry("Al-Baqarah", 1, ReadBlue, listOf(rows[1]), "2")), "nl", "Alle tijd")
            }
        }
        compose.onNodeWithText("Bekijk registraties").performClick()
        compose.onNodeWithTag("stats-detail-count").assertTextEquals("Alle tijd · 2 registraties")
        compose.onNodeWithTag("stats-detail-filter-1").performClick()
        compose.onNodeWithTag("stats-detail-count").assertTextEquals("Alle tijd · 1 registratie")
        compose.onNode(hasText("Al-Fatiha") and hasAnyAncestor(hasTestTag("stats-detail-list"))).assertIsDisplayed()
        compose.onAllNodes(hasText("Al-Baqarah") and hasAnyAncestor(hasTestTag("stats-detail-list"))).assertCountEquals(0)
        compose.onNodeWithTag("stats-detail-all").performClick()
        compose.onNodeWithTag("stats-detail-count").assertTextEquals("Alle tijd · 2 registraties")
        compose.onNodeWithText("Sluiten").performClick()
        compose.onNodeWithTag("stats-detail-list").assertDoesNotExist()
        // The right-hand arc is the first half; tapping it must open only that bucket.
        compose.onNodeWithTag("stats-ring-chart-Test", useUnmergedTree = true).performTouchInput {
            click(Offset(width - 2f, height / 2f))
        }
        compose.onNodeWithTag("stats-detail-count").assertTextEquals("Alle tijd · 1 registratie")
        compose.onNodeWithTag("stats-detail-filter-1").assertIsSelected()
    }
}
