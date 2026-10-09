package com.Ameender.qurantracker.ui

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.Ameender.qurantracker.data.ReadingGroupLeaderboardRow
import com.Ameender.qurantracker.data.ReadingGroupReadingEntry
import org.junit.Rule
import org.junit.Test

class GroupMemberReadingUiTest {
    @get:Rule val compose = createComposeRule()

    @Test fun tapMemberShowsSharedReadingAndCloses() {
        val text = AppText.strings("nl")
        val member = ReadingGroupLeaderboardRow("member", "Testlezer", totalPoints = 10,
            totalAyahEquivalent = 20, details = "", readingEntries = listOf(
                ReadingGroupReadingEntry("hizb", 1, "2026-10-09", 30)))
        compose.setContent { QuranTrackerTheme("dark") { GroupLeaderboardRow(text, 1, member) } }
        compose.onNodeWithTag("group_member_reading").assertDoesNotExist()
        compose.onNodeWithText("Testlezer").performClick()
        compose.onNodeWithTag("group_member_reading").assertIsDisplayed()
        compose.onNodeWithText("Hizb 30").assertIsDisplayed()
        compose.onNodeWithText(groupReadingAyahRange(member.readingEntries.first(), text)!!).assertIsDisplayed()
        compose.onNodeWithContentDescription(text.t("groups.reading.close")).performClick()
        compose.onNodeWithTag("group_member_reading").assertDoesNotExist()
    }
}
