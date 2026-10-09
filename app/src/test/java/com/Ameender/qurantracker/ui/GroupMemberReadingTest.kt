package com.Ameender.qurantracker.ui

import com.Ameender.qurantracker.data.ReadingGroupReadingEntry
import org.junit.Assert.*
import org.junit.Test

class GroupMemberReadingTest {
    @Test fun ayahRangesUseExactPartitionBoundaries() {
        val text = AppText.strings("en")
        fun range(unit: String, number: Int) = groupReadingAyahRange(ReadingGroupReadingEntry(unit, 1, "", number), text)!!
        assertTrue(range("hizb", 1).contains("(1:1)"))
        assertTrue(range("hizb", 1).contains("(2:74)"))
        assertTrue(range("juz", 1).contains("(2:141)"))
        assertTrue(range("juz", 30).contains("(78:1)"))
        assertTrue(range("juz", 30).contains("(114:6)"))
        assertTrue(range("hizb", 60).contains("(114:6)"))
        assertTrue(range("juz", 29).contains("(77:50)"))
        assertNull(groupReadingAyahRange(ReadingGroupReadingEntry("hizb", 1, ""), text))
        assertNull(groupReadingAyahRange(ReadingGroupReadingEntry("hizb", 2, "", 1), text))
        assertNull(groupReadingAyahRange(ReadingGroupReadingEntry("juz", 1, "", 31), text))
        val arabic = groupReadingAyahRange(ReadingGroupReadingEntry("juz", 1, "", 1), AppText.strings("ar"))!!
        assertTrue(arabic.contains("(٢:١٤١)"))
        assertFalse(arabic.any { it in '0'..'9' })
    }
    @Test fun referencesAndQuantitiesAreNotConfused() {
        val text = AppText.strings("nl")
        assertEquals("Hizb 30", groupReadingLabel(ReadingGroupReadingEntry("hizb", 1, "2026-10-09", 30), text))
        assertEquals("3 ${text.groupUnitOption.hizbs}", groupReadingLabel(ReadingGroupReadingEntry("hizb", 3, "2026-10-09"), text))
        assertEquals("5 ${text.groupUnitOption.pages}", groupReadingLabel(ReadingGroupReadingEntry("page", 5, "2026-10-09", 10), text))
    }
    @Test fun translatedReferencesAndDates() {
        assertEquals("Surah 2", groupReadingLabel(ReadingGroupReadingEntry("surah", 1, "", 2), AppText.strings("en")))
        val arabic = AppText.strings("ar")
        assertEquals("الحزب ٣٠", groupReadingLabel(ReadingGroupReadingEntry("hizb", 1, "", 30), arabic))
        assertFalse(groupReadingDate("2026-10-09", arabic).any { it in '0'..'9' })
        assertEquals(arabic.t("groups.reading.unknownDate"), groupReadingDate("", arabic))
    }
}
