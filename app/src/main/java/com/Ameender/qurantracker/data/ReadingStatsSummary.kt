package com.Ameender.qurantracker.data

import com.Ameender.qurantracker.domain.QuranAction
import com.Ameender.qurantracker.domain.QuranProgressType
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class ReadingStatsSummary(
    val totalActions: Int,
    val readActions: Int,
    val ayahEquivalent: Int,
    val pageEquivalent: Int,
    val surahReads: Int,
    val juzReads: Int,
    val rubReads: Int,
    val completedHizbEquivalent: Int,
    val points: Int,
    val todayAyahEquivalent: Int,
    val weekAyahEquivalent: Int,
    val monthAyahEquivalent: Int,
    val activeDaysThisWeek: Int,
    val currentStreak: Int
)

fun readingStatsSummary(history: List<ReadingHistory>, now: Calendar = Calendar.getInstance()): ReadingStatsSummary {
    val readHistory = history.filter { it.action == QuranAction.READ }
    val todayStart = startOfDayMillis(now)
    val weekStart = startOfWeekMillis(now)
    val monthStart = startOfMonthMillis(now)
    val ayahEquivalent = readHistory.sumOf { ReadingMetrics.historyAyahEquivalent(it) }
    val rubReads = readHistory.sumOf {
        when {
            it.type == QuranProgressType.RUB -> it.amount
            it.type == QuranProgressType.HIZB && it.surahName.contains("(") -> it.amount
            it.type == QuranProgressType.HIZB -> it.amount * 4
            else -> 0
        }
    }

    return ReadingStatsSummary(
        totalActions = history.size,
        readActions = readHistory.size,
        ayahEquivalent = ayahEquivalent,
        pageEquivalent = ReadingMetrics.pageEquivalent(ayahEquivalent),
        surahReads = readHistory.filter { it.type == QuranProgressType.SURAH }.sumOf { it.amount },
        juzReads = readHistory.filter { it.type == QuranProgressType.JUZ }.sumOf { it.amount },
        rubReads = rubReads,
        completedHizbEquivalent = rubReads / 4,
        points = ReadingMetrics.pointsForAyahs(ayahEquivalent),
        todayAyahEquivalent = readHistory
            .filter { it.timestamp >= todayStart }
            .sumOf { ReadingMetrics.historyAyahEquivalent(it) },
        weekAyahEquivalent = readHistory
            .filter { it.timestamp >= weekStart }
            .sumOf { ReadingMetrics.historyAyahEquivalent(it) },
        monthAyahEquivalent = readHistory
            .filter { it.timestamp >= monthStart }
            .sumOf { ReadingMetrics.historyAyahEquivalent(it) },
        activeDaysThisWeek = readHistory
            .filter { it.timestamp >= weekStart }
            .mapNotNull { historyDateKey(it) }
            .distinct()
            .size,
        currentStreak = currentReadingStreak(history)
    )
}

private fun currentReadingStreak(history: List<ReadingHistory>): Int {
    val activeDateKeys = history
        .filter { it.action == QuranAction.READ || it.action == QuranAction.MEMORIZED }
        .mapNotNull { historyDateKey(it) }
        .toSet()
    if (activeDateKeys.isEmpty()) return 0

    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val calendar = Calendar.getInstance()
    var currentKey = formatter.format(calendar.time)
    if (!activeDateKeys.contains(currentKey)) {
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        currentKey = formatter.format(calendar.time)
    }

    var streak = 0
    while (activeDateKeys.contains(currentKey)) {
        streak++
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        currentKey = formatter.format(calendar.time)
    }
    return streak
}

private fun historyDateKey(history: ReadingHistory): String? {
    if (history.dateKey.isNotBlank()) return history.dateKey
    if (history.timestamp <= 0L) return null
    return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(history.timestamp))
}

private fun startOfDayMillis(calendar: Calendar): Long =
    calendar.copyAtStart().timeInMillis

private fun startOfWeekMillis(calendar: Calendar): Long =
    calendar.copyAtStart().apply {
        firstDayOfWeek = Calendar.MONDAY
        set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
    }.timeInMillis

private fun startOfMonthMillis(calendar: Calendar): Long =
    calendar.copyAtStart().apply {
        set(Calendar.DAY_OF_MONTH, 1)
    }.timeInMillis

private fun Calendar.copyAtStart(): Calendar =
    (clone() as Calendar).apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }
