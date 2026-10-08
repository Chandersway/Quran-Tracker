package com.Ameender.qurantracker.ui

import android.content.Context

internal fun validRepeatPageRange(first: String, last: String): Boolean {
    val start = first.toIntOrNull() ?: return false
    val end = last.toIntOrNull() ?: return false
    return start in 1..604 && end in start..604
}

/** Only used for the reader's supported 604-page geometry, never arbitrary PDFs. */
internal fun loadRepeatPageReferences(context: Context, pages: IntRange, warsh: Boolean): List<Pair<Int, Int>> {
    require(!pages.isEmpty() && pages.first >= 1 && pages.last <= 604)
    return pages.flatMap { page ->
        val positions = if (warsh) WarshMaknoonPages.load(context, page).positions
            else loadHafsMadinaPagePositions(context, page)
        require(positions.isNotEmpty()) { "Missing page geometry: $page" }
        positions.map { it.surahId to it.ayahNumber }
    }.distinct().sortedWith(compareBy({ it.first }, { it.second }))
}
