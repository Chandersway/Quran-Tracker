package com.Ameender.qurantracker.ui

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

internal data class IrabFragment(val html: String, val volume: String, val page: String)
internal data class IrabResult(val book: String, val author: String, val fragments: List<IrabFragment>)
internal class IrabRateLimit : Exception()

internal object IrabRepository {
    suspend fun load(surah: Int, ayah: Int, book: Int): IrabResult = withContext(Dispatchers.IO) {
        require(surah in 1..114 && ayah in 1..ALL_SURAHS.first { it.id == surah }.ayahs)
        require(book in listOf(316, 309, 2919, 460))
        val connection = URL("https://api.quranpedia.net/v1/ayah/$surah/$ayah/book/$book").openConnection() as HttpURLConnection
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        try {
            if (connection.responseCode == 429) throw IrabRateLimit()
            check(connection.responseCode == 200)
            val json = JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
            val metadata = json.getJSONObject("book")
            check(metadata.getInt("id") == book)
            val items = json.getJSONArray("content")
            IrabResult(metadata.optString("short_name").takeIf { it.isNotBlank() } ?: metadata.getString("name"),
                metadata.optJSONObject("author")?.optString("ar_name").orEmpty(),
                (0 until items.length()).map { items.getJSONObject(it) }.map {
                    IrabFragment(it.getString("text"), it.optString("part"), it.optString("page"))
                }.filter { it.html.isNotBlank() })
        } finally { connection.disconnect() }
    }
}
