package com.Ameender.qurantracker.ui

import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DecimalStyle
import java.util.Locale

internal fun feedCommentLabel(text: AppStrings, count: Int): String =
    if (count == 0) text.groupFeed.reply else text.t(
        if (count == 1) "groups.feed.comment.one" else "groups.feed.comment.other",
        dailyGoalNumber(count, text.localeCode)
    )

internal fun feedTimestamp(value: String, language: String): String = runCatching {
    val locale = Locale.forLanguageTag(language)
    val formatted = OffsetDateTime.parse(value).atZoneSameInstant(ZoneId.systemDefault()).format(
        DateTimeFormatter.ofPattern("d MMM · HH:mm", locale).withDecimalStyle(DecimalStyle.of(locale))
    )
    // Android and desktop locale providers differ in their default Arabic digit style.
    if (language == "ar") formatted.map {
        if (it in '0'..'9') ('٠'.code + it.code - '0'.code).toChar() else it
    }.joinToString("") else formatted
}.getOrDefault(value.replace("T", " ").substringBefore('.').take(16))
