package com.Ameender.qurantracker.ui

import org.junit.Assert.assertEquals
import org.junit.Test

class DailyGoalNumbersTest {
    @Test fun localizedDailyGoalCounts() {
        assertEquals("٣ من ١٢", dailyGoalCountLabel(3, 12, "ar"))
        assertEquals("٠", dailyGoalNumber(0, "ar"))
        assertEquals("3 van 12", dailyGoalCountLabel(3, 12, "nl"))
        assertEquals("3 of 12", dailyGoalCountLabel(3, 12, "en"))
    }
}
