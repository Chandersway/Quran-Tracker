package com.Ameender.qurantracker.ui

internal fun dailyGoalNumber(value: Int, language: String): String =
    if (language == "ar") value.toString().map { digit ->
        if (digit in '0'..'9') ('٠'.code + digit.code - '0'.code).toChar() else digit
    }.joinToString("") else value.toString()

internal fun dailyGoalCountLabel(count: Int, target: Int, language: String): String {
    val separator = when (language) { "ar" -> "من"; "en" -> "of"; "fr" -> "sur"; else -> "van" }
    return "${dailyGoalNumber(count, language)} $separator ${dailyGoalNumber(target, language)}"
}
