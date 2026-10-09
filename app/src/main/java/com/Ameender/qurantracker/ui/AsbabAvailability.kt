package com.Ameender.qurantracker.ui

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.GZIPInputStream

internal data class AsbabAvailability(val entries: Map<Int, Map<Int, List<Int>>>) {
    fun ayahs(book: Int, surah: Int): List<Int> = entries[book]?.get(surah).orEmpty()
    fun has(book: Int, surah: Int, ayah: Int) = ayah in ayahs(book, surah)
}

internal object AsbabIndex {
    private val mutex = Mutex()
    private var cached: AsbabAvailability? = null

    // Official compact availability index; never scan every verse through the API.
    suspend fun load(): AsbabAvailability = mutex.withLock {
        cached ?: withContext(Dispatchers.IO) {
            val connection = URL("https://api.quranpedia.net/dumps/asbab.json.gz").openConnection() as HttpURLConnection
            connection.connectTimeout = 15000
            connection.readTimeout = 15000
            try {
                if (connection.responseCode == 429) throw IrabRateLimit()
                check(connection.responseCode == 200)
                val json = GZIPInputStream(connection.inputStream).bufferedReader().use { JSONObject(it.readText()) }
                val data = json.getJSONArray("data")
                val entries = mutableMapOf<Int, MutableMap<Int, MutableSet<Int>>>()
                for (i in 0 until data.length()) {
                    val row = data.getJSONObject(i)
                    val surah = row.getInt("surah")
                    val ayah = row.getInt("ayah")
                    val chapter = ALL_SURAHS.firstOrNull { it.id == surah } ?: continue
                    if (ayah !in 1..chapter.ayahs) continue
                    val books = row.getJSONArray("asbab")
                    for (j in 0 until books.length()) {
                        val book = books.getJSONObject(j).getInt("id")
                        if (book !in listOf(2919, 460)) continue
                        entries.getOrPut(book) { mutableMapOf() }.getOrPut(surah) { mutableSetOf() }.add(ayah)
                    }
                }
                AsbabAvailability(entries.mapValues { (_, chapters) -> chapters.mapValues { it.value.sorted() } })
                    .also { cached = it }
            } finally { connection.disconnect() }
        }
    }
}
