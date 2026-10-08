package com.Ameender.qurantracker.notifications

import java.time.Instant
import java.time.LocalTime
import java.time.ZoneId

enum class NotificationCategory { DailyGoal, Planning, Group }
enum class GroupNotificationMode { All, Important, Mentions, Muted }
enum class GroupEventType { Mention, Reaction, Announcement, Invitation, JoinRequest, Update, Post }

data class QuietHours(val enabled: Boolean = false, val startMinute: Int = 22 * 60, val endMinute: Int = 7 * 60) {
    init { require(startMinute in 0..1439 && endMinute in 0..1439) }
    fun nextAllowed(at: Instant, zone: ZoneId): Instant {
        if (!enabled || startMinute == endMinute) return at
        val local = at.atZone(zone)
        val minute = local.hour * 60 + local.minute
        val overnight = startMinute > endMinute
        val quiet = if (overnight) minute >= startMinute || minute < endMinute else minute >= startMinute && minute < endMinute
        if (!quiet) return at
        val endDate = if (overnight && minute >= startMinute) local.toLocalDate().plusDays(1) else local.toLocalDate()
        return endDate.atTime(LocalTime.of(endMinute / 60, endMinute % 60)).atZone(zone).toInstant()
    }
}

data class NotificationPreferences(
    val enabled: Boolean = true,
    val daily: Boolean = true,
    val dailyMinute: Int = 19 * 60,
    val extra: Boolean = false,
    val extraMinute: Int = 21 * 60,
    val planning: Boolean = true,
    val quiet: QuietHours = QuietHours()
) {
    init { require(dailyMinute in 0..1439 && extraMinute in 0..1439) }
}

object NotificationPolicy {
    fun dailyAllowed(preferences: NotificationPreferences, extra: Boolean, target: Int, done: Int): Boolean =
        preferences.enabled && (if (extra) preferences.extra else preferences.daily)

    fun planningAllowed(preferences: NotificationPreferences, exists: Boolean, done: Boolean, reminderSet: Boolean): Boolean =
        preferences.enabled && preferences.planning && exists && !done && reminderSet

    fun groupAllowed(global: Boolean, categoryEnabled: Boolean, member: Boolean, mode: GroupNotificationMode, type: GroupEventType): Boolean {
        if (!global || !categoryEnabled || !member || mode == GroupNotificationMode.Muted) return false
        return when (mode) {
            GroupNotificationMode.All -> true
            GroupNotificationMode.Important -> type != GroupEventType.Post
            GroupNotificationMode.Mentions -> type == GroupEventType.Mention
            GroupNotificationMode.Muted -> false
        }
    }
}
