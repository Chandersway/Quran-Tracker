package com.Ameender.qurantracker.data

/** Live member identity takes precedence over a historical post/comment snapshot. */
internal fun resolveGroupAuthorName(currentName: String?, historicalName: String?): String =
    currentName?.trim()?.takeIf(String::isNotEmpty)
        ?: historicalName?.trim()?.takeIf(String::isNotEmpty)
        ?: "Lid"
