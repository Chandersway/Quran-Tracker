package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class RepeatTimingsTest {
    @Test fun completeWarshSequenceAccepted() {
        val rows = (1..285).map { RepeatTiming(it, it * 1000, (it + 1) * 1000) }
        assertEquals(rows, validateRepeatTimings(rows, 285))
    }
    @Test fun rejectsWrongNumberingMissingOrInvalidBoundaries() {
        val bad = listOf(
            listOf(RepeatTiming(1, 0, 100)),
            listOf(RepeatTiming(1, 0, 100), RepeatTiming(3, 100, 200)),
            listOf(RepeatTiming(1, 0, 100), RepeatTiming(2, 90, 200)),
            listOf(RepeatTiming(1, -1, 100), RepeatTiming(2, 100, 200)),
            listOf(RepeatTiming(1, 0, 100), RepeatTiming(2, 100, 100))
        )
        bad.forEach { assertTrue(runCatching { validateRepeatTimings(it, 2) }.isFailure) }
    }
    @Test fun newSourcesAreWarshOnlyAndUseSurahFiles() {
        val reciters = repeatReciterOptions(true).filter { it.timingReadId != null }
        assertEquals(setOf(16, 80, 120), reciters.map { it.timingReadId }.toSet())
        assertTrue(repeatReciterOptions(false).none { it.timingReadId != null })
        assertEquals("https://cdn.mp3quran.net/audio/mahmoud-husary/r3/002.mp3",
            reciters.single { it.timingReadId == 120 }.surahAudioUrl(2))
    }
}
