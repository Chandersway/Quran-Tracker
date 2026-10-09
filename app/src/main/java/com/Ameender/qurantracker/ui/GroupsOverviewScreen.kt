package com.Ameender.qurantracker.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.Ameender.qurantracker.data.ReadingGroupDetails

private val GroupsOverviewGreen: Color get() = Gold
private val GroupsOverviewDeepGreen: Color get() = MidNavy
private val GroupsOverviewCream: Color get() = DarkNavy
private val GroupsOverviewCard: Color get() = MidNavy
private val GroupsOverviewLine: Color get() = BorderNavy
private val GroupsOverviewInk: Color get() = SoftTextGold
private val GroupsOverviewMuted: Color get() = MutedGold
private val GroupsOverviewSoftGreen: Color get() = GoldSurface
private val GroupsOverviewOnPrimary: Color get() = DarkNavy

@Composable
internal fun GroupsOverviewScreen(
    text: AppStrings,
    groups: List<ReadingGroupDetails>,
    activeGroupCode: String,
    memberCount: Int,
    statusMessage: String,
    joinCode: String,
    onJoinCodeChange: (String) -> Unit,
    busy: Boolean,
    onCreateGroup: () -> Unit,
    onOpenGroup: (String) -> Unit,
    onJoinGroup: () -> Unit
) {
    var selectedTab by rememberSaveable { mutableStateOf("mine") }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    val filteredGroups = groups.filter { group ->
        searchQuery.isBlank() || listOf(group.name, group.description, group.code)
            .any { it.contains(searchQuery.trim(), ignoreCase = true) }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(GroupsOverviewCream),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text.t("groups.overview.subtitle"),
            color = GroupsOverviewMuted,
            fontSize = 12.sp
        )

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it.take(60) },
            modifier = Modifier.fillMaxWidth(),
            placeholder = {
                Text(text.t("groups.search.placeholder"), color = GroupsOverviewMuted, fontSize = 12.sp)
            },
            leadingIcon = {
                Icon(Icons.Default.Search, contentDescription = null, tint = GroupsOverviewMuted)
            },
            singleLine = true,
            shape = RoundedCornerShape(13.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = GroupsOverviewCard,
                unfocusedContainerColor = GroupsOverviewCard,
                focusedBorderColor = GroupsOverviewGreen,
                unfocusedBorderColor = GroupsOverviewLine,
                focusedTextColor = GroupsOverviewInk,
                unfocusedTextColor = GroupsOverviewInk,
                cursorColor = GroupsOverviewGreen
            )
        )

        GroupsOverviewTabs(
            text = text,
            selected = selectedTab,
            onSelected = { selectedTab = it }
        )

        if (statusMessage.isNotBlank()) {
            Text(
                statusMessage,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(GroupsOverviewSoftGreen, RoundedCornerShape(12.dp))
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                color = GroupsOverviewInk,
                fontSize = 11.sp
            )
        }

        when (selectedTab) {
            "invitations" -> {
                GroupsSectionTitle(title = text.t("groups.invitations.title"))
                InvitationCard(
                    text = text,
                    joinCode = joinCode,
                    onJoinCodeChange = onJoinCodeChange,
                    busy = busy,
                    onJoinGroup = onJoinGroup
                )
            }

            else -> {
                GroupsSectionTitle(title = text.t("groups.mine.title"))
                OutlinedButton(
                    onClick = { selectedTab = "invitations" },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    enabled = !busy
                ) { Text(text.groupJoinText.title, fontWeight = FontWeight.Bold) }
                if (groups.isEmpty()) {
                    GroupsEmptyCard(text = text, onCreateGroup = onCreateGroup)
                } else if (filteredGroups.isEmpty()) {
                    Text(
                        text.t("groups.search.empty"),
                        modifier = Modifier.padding(vertical = 18.dp),
                        color = GroupsOverviewMuted,
                        fontSize = 13.sp
                    )
                } else {
                    filteredGroups.forEach { group ->
                        ActiveGroupCard(
                            text = text,
                            name = group.name.ifBlank { text.groups },
                            description = group.description,
                            code = group.code,
                            memberCount = memberCount.takeIf {
                                group.code.equals(activeGroupCode, ignoreCase = true)
                            },
                            isOwner = group.isOwner,
                            onOpen = { onOpenGroup(group.code) }
                        )
                    }
                }

                Button(
                    onClick = onCreateGroup,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = GroupsOverviewGreen),
                    shape = RoundedCornerShape(13.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(7.dp))
                    Text(text.groupCreateAction, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(Modifier.height(70.dp))
    }
}

@Composable
internal fun GroupsOverviewLoading(text: AppStrings) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(GroupsOverviewCream)
            .padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        CircularProgressIndicator(color = GroupsOverviewGreen, strokeWidth = 3.dp)
        Text(
            text.t("group.loadingExisting"),
            color = GroupsOverviewInk,
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp
        )
        Text(text.t("group.loadingExistingBody"), color = GroupsOverviewMuted, fontSize = 12.sp)
    }
}

@Composable
private fun GroupsOverviewTabs(text: AppStrings, selected: String, onSelected: (String) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        listOf(
            "mine" to text.t("groups.tab.mine"),
            "invitations" to text.t("groups.tab.invitations")
        ).forEach { (key, label) ->
            val isSelected = selected == key
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onSelected(key) },
                shape = RoundedCornerShape(9.dp),
                color = if (isSelected) GroupsOverviewGreen else Color.Transparent,
                border = if (isSelected) null else BorderStroke(1.dp, Color.Transparent)
            ) {
                Text(
                    label,
                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 9.dp),
                    color = if (isSelected) GroupsOverviewOnPrimary else GroupsOverviewInk,
                    fontSize = 11.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun GroupsSectionTitle(title: String, action: String? = null, onAction: () -> Unit = {}) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, color = GroupsOverviewInk, fontSize = 15.sp, fontWeight = FontWeight.Bold)
        if (action != null) {
            Text(
                action,
                modifier = Modifier.clickable(onClick = onAction).padding(4.dp),
                color = GroupsOverviewGreen,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun ActiveGroupCard(
    text: AppStrings,
    name: String,
    description: String,
    code: String,
    memberCount: Int?,
    isOwner: Boolean,
    onOpen: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(GroupsOverviewCard, RoundedCornerShape(16.dp))
            .border(1.dp, GroupsOverviewLine, RoundedCornerShape(16.dp))
            .clickable(onClick = onOpen)
            .padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        GroupLogo(code = code, canEdit = false, text = text, size = 54.dp)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(name, color = GroupsOverviewInk, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            if (description.isNotBlank()) {
                Text(
                    description,
                    color = GroupsOverviewMuted,
                    fontSize = 10.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Text(
                buildList {
                    memberCount?.let { add(text.groupHome.membersCount.format(it.coerceAtLeast(1))) }
                    add(if (isOwner) text.groupOwnerBadge else text.t("groups.member"))
                    add(code)
                }.joinToString("  ·  "),
                color = GroupsOverviewMuted,
                fontSize = 10.sp
            )
        }
    }
}

@Composable
private fun GroupsEmptyCard(text: AppStrings, onCreateGroup: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(GroupsOverviewCard, RoundedCornerShape(16.dp))
            .border(1.dp, GroupsOverviewLine, RoundedCornerShape(16.dp))
            .padding(18.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(Icons.Default.Groups, contentDescription = null, tint = GroupsOverviewGreen, modifier = Modifier.size(34.dp))
        Text(text.groupNoGroupTitle, color = GroupsOverviewInk, fontSize = 15.sp, fontWeight = FontWeight.Bold)
        Text(text.groupNoGroupBody, color = GroupsOverviewMuted, fontSize = 11.sp)
        Button(
            onClick = onCreateGroup,
            colors = ButtonDefaults.buttonColors(containerColor = GroupsOverviewGreen),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(17.dp))
            Spacer(Modifier.width(6.dp))
            Text(text.groupCreateAction, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun InvitationCard(
    text: AppStrings,
    joinCode: String,
    onJoinCodeChange: (String) -> Unit,
    busy: Boolean,
    onJoinGroup: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(GroupsOverviewCard, RoundedCornerShape(16.dp))
            .border(1.dp, GroupsOverviewLine, RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .background(GroupsOverviewSoftGreen, RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Lock, contentDescription = null, tint = GroupsOverviewGreen)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(text.groupJoinText.title, color = GroupsOverviewInk, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                Text(text.groupJoinText.subtitle, color = GroupsOverviewMuted, fontSize = 10.sp)
            }
        }
        OutlinedTextField(
            value = joinCode,
            onValueChange = onJoinCodeChange,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(text.groupJoinText.placeholder, fontSize = 12.sp) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = GroupsOverviewGreen,
                unfocusedBorderColor = GroupsOverviewLine,
                focusedContainerColor = GroupsOverviewCream,
                unfocusedContainerColor = GroupsOverviewCream,
                focusedTextColor = GroupsOverviewInk,
                unfocusedTextColor = GroupsOverviewInk
            )
        )
        OutlinedButton(
            onClick = onJoinGroup,
            enabled = !busy && joinCode.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(46.dp),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, GroupsOverviewGreen),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = GroupsOverviewGreen)
        ) {
            if (busy) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    color = GroupsOverviewGreen,
                    strokeWidth = 2.dp
                )
                Spacer(Modifier.width(8.dp))
            }
            Text(text.groupJoinAction, fontWeight = FontWeight.Bold)
        }
        Text(
            text.t("groups.requests.requestHint"),
            color = GroupsOverviewMuted,
            fontSize = 10.sp,
            lineHeight = 14.sp
        )
    }
}
