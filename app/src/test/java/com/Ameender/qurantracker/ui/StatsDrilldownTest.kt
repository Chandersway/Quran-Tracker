package com.Ameender.qurantracker.ui

import com.Ameender.qurantracker.data.ReadingHistory
import java.time.Instant
import java.time.ZoneId
import org.junit.Assert.*
import org.junit.Test

class StatsDrilldownTest {
    private fun row(id: Int, type: String, number: Int = 1, content: String = "", amount: Int = 1,
                    action: String = "read", timestamp: Long = id.toLong()) =
        ReadingHistory(id = id, surahId = number, surahName = "$type $number", type = type,
            contentType = content, action = action, amount = amount, timestamp = timestamp)

    @Test fun countsRegistrationsAndKeepsOriginalAmountsAndContentTypes() {
        val history = listOf(row(1, "rub", amount = 4), row(2, "rub", content = "juz"),
            row(3, "surah", action = "memorized"), row(4, "rub"))
        val buckets = statsReadingBuckets(history, StatsDistribution.Type)
        assertEquals(3, buckets.sumOf { it.rows.size })
        assertEquals(listOf(4, 1), buckets.single { it.key == "rub" }.rows.map { it.id })
        assertEquals(4, buckets.single { it.key == "rub" }.rows.last().amount)
        assertEquals(listOf(2), buckets.single { it.key == "juz" }.rows.map { it.id })
    }

    @Test fun hizbDetailIncludesRubAndContentTypeRowsButNotAnotherHizb() {
        val history = listOf(row(1, "rub", 2), row(2, "hizb", 2), row(3, "ayah", 2, "hizb"),
            row(4, "surah", 2), row(5, "hizb", 3))
        val buckets = statsReadingBuckets(history, StatsDistribution.Hizb)
        assertEquals(listOf(3, 2, 1), buckets.single { it.key == "2" }.rows.map { it.id })
        assertEquals(listOf(5), buckets.single { it.key == "3" }.rows.map { it.id })
    }

    @Test fun topEightKeepsItsExactUnderlyingRegistrations() {
        val history = (1..10).map { row(it, "surah", it) } + row(11, "surah", 10)
        val buckets = statsReadingBuckets(history, StatsDistribution.Surah)
        assertEquals(8, buckets.size)
        assertEquals("10", buckets.first().key)
        assertEquals(9, buckets.flatMap { it.rows }.size)
    }

    @Test fun sevenCalendarDaysRespectDstAndExclusiveEnd() {
        val zone = ZoneId.of("Europe/Amsterdam")
        val now = Instant.parse("2026-10-27T12:00:00Z")
        val start = Instant.parse("2026-10-20T22:00:00Z").toEpochMilli()
        val end = Instant.parse("2026-10-27T23:00:00Z").toEpochMilli()
        val rows = listOf(row(1, "surah", timestamp = start - 1), row(2, "surah", timestamp = start),
            row(3, "surah", timestamp = end - 1), row(4, "surah", timestamp = end))
        assertEquals(listOf(2, 3), statsPeriodHistory(rows, StatsReadingPeriod.Week, now, zone).map { it.id })
        assertEquals(rows, statsPeriodHistory(rows, StatsReadingPeriod.All, now, zone))
    }

    @Test fun segmentHitTestingUsesClockwiseAnglesAndRejectsCenterOutsideAndEmpty() {
        assertEquals(0, statsRingSegment(50f, 2f, 100f, 10f, listOf(1, 1)))
        assertEquals(0, statsRingSegment(98f, 50f, 100f, 10f, listOf(1, 1)))
        assertEquals(1, statsRingSegment(2f, 50f, 100f, 10f, listOf(1, 1)))
        assertNull(statsRingSegment(50f, 50f, 100f, 10f, listOf(1, 1)))
        assertNull(statsRingSegment(101f, 50f, 100f, 10f, listOf(1, 1)))
        assertNull(statsRingSegment(50f, 2f, 100f, 10f, emptyList()))
        assertEquals(1, statsRingSegment(50f, 2f, 100f, 10f, listOf(0, 3)))
    }
}
