package com.Ameender.qurantracker.ui

/** Zero repeats means continuous; a finite count includes the first pass. */
internal fun nextRepeatStep(index: Int, round: Int, trackCount: Int, rounds: Int): Pair<Int, Int>? {
    require(trackCount > 0 && index in 0 until trackCount && round > 0 && rounds >= 0)
    return when {
        index + 1 < trackCount -> index + 1 to round
        rounds == 0 || round < rounds -> 0 to round + 1
        else -> null
    }
}
