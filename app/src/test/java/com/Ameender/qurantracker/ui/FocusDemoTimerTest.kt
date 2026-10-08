package com.Ameender.qurantracker.ui

import org.junit.Assert.*
import org.junit.Test

class FocusDemoTimerTest {
    @Test fun startsAtTwentyFiveMinutes() {
        assertEquals(1500, FocusDemoTimer().seconds)
        assertFalse(FocusDemoTimer().running)
    }
    @Test fun monotonicElapsedTimePauseAndResume() {
        val running = FocusDemoTimer().toggle(100)
        val paused = running.pause(1600)
        assertEquals(1498500L, paused.remainingMs)
        assertEquals(paused, paused.sample(999999))
        assertEquals(1497500L, paused.toggle(10000).sample(11000).remainingMs)
    }
    @Test fun delayedTickFinishesAtZeroAndDoesNotStartAutomaticBreak() {
        val done = FocusDemoTimer().toggle(0).sample(2000000)
        assertEquals(0, done.seconds)
        assertFalse(done.running)
        assertEquals(1500, done.toggle(3000000).seconds)
    }
    @Test fun rapidTogglesNeverCreateAdditionalElapsedTime() {
        var state = FocusDemoTimer()
        repeat(100) { state = state.toggle(100) }
        assertFalse(state.running)
        assertEquals(FocusDemoTimer.DURATION_MS, state.remainingMs)
    }
}
