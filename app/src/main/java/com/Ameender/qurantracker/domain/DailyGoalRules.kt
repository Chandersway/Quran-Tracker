package com.Ameender.qurantracker.domain

fun deriveDailyGoalFromJourney(totalDays: Int): Pair<String, Int> {
    val partsPerDay = kotlin.math.ceil(240.0 / totalDays.coerceIn(1, 240)).toInt().coerceAtLeast(1)
    return when {
        partsPerDay % 8 == 0 -> QuranProgressType.JUZ to (partsPerDay / 8).coerceAtLeast(1)
        partsPerDay % 4 == 0 -> QuranProgressType.HIZB to (partsPerDay / 4).coerceAtLeast(1)
        else -> QuranProgressType.RUB to partsPerDay
    }
}
