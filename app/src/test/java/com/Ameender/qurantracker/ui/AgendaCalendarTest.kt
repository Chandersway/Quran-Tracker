package com.Ameender.qurantracker.ui

import com.Ameender.qurantracker.data.PlanningItem
import java.text.SimpleDateFormat
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Test

class AgendaCalendarTest {
    private val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.ROOT)

    @Test fun selectedWeekCrossesYearBoundary() {
        assertEquals(
            listOf("2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01",
                "2026-01-02", "2026-01-03", "2026-01-04"),
            agendaWeekDates("2026-01-04", formatter)
        )
        assertEquals("2026-01-05", agendaWeekDates("2026-01-05", formatter).first())
    }

    @Test fun movingAWeekChangesVisibleDatesAcrossMonths() {
        val next = agendaDateOffset("2026-09-29", 7, formatter)
        assertEquals("2026-10-06", next)
        assertEquals("2026-10-05", agendaWeekDates(next, formatter).first())
        assertEquals("2026-09-29", agendaDateOffset(next, -7, formatter))
    }

    @Test fun dateOffsetHandlesLeapDay() {
        assertEquals("2028-02-29", agendaDateOffset("2028-02-28", 1, formatter))
        assertEquals("2028-03-01", agendaDateOffset("2028-02-29", 1, formatter))
    }

    @Test fun todayShowsActualPlanningStatus() {
        val today = "2026-09-08"
        val planned = PlanningItem(date = today, type = "rub", referenceId = 1, displayName = "Rub 1")
        assertEquals(AgendaDayStatus.Empty, agendaDayStatus(today, emptyList(), today))
        assertEquals(AgendaDayStatus.Planned, agendaDayStatus(today, listOf(planned), today))
        assertEquals(AgendaDayStatus.Partial,
            agendaDayStatus(today, listOf(planned, planned.copy(id = 2, isDone = true)), today))
        assertEquals(AgendaDayStatus.Completed,
            agendaDayStatus(today, listOf(planned.copy(isDone = true)), today))
        assertEquals(AgendaDayStatus.Missed,
            agendaDayStatus(today, listOf(planned), "2026-09-09"))
    }
}
