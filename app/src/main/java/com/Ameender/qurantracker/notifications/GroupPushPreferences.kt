package com.Ameender.qurantracker.notifications

import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
data class GroupPushPreferences(
    @SerialName("user_id") val userId: String,
    val enabled: Boolean = true,
    val mention: Boolean = true,
    val reaction: Boolean = true,
    val announcement: Boolean = true,
    val invitation: Boolean = true,
    @SerialName("join_request") val joinRequest: Boolean = true,
    val update: Boolean = true
)
