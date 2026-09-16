package com.Ameender.qurantracker.data

import android.content.Context
import org.json.JSONArray

data class TranslationSource(
    val id: String,
    val name: String,
    val subtitle: String,
    val assetFile: String
)

data class TranslationAyah(
    val surahId: Int,
    val ayahNumber: Int,
    val text: String
)

class TranslationRepository(private val context: Context) {

    fun getTranslation(source: TranslationSource, surahId: Int, ayahNumber: Int): String {
        return getTranslations(source.assetFile)[surahId to ayahNumber].orEmpty()
    }

    fun getTranslations(
        source: TranslationSource,
        surahId: Int,
        ayahFrom: Int,
        ayahTo: Int
    ): List<TranslationAyah> {
        val translations = getTranslations(source.assetFile)
        return (ayahFrom..ayahTo).mapNotNull { ayah ->
            translations[surahId to ayah]?.let { text ->
                TranslationAyah(surahId = surahId, ayahNumber = ayah, text = text)
            }
        }
    }

    private fun getTranslations(assetFile: String): Map<Pair<Int, Int>, String> {
        return cache.getOrPut(assetFile) {
            val json = context.assets.open("translations/$assetFile")
                .bufferedReader(Charsets.UTF_8)
                .use { it.readText() }
            val array = JSONArray(json)
            buildMap {
                for (index in 0 until array.length()) {
                    val item = array.getJSONObject(index)
                    put(
                        item.getInt("surah") to item.getInt("ayah"),
                        item.getString("text")
                    )
                }
            }
        }
    }

    companion object {
        val sources = listOf(
            TranslationSource(
                id = "en.sahih",
                name = "Saheeh International",
                subtitle = "English",
                assetFile = "en_sahih.json"
            ),
            TranslationSource(
                id = "nl.siregar",
                name = "Sofian S. Siregar",
                subtitle = "Nederlands",
                assetFile = "nl_siregar.json"
            )
        )

        private val cache = mutableMapOf<String, Map<Pair<Int, Int>, String>>()
    }
}
