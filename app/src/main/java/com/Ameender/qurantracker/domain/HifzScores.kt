package com.Ameender.qurantracker.domain

/** A partial assessment must not be presented as the score of a whole Juz. */
fun derivedJuzHifzScore(firstHizb: Int?, secondHizb: Int?): Int? {
    // Zero is the app-wide value for "not assessed" and is never a real score.
    if (firstHizb == null || secondHizb == null || firstHizb <= 0 || secondHizb <= 0) return null
    return (firstHizb.coerceIn(0, 100) + secondHizb.coerceIn(0, 100) + 1) / 2
}

const val HIFZ_SCORE_CONSISTENCY_THRESHOLD = 20

/** Whether a direct Juz assessment needs confirmation against its two Hizb scores. */
fun shouldConfirmJuzHifzScore(
    juzScore: Int,
    firstHizb: Int?,
    secondHizb: Int?,
    threshold: Int = HIFZ_SCORE_CONSISTENCY_THRESHOLD
): Boolean {
    if (juzScore <= 0) return false
    val validFirst = firstHizb?.takeIf { it > 0 }
    val validSecond = secondHizb?.takeIf { it > 0 }
    if (validFirst == null || validSecond == null) return false
    return kotlin.math.abs(juzScore - validFirst) >= threshold ||
        kotlin.math.abs(juzScore - validSecond) >= threshold
}
