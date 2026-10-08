package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class RepeatSequenceTest {
    @Test fun twoRoundsPlayExactlyTwiceAndStop() {
        var step: Pair<Int, Int>? = 0 to 1
        val visited = mutableListOf<Pair<Int, Int>>()
        while (step != null) {
            visited += step
            step = nextRepeatStep(step.first, step.second, 3, 2)
        }
        assertEquals(listOf(0 to 1, 1 to 1, 2 to 1, 0 to 2, 1 to 2, 2 to 2), visited)
    }
    @Test fun singleAyahRestartsAndStops() {
        assertEquals(0 to 2, nextRepeatStep(0, 1, 1, 2))
        assertNull(nextRepeatStep(0, 2, 1, 2))
    }
    @Test fun continuousHasNoFiniteStop() {
        assertEquals(0 to 101, nextRepeatStep(4, 100, 5, 0))
    }
    @Test(expected = IllegalArgumentException::class) fun emptySelectionIsRejected() {
        nextRepeatStep(0, 1, 0, 2)
    }
}
