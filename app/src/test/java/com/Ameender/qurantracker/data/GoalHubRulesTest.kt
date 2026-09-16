package com.Ameender.qurantracker.data

import org.junit.Assert.*
import org.junit.Test

class GoalHubRulesTest {
    private val date = "2026-09-08"
    private fun entry(unit: String, amount: Int, action: String = "read") =
        ReadingHistory(surahId = 1, surahName = "Session", type = unit, action = action, dateKey = date, amount = amount)

    @Test fun differentActivitiesStaySeparateAndUseAmounts() {
        val history = listOf(entry("pages", 3), entry("ayahs", 8, "memorized"), entry("hizb", 1, "review"))
        assertEquals(3, goalProgress(GoalDay(1, date, "pages", 5), history).done)
        assertEquals(8, goalProgress(GoalDay(2, date, "ayahs", 12), history).done)
        assertEquals(1, goalProgress(GoalDay(3, date, "hizb", 2), history).done)
    }

    @Test fun selectedContentCountsAsOneWholeSurahHizbOrJuz() {
        assertEquals(1, goalProgress(GoalDay(1, date, "hizb", 3), listOf(entry("hizb", 1))).done)
        assertEquals(2, goalProgress(GoalDay(1, date, "hizb", 3), listOf(entry("juz", 1))).done)
        val alFatiha = ReadingHistory(1, 1, "Al-Fatiha", "surah", "read", dateKey = date)
        assertEquals(7, goalProgress(GoalDay(1, date, "ayahs", 10), listOf(alFatiha)).done)
    }

    @Test fun moreThanFiftyActivitiesAndExactUnitConversions() {
        assertEquals(80, goalProgress(GoalDay(1, date, "ayahs", 100), List(80) { entry("ayahs", 1) }).done)
        assertEquals(1, goalProgress(GoalDay(1, date, "hizb", 2), listOf(entry("rub", 4))).done)
        assertEquals(2, goalProgress(GoalDay(1, date, "hizb", 2), listOf(entry("juz", 1))).done)
    }

    @Test fun minutesNeverPretendToBePages() {
        val history = listOf(entry("minutes", 30), entry("pages", 2))
        assertEquals(30, goalProgress(GoalDay(1, date, "minutes", 20), history).done)
        assertEquals(2, goalProgress(GoalDay(1, date, "pages", 5), history).done)
        assertEquals(20, ReadingMetrics.historyAyahEquivalent(entry("pages", 2)))
        assertEquals(0, ReadingMetrics.historyAyahEquivalent(entry("minutes", 30)))
    }

    @Test fun targetCarryOverIsNotCompletedActivityAndPercentClamps() {
        val day = GoalDay(1, date, "pages", 5, extra = 3)
        assertEquals(5, goalProgress(day, listOf(entry("pages", 3))).remaining)
        assertEquals(0, goalProgress(day, listOf(entry("pages", 12))).remaining)
        assertEquals(1f, goalProgress(day, listOf(entry("pages", 12))).fraction)
        assertEquals(0f, goalProgress(day.copy(target = 0, extra = 0), emptyList()).fraction)
    }

    @Test fun journeyUsesSameActivityAndTwoPagesMeans302Days() {
        assertEquals(302.0, 1.0 / (unitQuranFraction("pages") * 2), 0.000001)
        val history = listOf(entry("pages", 302), entry("pages", 302, "memorized"))
        assertEquals(0.5, journeyFraction(history), 0.000001)
        assertEquals(1.0, journeyFraction(listOf(entry("pages", 700))), 0.000001)
    }
}
