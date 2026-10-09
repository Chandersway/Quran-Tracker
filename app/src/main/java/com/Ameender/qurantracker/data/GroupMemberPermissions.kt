package com.Ameender.qurantracker.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.EncodeDefault
import kotlinx.serialization.ExperimentalSerializationApi

/** Server-backed settings for the ordinary member role, not the current viewer's role. */
@Serializable
@OptIn(ExperimentalSerializationApi::class)
data class GroupMemberPermissions(
    @EncodeDefault val canPostMessages: Boolean = true,
    @EncodeDefault val canShareProgress: Boolean = true,
    @EncodeDefault val canComment: Boolean = true,
    @EncodeDefault val canInviteMembers: Boolean = false
)
