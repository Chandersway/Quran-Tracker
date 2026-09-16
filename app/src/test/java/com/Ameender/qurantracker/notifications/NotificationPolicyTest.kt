package com.Ameender.qurantracker.notifications

import org.junit.Assert.*
import org.junit.Test
import java.time.*

class NotificationPolicyTest {
    private val prefs = NotificationPreferences()
    private val zone = ZoneId.of("Europe/Amsterdam")
    private val quiet = QuietHours(true, 1320, 420)

    @Test fun completeGoalNeverReminds() {
        assertFalse(NotificationPolicy.dailyAllowed(prefs, false, 5, 5))
        assertFalse(NotificationPolicy.dailyAllowed(prefs.copy(extra = true), true, 5, 8))
    }
    @Test fun unfinishedGoalReminds() { assertTrue(NotificationPolicy.dailyAllowed(prefs, false, 5, 3)) }
    @Test fun disabledGoalNeverReminds() { assertFalse(NotificationPolicy.dailyAllowed(prefs, false, 0, 0)) }
    @Test fun masterSwitchOverridesCategories() {
        assertFalse(NotificationPolicy.dailyAllowed(prefs.copy(enabled = false, extra = true), true, 5, 0))
        assertFalse(NotificationPolicy.planningAllowed(prefs.copy(enabled = false), true, false, true))
    }
    @Test fun extraReminderIsOptIn() { assertFalse(NotificationPolicy.dailyAllowed(prefs, true, 5, 0)) }
    @Test fun deletedCompletedAndCancelledItemsNeverRemind() {
        assertFalse(NotificationPolicy.planningAllowed(prefs, false, false, true))
        assertFalse(NotificationPolicy.planningAllowed(prefs, true, true, true))
        assertFalse(NotificationPolicy.planningAllowed(prefs, true, false, false))
        assertTrue(NotificationPolicy.planningAllowed(prefs, true, false, true))
    }
    @Test fun overnightQuietHoursDeferToTomorrow() {
        val at = ZonedDateTime.of(2026, 9, 16, 23, 0, 0, 0, zone).toInstant()
        assertEquals(ZonedDateTime.of(2026, 9, 17, 7, 0, 0, 0, zone).toInstant(), quiet.nextAllowed(at, zone))
    }
    @Test fun quietEndIsExclusive() {
        val at = ZonedDateTime.of(2026, 9, 16, 7, 0, 0, 0, zone).toInstant()
        assertEquals(at, quiet.nextAllowed(at, zone))
    }
    @Test fun springDstUsesActualZoneOffset() {
        val at = ZonedDateTime.of(2026, 3, 28, 23, 0, 0, 0, zone).toInstant()
        assertEquals(7L, Duration.between(at, quiet.nextAllowed(at, zone)).toHours())
    }
    @Test fun autumnDstUsesActualZoneOffset() {
        val at = ZonedDateTime.of(2026, 10, 24, 23, 0, 0, 0, zone).toInstant()
        assertEquals(9L, Duration.between(at, quiet.nextAllowed(at, zone)).toHours())
    }
    @Test fun daytimeQuietWindowIsSupported() {
        val at = Instant.parse("2026-09-16T12:00:00Z")
        assertEquals(Instant.parse("2026-09-16T14:00:00Z"), QuietHours(true, 13 * 60, 16 * 60).nextAllowed(at, zone))
    }
    @Test fun travelReevaluatesLocalQuietWindow() {
        val at = Instant.parse("2026-09-16T21:30:00Z")
        assertNotEquals(at, quiet.nextAllowed(at, zone))
        assertEquals(at, quiet.nextAllowed(at, ZoneId.of("America/New_York")))
    }
    @Test fun equalQuietTimesDisableWindow() { val at = Instant.now(); assertEquals(at, QuietHours(true, 0, 0).nextAllowed(at, zone)) }
    @Test fun globalGroupSwitchAlwaysWins() { assertFalse(NotificationPolicy.groupAllowed(false, true, true, GroupNotificationMode.All, GroupEventType.Mention)) }
    @Test fun mutedGroupNeverDelivers() { assertFalse(NotificationPolicy.groupAllowed(true, true, true, GroupNotificationMode.Muted, GroupEventType.Mention)) }
    @Test fun mentionsModeExcludesOtherEvents() {
        assertTrue(NotificationPolicy.groupAllowed(true, true, true, GroupNotificationMode.Mentions, GroupEventType.Mention))
        assertFalse(NotificationPolicy.groupAllowed(true, true, true, GroupNotificationMode.Mentions, GroupEventType.Reaction))
    }
    @Test fun importantModeExcludesOrdinaryPosts() {
        assertFalse(NotificationPolicy.groupAllowed(true, true, true, GroupNotificationMode.Important, GroupEventType.Post))
        assertTrue(NotificationPolicy.groupAllowed(true, true, true, GroupNotificationMode.Important, GroupEventType.Announcement))
    }
    @Test fun departedMembersNeverReceivePush() { assertFalse(NotificationPolicy.groupAllowed(true, true, false, GroupNotificationMode.All, GroupEventType.Invitation)) }
}
