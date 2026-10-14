package com.Ameender.qurantracker.ui

import com.Ameender.qurantracker.data.ReadingHistory
import org.junit.Assert.*
import org.junit.Test

class StatsAyahRangeTest {
    @Test fun hizbAndPartialRegistrationsShowTheHizbScreenOpening() {
        val history = ReadingHistory(surahId = 3, surahName = "Hizb 3", type = "hizb", action = "read")
        val expected = com.Ameender.qurantracker.data.ALL_HIZB.first { it.hizbNumber == 3 }
            .startText.split(Regex("\\s+")).take(4).joinToString(" ")
        assertEquals(expected, statsHistoryOpening(history))
        assertEquals(expected, statsHistoryOpening(history.copy(type = "rub", surahName = "Hizb 3 (1/4)")))
        assertEquals(expected, statsHistoryOpening(history.copy(type = "ayah", contentType = "hizb")))
        assertNull(statsHistoryOpening(history.copy(type = "surah")))
    }

    @Test fun registrationTitleUsesContentIdentityInsteadOfAyahTextOrMeasurementUnit() {
        val history = ReadingHistory(surahId = 6, surahName = "Beginning of an ayah", type = "ayah", action = "read")
        assertEquals("Juz 6", statsHistoryTitle(history.copy(contentType = "juz")))
        assertEquals("Hizb 6", statsHistoryTitle(history.copy(contentType = "hizb")))
        assertEquals("Juz 6", statsHistoryTitle(history.copy(type = "juz")))
        assertEquals("Hizb 6", statsHistoryTitle(history.copy(type = "hizb")))
        assertEquals("Hizb 6 - Rub 1/4", statsHistoryTitle(history.copy(type = "rub", surahName = "Hizb 6 (1/4) - Beginning of an ayah")))
        assertEquals("Al-An'am", statsHistoryTitle(history.copy(contentType = "surah", surahName = "Al-An'am")))
    }

    @Test fun historyShowsExactRangesIncludingPartialHizb() {
        val text = AppText.strings("nl")
        fun history(type: String, number: Int, name: String = "") = ReadingHistory(surahId = number, surahName = name, type = type, action = "read")
        assertTrue(statsHistoryAyahRange(history("hizb", 1), text)!!.contains("(2:74)"))
        assertTrue(statsHistoryAyahRange(history("juz", 30), text)!!.contains("(114:6)"))
        assertTrue(statsHistoryAyahRange(history("rub", 1, "Hizb 1 (1/4)"), text)!!.contains("(2:25)"))
        assertTrue(statsHistoryAyahRange(history("hizb", 1, "Hizb 1 (1/2)"), text)!!.contains("(2:26)"))
        assertNull(statsHistoryAyahRange(history("rub", 1), text))
        assertNull(statsHistoryAyahRange(history("hizb", 0), text))
    }
}
