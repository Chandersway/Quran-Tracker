package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class GroupFeedPresentationTest {
    @Test fun commentCountsUseCorrectLanguageAndNumber() {
        assertEquals("1 reactie", feedCommentLabel(AppText.strings("nl"), 1))
        assertEquals("2 reacties", feedCommentLabel(AppText.strings("nl"), 2))
        assertEquals("1 comment", feedCommentLabel(AppText.strings("en"), 1))
        assertTrue(feedCommentLabel(AppText.strings("ar"), 12).contains("١٢"))
    }
    @Test fun invalidTimestampDoesNotCrash() {
        assertEquals("", feedTimestamp("", "ar"))
        assertEquals("invalid", feedTimestamp("invalid", "en"))
    }
    @Test fun validTimestampIsLocalized() {
        assertTrue(feedTimestamp("2026-10-09T12:00:00Z", "ar").contains("٩"))
        assertFalse(feedTimestamp("2026-10-09T12:00:00Z", "en").contains("2026-10-09T"))
    }
}
