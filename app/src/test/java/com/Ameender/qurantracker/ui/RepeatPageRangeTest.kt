package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class RepeatPageRangeTest {
    @Test fun validRangesIncludeSinglePageAndEndpoints() {
        for ((a, b) in listOf("10" to "12", "1" to "1", "604" to "604", "1" to "604"))
            assertTrue(validRepeatPageRange(a, b))
    }
    @Test fun invalidRangesAreRejected() {
        for ((a, b) in listOf("" to "12", "10" to "", "0" to "12", "12" to "10", "1" to "605", "x" to "2"))
            assertFalse(validRepeatPageRange(a, b))
    }
}
