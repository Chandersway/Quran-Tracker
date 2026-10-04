package com.Ameender.qurantracker.data

import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate
import java.time.ZoneId

class HizbAnalyticsTest {
    @Test fun periodsUseInclusiveCalendarDates() {
        val today = LocalDate.of(2026, 9, 26)
        assertEquals(LocalDate.of(2026,9,20), hizbDateRange(HizbPeriod.Week,today).from)
        assertEquals(LocalDate.of(2026,8,27), hizbDateRange(HizbPeriod.Month,today).from)
        assertEquals(LocalDate.of(2025,9,27), hizbDateRange(HizbPeriod.Year,today).from)
    }
    @Test fun zeroFillIncludesExactlySixtyOrderedHizbs() {
        val rows = completeHizbCounts(listOf(HizbReadingCount(33, 3)))
        assertEquals((1..60).toList(), rows.map { it.hizbNumber })
        assertEquals(3, rows[32].count)
        assertEquals(0, rows[59].count)
    }
    @Test(expected = IllegalArgumentException::class) fun reversedRangeIsRejected() {
        HizbDateRange(LocalDate.of(2026,9,27),LocalDate.of(2026,9,26))
    }
    @Test fun dstDayUsesLocalMidnightNotFixedTwentyFourHours() {
        val date = LocalDate.of(2026,3,29)
        val (from, end) = HizbDateRange(date,date).bounds(ZoneId.of("Europe/Amsterdam"))
        assertEquals(23L * 60 * 60 * 1000, end - from)
    }
}
