package com.Ameender.qurantracker.ui

import android.content.Context
import org.json.JSONObject

/** Image coordinates use Madani/Warsh numbers; app text, notes and words use Hafs.
 * Keep this conversion at the boundary, in BOTH directions. Some verses merge
 * or split, so neither identity nor a per-surah constant offset is correct.
 */
internal object WarshAyahReferences {
    private var chapters: Map<Int, List<List<Int>>>? = null

    @Synchronized
    fun hafsAyahs(context: Context, surah: Int, warshAyah: Int): List<Int> {
        val data = chapters ?: context.assets.open("warsh_ayah_map.json")
            .bufferedReader().use { reader ->
                val json = JSONObject(reader.readText()).getJSONObject("chapters")
                (1..114).associateWith { id ->
                    val verses = json.getJSONArray(id.toString())
                    List(verses.length()) { index ->
                        val refs = verses.getJSONArray(index)
                        List(refs.length()) { refs.getInt(it) }
                    }
                }
            }.also { chapters = it }
        return requireNotNull(data[surah]?.getOrNull(warshAyah - 1)) {
            "Missing Warsh reference $surah:$warshAyah"
        }
    }
}

internal data class MushafSelectionContent(
    val ayahNumber: Int,
    val text: String,
    val wordInfo: WordByWordAyah?
)

/** Resolve every piece of the selection through the same reference(s). */
internal fun resolveMushafSelection(
    refs: List<Int>,
    textForAyah: (Int) -> String,
    wordsForAyah: (Int) -> WordByWordAyah?
): MushafSelectionContent {
    require(refs.isNotEmpty())
    val wordParts = refs.mapNotNull(wordsForAyah)
    val words = if (wordParts.size != refs.size) null else WordByWordAyah(
        ayah = refs.first(),
        words = wordParts.flatMap { it.words }.mapIndexed { index, word -> word.copy(position = index + 1) },
        e3rab = wordParts.joinToString("\n\n") { it.e3rab }
    )
    return MushafSelectionContent(refs.first(), refs.joinToString("\n") { textForAyah(it) }, words)
}
