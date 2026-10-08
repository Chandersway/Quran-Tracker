package com.Ameender.qurantracker.ui

import android.content.Context
import org.json.JSONObject

/** Coordinates belong to the original Maknoon Warsh SVG viewBox, before zoom. */
internal data class WarshMaknoonGeometry(
    val width: Float,
    val height: Float,
    val positions: List<HafsAyahPosition>
)

internal object WarshMaknoonPages {
    private var source: JSONObject? = null
    private val pages = mutableMapOf<Int, WarshMaknoonGeometry>()

    @Synchronized
    fun load(context: Context, page: Int): WarshMaknoonGeometry {
        return pages.getOrPut(page) {
            val root = source ?: context.assets.open("warsh_maknoon_positions.json")
                .bufferedReader().use { JSONObject(it.readText()) }.also { source = it }
            val item = root.getJSONObject(page.toString())
            val segments = item.getJSONArray("segments")
            WarshMaknoonGeometry(
                width = item.getDouble("width").toFloat(),
                height = item.getDouble("height").toFloat(),
                positions = List(segments.length()) { index ->
                    val segment = segments.getJSONArray(index)
                    HafsAyahPosition(
                        surahId = segment.getInt(0),
                        ayahNumber = segment.getInt(1),
                        left = segment.getDouble(2).toFloat(),
                        top = segment.getDouble(3).toFloat(),
                        width = segment.getDouble(4).toFloat(),
                        height = segment.getDouble(5).toFloat()
                    )
                }
            )
        }
    }

    fun pagesForSurah(context: Context, surahId: Int): List<Int> =
        (1..604).filter { page -> load(context, page).positions.any { it.surahId == surahId } }

    fun findAyah(context: Context, surahId: Int, ayah: Int, pages: List<Int>): MushafAyahTarget? {
        for (page in pages) {
            val top = load(context, page).positions
                .filter { it.surahId == surahId && ayah in WarshAyahReferences.hafsAyahs(context, surahId, it.ayahNumber) }
                .minOfOrNull { it.top } ?: continue
            return MushafAyahTarget(page, (top * 1.12f - .06f - .14f).coerceAtLeast(0f))
        }
        return null
    }
}
