package com.Ameender.qurantracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.ReadingGroupCommentItem
import com.Ameender.qurantracker.data.ReadingGroupFeedItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun GroupCommentsSheet(
    text: AppStrings,
    post: ReadingGroupFeedItem,
    draft: String,
    canComment: Boolean,
    canModerate: Boolean,
    busy: Boolean,
    onDismiss: () -> Unit,
    onDraftChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onDelete: (ReadingGroupCommentItem) -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = DarkNavy,
        contentColor = SoftTextGold
    ) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(0.85f).imePadding().testTag("group_comments_sheet")) {
            Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Text(text.t("groups.feed.discussion"), Modifier.weight(1f), fontSize = 18.sp, fontWeight = FontWeight.Bold)
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = text.t("groups.feed.closeDiscussion"))
                }
            }
            HorizontalDivider(color = BorderNavy)
            LazyColumn(Modifier.weight(1f).fillMaxWidth(), contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)) {
                item(key = "original-post") {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(post.displayName, fontWeight = FontWeight.Bold, color = GoldLight)
                        Text(post.message, fontSize = 14.sp, lineHeight = 21.sp)
                        HorizontalDivider(Modifier.padding(top = 12.dp), color = BorderNavy)
                    }
                }
                if (post.comments.isEmpty()) item(key = "empty") {
                    Text(text.t("groups.feed.noComments"), color = MutedGold)
                }
                items(post.comments, key = { it.serverId.ifBlank { it.id.toString() } }) { comment ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Surface(shape = CircleShape, color = Gold.copy(alpha = 0.12f)) {
                            Box(Modifier.size(32.dp), contentAlignment = Alignment.Center) {
                                Text(comment.displayName.trim().take(1).uppercase(), color = Gold, fontWeight = FontWeight.Bold)
                            }
                        }
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(comment.displayName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = GoldLight)
                            Text(comment.content, fontSize = 14.sp, lineHeight = 21.sp)
                            Text(feedTimestamp(comment.createdAt, text.localeCode), fontSize = 11.sp, color = MutedGold)
                        }
                        if (comment.isMine || canModerate) IconButton(onClick = { onDelete(comment) }, enabled = !busy) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = text.t("groups.feed.comment.delete.action"),
                                tint = MutedGold, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
            HorizontalDivider(color = BorderNavy)
            if (canComment) Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = draft, onValueChange = onDraftChange,
                    modifier = Modifier.weight(1f).testTag("group_comment_draft"),
                    placeholder = { Text(text.groupFeedReplyPlaceholder) }, maxLines = 4,
                    enabled = !busy)
                IconButton(onClick = onSubmit, enabled = !busy && draft.isNotBlank(),
                    modifier = Modifier.testTag("group_comment_send")) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = text.groupFeedReplySubmit, tint = Gold)
                }
            } else Text(text.t("groups.error.permission"), Modifier.padding(16.dp), color = MutedGold)
        }
    }
}
