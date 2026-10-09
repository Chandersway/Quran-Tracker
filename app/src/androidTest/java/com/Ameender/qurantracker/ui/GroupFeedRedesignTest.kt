package com.Ameender.qurantracker.ui

import android.graphics.Bitmap
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.test.platform.app.InstrumentationRegistry
import com.Ameender.qurantracker.data.ReadingGroupCommentItem
import com.Ameender.qurantracker.data.ReadingGroupFeedItem
import org.junit.Rule
import org.junit.Test
import java.io.File

class GroupFeedRedesignTest {
    @get:Rule val compose = createComposeRule()
    @Test fun commentsAreCollapsedAndActionsWorkInAllLanguages() {
        val language = mutableStateOf("nl")
        val open = mutableStateOf(false)
        val draft = mutableStateOf("")
        val allowed = mutableStateOf(true)
        var submissions = 0
        compose.setContent {
            val text = AppText.strings(language.value)
            CompositionLocalProvider(LocalLayoutDirection provides if (language.value == "ar") LayoutDirection.Rtl else LayoutDirection.Ltr) {
                QuranTrackerTheme("dark") {
                    Column(Modifier.width(360.dp).height(740.dp).background(Color(0xFF071426))
                        .verticalScroll(rememberScrollState()).padding(16.dp)) {
                        FeedPostCard(text, ReadingGroupFeedItem(
                            id = 1, displayName = "Quran Reader", type = "text",
                            message = if(language.value == "ar") "الحمد لله، قرأت اليوم حزبا. كيف تسير قراءتكم؟" else "Alhamdulillah, vandaag een hizb gelezen. Hoe gaat het met jullie leesdoel?",
                            unit = null, amount = null, createdAt = "2026-10-09T12:00:00Z",
                            commentCount = 1, isMine = true,
                            comments = listOf(ReadingGroupCommentItem(2, "Mijn profielnaam", "Test reply", "2026-10-09T12:01:00Z"))
                        ), currentRole = "member", replyOpen = open.value, onToggleReply = { open.value = !open.value },
                            replyDraft = draft.value, onReplyDraftChange = { draft.value = it },
                            canComment = allowed.value, onSubmitReply = { submissions++ })
                        for (index in 2..3) FeedPostCard(text, ReadingGroupFeedItem(
                            id = index.toLong(), displayName = if(index == 2) "Maryam" else "Yusuf",
                            type = "text", message = if (language.value == "ar") "خطوة صغيرة كل يوم. بارك الله فيكم."
                                else "Elke dag een klein stukje verder. Moge Allah jullie inspanning accepteren.",
                            unit = null, amount = null, createdAt = "2026-10-09T11:30:00Z"
                        ), currentRole = "member")
                    }
                }
            }
        }
        for (locale in listOf("nl", "en", "ar")) {
            compose.runOnIdle { language.value = locale; open.value = false; allowed.value = true; draft.value = "" }
            val text = AppText.strings(locale)
            compose.onNodeWithText("Test reply").assertDoesNotExist()
            capture("feed-$locale")
            compose.onNodeWithText(feedCommentLabel(text, 1)).performScrollTo().performClick()
            compose.onNodeWithTag("group_comments_sheet").assertIsDisplayed()
            compose.onNodeWithText("Mijn profielnaam").assertIsDisplayed()
            compose.onNodeWithText("Test reply").assertExists()
            capture("feed-$locale-comments", sheet = true)
            compose.onNodeWithTag("group_comment_send").assertIsNotEnabled()
            compose.onNodeWithTag("group_comment_draft").performTextInput("Mijn reactie")
            compose.onNodeWithContentDescription(text.t("groups.feed.closeDiscussion")).performClick()
            compose.onNodeWithTag("group_comments_sheet").assertDoesNotExist()
            compose.onNodeWithText(feedCommentLabel(text, 1)).performScrollTo().performClick()
            compose.onNodeWithTag("group_comment_draft").assertTextContains("Mijn reactie")
            compose.onNodeWithTag("group_comment_send").performClick()
            compose.runOnIdle { allowed.value = false }
            compose.onNodeWithTag("group_comment_draft").assertDoesNotExist()
            compose.onNodeWithContentDescription(text.t("groups.feed.closeDiscussion")).performClick()
            compose.onAllNodesWithContentDescription(text.t("groups.feed.moreActions"))[0].performScrollTo().performClick()
            compose.onNodeWithText(text.t("groups.feed.edit.action")).assertIsDisplayed()
            compose.onNodeWithText(text.t("groups.feed.edit.action")).performClick()
        }
        compose.runOnIdle { org.junit.Assert.assertEquals(3, submissions) }
    }
    private fun capture(name: String, sheet: Boolean = false) {
        val node = if (sheet) compose.onNodeWithTag("group_comments_sheet") else compose.onRoot()
        val bitmap = node.captureToImage().asAndroidBitmap()
        File(InstrumentationRegistry.getInstrumentation().targetContext.getExternalFilesDir(null), "$name.png")
            .outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
    }
}
