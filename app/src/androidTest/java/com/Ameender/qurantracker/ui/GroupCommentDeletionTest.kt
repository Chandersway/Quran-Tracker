package com.Ameender.qurantracker.ui

import androidx.compose.runtime.*
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import com.Ameender.qurantracker.data.ReadingGroupCommentItem
import com.Ameender.qurantracker.data.ReadingGroupFeedItem
import org.junit.Rule
import org.junit.Test

class GroupCommentDeletionTest {
    @get:Rule val compose = createComposeRule()

    @Test fun deleteConfirmationIsSeparateFromSheetAndSupportsRetry() {
        val text = AppText.strings("nl")
        var open by mutableStateOf(true)
        var pending by mutableStateOf(false)
        var error by mutableStateOf("")
        var fail by mutableStateOf(true)
        var comments by mutableStateOf(listOf(ReadingGroupCommentItem(2, "Profielnaam", "Mijn reactie", "", isMine = true)))
        compose.setContent {
            QuranTrackerTheme("dark") {
                if (open) GroupCommentsSheet(text,
                    ReadingGroupFeedItem(1, "Auteur", "text", "Bericht", null, null, "", comments = comments),
                    "Concept bewaren", canComment = true, canModerate = false, busy = false,
                    onDismiss = { open = false }, onDraftChange = {}, onSubmit = {},
                    onDelete = { open = false; pending = true; error = "" })
                if (pending) ConfirmFeedDeleteDialog(text, text.t("groups.feed.comment.delete.title"),
                    text.t("groups.feed.comment.delete.body"), errorMessage = error, busy = false,
                    onDismiss = { pending = false; open = true },
                    onConfirm = {
                        if (fail) error = "Probeer opnieuw" else {
                            comments = emptyList(); pending = false; open = true
                        }
                    })
            }
        }
        fun request() = compose.onNodeWithContentDescription(text.t("groups.feed.comment.delete.action")).performClick()
        request()
        compose.onNodeWithTag("group_comments_sheet").assertDoesNotExist()
        compose.onNodeWithText(text.t("common.cancel")).performClick()
        compose.onNodeWithText("Mijn reactie").assertIsDisplayed()
        request()
        compose.onNodeWithText(text.t("groups.feed.delete.confirm")).performClick()
        compose.onNodeWithText("Probeer opnieuw").assertIsDisplayed()
        compose.runOnIdle { fail = false }
        compose.onNodeWithText(text.t("groups.feed.delete.confirm")).performClick()
        compose.onNodeWithText("Mijn reactie").assertDoesNotExist()
        compose.onNodeWithText(text.t("groups.feed.noComments")).assertIsDisplayed()
        compose.onNodeWithTag("group_comment_draft").assertTextContains("Concept bewaren")
    }
}
