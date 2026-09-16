package com.Ameender.qurantracker.data

import com.Ameender.qurantracker.domain.QuranProgressType

data class ProgressMeasurement(
    val unit: String,
    val amount: Int,
    val referenceId: Int?,
    val ayahEquivalent: Int,
    val pageEquivalent: Int,
    val points: Int
)

object ReadingMetrics {
    private const val TOTAL_AYAHS = 6236
    private const val TOTAL_PAGES = 604
    private const val TOTAL_HIZB = 60
    private const val TOTAL_JUZ = 30
    private const val TOTAL_RUB = 240
    private const val TOTAL_SURAHS = 114

    private val surahAyahCounts = intArrayOf(
        7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99,
        128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
        34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35,
        38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11,
        11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40,
        46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8,
        8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
    )

    const val POINTS_PER_AYAH = 1

    val ayahsPerPage: Int = TOTAL_AYAHS / TOTAL_PAGES
    val ayahsPerRub: Int = TOTAL_AYAHS / TOTAL_RUB
    val ayahsPerHizb: Int = TOTAL_AYAHS / TOTAL_HIZB
    val ayahsPerJuz: Int = TOTAL_AYAHS / TOTAL_JUZ
    private val averageAyahsPerSurah: Int = TOTAL_AYAHS / TOTAL_SURAHS

    fun surahAyahCount(surahId: Int): Int =
        surahAyahCounts.getOrNull(surahId - 1) ?: averageAyahsPerSurah

    fun measure(unit: String, amount: Int, referenceId: Int? = null): ProgressMeasurement {
        val safeAmount = amount.coerceAtLeast(0)
        val ayahEquivalent = ayahEquivalent(unit, safeAmount, referenceId)
        return ProgressMeasurement(
            unit = normalizeUnit(unit),
            amount = safeAmount,
            referenceId = referenceId,
            ayahEquivalent = ayahEquivalent,
            pageEquivalent = pageEquivalent(ayahEquivalent),
            points = pointsForAyahs(ayahEquivalent)
        )
    }

    fun ayahEquivalent(unit: String, amount: Int, referenceId: Int? = null): Int {
        val safeAmount = amount.coerceAtLeast(0)
        return when (normalizeUnit(unit)) {
            "ayah", "ayahs" -> safeAmount
            "page", "pages" -> safeAmount * ayahsPerPage
            QuranProgressType.RUB -> safeAmount * ayahsPerRub
            QuranProgressType.HIZB -> safeAmount * ayahsPerHizb
            QuranProgressType.JUZ -> safeAmount * ayahsPerJuz
            QuranProgressType.SURAH -> {
                if (safeAmount == 1 && referenceId != null) {
                    surahAyahCount(referenceId)
                } else {
                    safeAmount * averageAyahsPerSurah
                }
            }
            else -> safeAmount
        }
    }

    fun historyMeasurement(item: ReadingHistory): ProgressMeasurement {
        if (item.type == "minutes") return measure("ayahs", 0)
        val historyUnit = if (item.type == QuranProgressType.HIZB && item.surahName.contains("(")) {
            QuranProgressType.RUB
        } else {
            item.type
        }
        return measure(historyUnit, item.amount, item.surahId)
    }

    fun historyAyahEquivalent(item: ReadingHistory): Int =
        historyMeasurement(item).ayahEquivalent

    fun pageEquivalent(ayahEquivalent: Int): Int =
        ((ayahEquivalent.coerceAtLeast(0) + ayahsPerPage - 1) / ayahsPerPage).coerceAtLeast(0)

    fun pointsForAyahs(ayahEquivalent: Int): Int =
        ayahEquivalent.coerceAtLeast(0) * POINTS_PER_AYAH

    fun goalUnitAmount(ayahEquivalent: Int, unit: String): Int = when (normalizeUnit(unit)) {
        "page", "pages" -> ayahEquivalent / ayahsPerPage
        "ayah", "ayahs" -> ayahEquivalent
        QuranProgressType.RUB -> ayahEquivalent / ayahsPerRub
        QuranProgressType.HIZB -> ayahEquivalent / ayahsPerHizb
        QuranProgressType.JUZ -> ayahEquivalent / ayahsPerJuz
        else -> ayahEquivalent
    }

    private fun normalizeUnit(unit: String): String = when (unit.trim().lowercase()) {
        "pages" -> "page"
        "ayahs", "ayat" -> "ayah"
        QuranProgressType.RUB -> QuranProgressType.RUB
        QuranProgressType.HIZB -> QuranProgressType.HIZB
        QuranProgressType.JUZ -> QuranProgressType.JUZ
        QuranProgressType.SURAH, "sura", "soera" -> QuranProgressType.SURAH
        else -> unit.trim().lowercase()
    }
}
