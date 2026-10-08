package com.Ameender.qurantracker.ui

import java.time.LocalDateTime
import org.junit.Assert.*
import org.junit.Test

class PlanningDemoTest {
    private val now = LocalDateTime.of(2026, 10, 7, 20, 0)
    @Test fun pastDatesAndPastReminderTimesAreRejected() {
        assertFalse(PlanningDemoItem("hizb", now.toLocalDate().minusDays(1), 1140, false).validAt(now))
        assertFalse(PlanningDemoItem("hizb", now.toLocalDate(), 1140, true).validAt(now))
        assertTrue(PlanningDemoItem("hizb", now.toLocalDate(), 1140, false).validAt(now))
        assertTrue(PlanningDemoItem("hizb", now.toLocalDate().plusDays(1), 1140, true).validAt(now))
    }
    @Test fun dateAndCopyAreLocalized() {
        val date = now.toLocalDate()
        assertNotEquals(planningDemoDate(date, "nl"), planningDemoDate(date, "ar"))
        for (language in listOf("nl", "en", "ar")) {
            for (key in listOf("form", "reminder", "time", "schedule", "planned", "hizb", "juz", "surah", "choosePart", "chooseDate", "invalid", "reminderOn", "reminderOff", "help")) {
                assertFalse(AppText.strings(language).t("onboarding.planning.$key").startsWith("onboarding."))
            }
        }
    }
}
