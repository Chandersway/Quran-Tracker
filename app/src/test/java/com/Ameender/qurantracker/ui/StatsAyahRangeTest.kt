package com.Ameender.qurantracker.ui

import com.Ameender.qurantracker.data.ReadingHistory
import org.junit.Assert.*
import org.junit.Test

class StatsAyahRangeTest {
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
