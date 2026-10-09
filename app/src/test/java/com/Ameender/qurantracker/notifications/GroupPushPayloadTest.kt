package com.Ameender.qurantracker.notifications

import org.junit.Assert.*
import org.junit.Test

class GroupPushPayloadTest {
    @Test fun rejectsUntrustedRoutesAndMalformedIdentifiers() {
        assertTrue(validPushUuid("12345678-1234-1234-1234-123456789abc"))
        listOf("", "../groups", "1234", "https://evil.example", "12345678-1234-1234-1234-123456789abc?admin=true")
            .forEach { assertFalse(validPushUuid(it)) }
    }
    @Test fun notificationCopyIsTranslated() {
        listOf("nl", "en", "ar", "fr").forEach {
            assertNotEquals("replyTitle", notificationText(it, "replyTitle"))
            assertNotEquals("replyBody", notificationText(it, "replyBody"))
            assertNotEquals("repliesReady", notificationText(it, "repliesReady"))
            assertNotEquals("repliesHelp", notificationText(it, "repliesHelp"))
        }
    }
}
