package com.Ameender.qurantracker.ui

import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

internal data class RepeatTiming(val ayah: Int, val start: Int, val end: Int)

internal fun validateRepeatTimings(rows: List<RepeatTiming>, expected: Int): List<RepeatTiming> {
    require(rows.size == expected && rows.map { it.ayah } == (1..expected).toList())
    require(rows.all { it.start >= 0 && it.end > it.start })
    require(rows.zipWithNext().all { (a, b) -> b.start >= a.end })
    return rows
}

/** Called on IO. Reject incomplete/differently numbered data rather than playing the wrong ayah. */
internal fun loadRepeatTimings(reciter: RepeatReciter, surah: Int, expected: Int): List<RepeatTiming> {
    val connection = URL("https://www.mp3quran.net/api/v3/ayat_timing?surah=$surah&read=${requireNotNull(reciter.timingReadId)}")
        .openConnection() as HttpURLConnection
    connection.connectTimeout = 15000
    connection.readTimeout = 15000
    return try {
        require(connection.responseCode == 200)
        val json = JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
        val rows = (0 until json.length()).map { json.getJSONObject(it) }
            .filter { it.getInt("ayah") > 0 }
            .map { RepeatTiming(it.getInt("ayah"), it.getInt("start_time"), it.getInt("end_time")) }
        validateRepeatTimings(rows, expected)
    } finally { connection.disconnect() }
}

internal fun RepeatReciter.surahAudioUrl(surah: Int): String =
    directory + String.format(Locale.ROOT, "%03d.mp3", surah)
