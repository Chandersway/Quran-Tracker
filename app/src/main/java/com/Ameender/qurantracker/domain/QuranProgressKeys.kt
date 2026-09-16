package com.Ameender.qurantracker.domain

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object QuranProgressType {
    const val JUZ = "juz"
    const val HIZB = "hizb"
    const val RUB = "rub"
    const val SURAH = "surah"
}

object QuranAction {
    const val READ = "read"
    const val MEMORIZED = "memorized"
}

fun juzProgressId(juzNumber: Int): String = "${QuranProgressType.JUZ}_$juzNumber"

fun hizbProgressId(hizbNumber: Int): String = "${QuranProgressType.HIZB}_$hizbNumber"

fun rubProgressId(hizbNumber: Int, rubNumber: Int): String =
    "${QuranProgressType.RUB}_${hizbNumber}_$rubNumber"

fun surahProgressId(surahId: Int): String = "${QuranProgressType.SURAH}_$surahId"

fun todayDateKey(): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
