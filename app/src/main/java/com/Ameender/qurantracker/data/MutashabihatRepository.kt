package com.Ameender.qurantracker.data

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class QuranAyahLocation(
    val absoluteAyah: Int,
    val surahId: Int,
    val ayahNumber: Int
)

data class MutashabihatSequence(val ayahs: List<QuranAyahLocation>) {
    val first: QuranAyahLocation get() = ayahs.first()
}

data class MutashabihatGroup(
    val juz: Int,
    val source: MutashabihatSequence,
    val matches: List<MutashabihatSequence>,
    val contextAyahs: Int
)

class MutashabihatRepository(private val context: Context) {
    fun loadGroups(): List<MutashabihatGroup> {
        val json = context.assets.open(ASSET_NAME).bufferedReader().use { it.readText() }
        val root = JSONObject(json)
        return (1..30).flatMap { juz ->
            val entries = root.optJSONArray(juz.toString()) ?: JSONArray()
            buildList {
                for (index in 0 until entries.length()) {
                    val entry = entries.getJSONObject(index)
                    val source = entry.getJSONObject("src").get("ayah").toAbsoluteAyahs()
                        .toSequenceOrNull() ?: continue
                    val matchesJson = entry.getJSONArray("muts")
                    val matches = buildList {
                        for (matchIndex in 0 until matchesJson.length()) {
                            matchesJson.getJSONObject(matchIndex).get("ayah")
                                .toAbsoluteAyahs()
                                .toSequenceOrNull()
                                ?.let(::add)
                        }
                    }
                    if (matches.isNotEmpty()) {
                        add(
                            MutashabihatGroup(
                                juz = juz,
                                source = source,
                                matches = matches,
                                contextAyahs = entry.optInt("ctx", 0)
                            )
                        )
                    }
                }
            }
        }
    }

    private fun Any.toAbsoluteAyahs(): List<Int> = when (this) {
        is Number -> listOf(toInt())
        is JSONArray -> buildList {
            for (index in 0 until length()) add(getInt(index))
        }
        else -> emptyList()
    }

    private fun List<Int>.toSequenceOrNull(): MutashabihatSequence? {
        val locations = mapNotNull(::quranLocationForAbsoluteAyah)
        return locations.takeIf { it.size == size && it.isNotEmpty() }?.let(::MutashabihatSequence)
    }

    companion object {
        private const val ASSET_NAME = "mutashabiha_data.json"
        const val SOURCE_URL = "https://github.com/Waqar144/Quran_Mutashabihat_Data"
    }
}

fun quranLocationForAbsoluteAyah(absoluteAyah: Int): QuranAyahLocation? {
    if (absoluteAyah !in 1..6236) return null
    var remaining = absoluteAyah
    for (surahId in 1..114) {
        val count = ReadingMetrics.surahAyahCount(surahId)
        if (remaining <= count) {
            return QuranAyahLocation(absoluteAyah, surahId, remaining)
        }
        remaining -= count
    }
    return null
}
