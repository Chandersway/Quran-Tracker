package com.Ameender.qurantracker.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import java.io.File
import java.io.FileOutputStream

class QuranDatabaseHelper(private val context: Context) {

    private val DB_NAME = "Quraan.db"

    // Kopieer database van assets naar intern geheugen (eenmalig)
    private fun getDatabasePath(): String {
        val dbFile = File(context.filesDir, DB_NAME)
        if (!dbFile.exists()) {
            context.assets.open(DB_NAME).use { input ->
                FileOutputStream(dbFile).use { output ->
                    input.copyTo(output)
                }
            }
        }
        return dbFile.absolutePath
    }

    fun getDatabase(): SQLiteDatabase {
        return SQLiteDatabase.openDatabase(
            getDatabasePath(),
            null,
            SQLiteDatabase.OPEN_READONLY
        )
    }

    // Haal alle 114 soera's op — gegroepeerd op SURA_num
    fun getAllChapters(): List<QuranChapter> {
        val db = getDatabase()
        val chapters = mutableListOf<QuranChapter>()
        val cursor = db.rawQuery(
            "SELECT SURA_num, SURA, COUNT(AYA_num) as count FROM `ALL` GROUP BY SURA_num ORDER BY SURA_num",
            null
        )
        cursor.use {
            while (it.moveToNext()) {
                chapters.add(
                    QuranChapter(
                        id          = it.getInt(it.getColumnIndexOrThrow("SURA_num")),
                        nameAr      = it.getString(it.getColumnIndexOrThrow("SURA")),
                        namePronEn  = "",
                        type        = "",
                        versesCount = it.getInt(it.getColumnIndexOrThrow("count")),
                        content     = ""  // Niet voorgeladen — laden we per soera
                    )
                )
            }
        }
        db.close()
        return chapters
    }

    // Haal losse ayahs op voor een soera
    fun getAyahsForChapter(chapterId: Int): List<Pair<Int, String>> {
        val db = getDatabase()
        val ayahs = mutableListOf<Pair<Int, String>>()
        val cursor = db.rawQuery(
            "SELECT AYA_num, AYA FROM `ALL` WHERE SURA_num = ? ORDER BY AYA_num",
            arrayOf(chapterId.toString())
        )
        cursor.use {
            while (it.moveToNext()) {
                ayahs.add(
                    Pair(
                        it.getInt(it.getColumnIndexOrThrow("AYA_num")),
                        it.getString(it.getColumnIndexOrThrow("AYA"))
                    )
                )
            }
        }
        db.close()
        return ayahs
    }

    fun getChapterName(chapterId: Int): String {
        val db = getDatabase()
        val cursor = db.rawQuery(
            "SELECT SURA FROM `ALL` WHERE SURA_num = ? LIMIT 1",
            arrayOf(chapterId.toString())
        )
        val name = cursor.use {
            if (it.moveToFirst()) it.getString(it.getColumnIndexOrThrow("SURA")) else "Soera $chapterId"
        }
        db.close()
        return name
    }

    fun getAyahText(chapterId: Int, ayahNumber: Int): String {
        val db = getDatabase()
        val cursor = db.rawQuery(
            "SELECT AYA FROM `ALL` WHERE SURA_num = ? AND AYA_num = ? LIMIT 1",
            arrayOf(chapterId.toString(), ayahNumber.toString())
        )
        val text = cursor.use {
            if (it.moveToFirst()) it.getString(it.getColumnIndexOrThrow("AYA")) else ""
        }
        db.close()
        return text
    }

    fun searchAyahs(query: String, limit: Int = 40): List<QuranSearchResult> {
        val cleanQuery = query.trim()
        if (cleanQuery.length < 2) return emptyList()
        val normalizedQuery = normalizeArabicSearchText(cleanQuery)

        val db = getDatabase()
        val results = mutableListOf<QuranSearchResult>()
        val cursor = db.rawQuery(
            """
            SELECT SURA_num, SURA, AYA_num, AYA
            FROM `ALL`
            ORDER BY SURA_num, AYA_num
            """.trimIndent(),
            null
        )
        cursor.use {
            while (it.moveToNext() && results.size < limit) {
                val ayahText = it.getString(it.getColumnIndexOrThrow("AYA"))
                val normalizedAyah = normalizeArabicSearchText(ayahText)
                val matchesRaw = ayahText.contains(cleanQuery, ignoreCase = true)
                val matchesNormalized = normalizedAyah.contains(normalizedQuery, ignoreCase = true)
                if (!matchesRaw && !matchesNormalized) continue

                results.add(
                    QuranSearchResult(
                        surahId = it.getInt(it.getColumnIndexOrThrow("SURA_num")),
                        surahName = it.getString(it.getColumnIndexOrThrow("SURA")),
                        ayahNumber = it.getInt(it.getColumnIndexOrThrow("AYA_num")),
                        ayahText = ayahText
                    )
                )
            }
        }
        db.close()
        return results
    }

    private fun normalizeArabicSearchText(text: String): String {
        return text
            .replace(Regex("[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]"), "")
            .replace("ـ", "")
            .replace("أ", "ا")
            .replace("إ", "ا")
            .replace("آ", "ا")
            .replace("ٱ", "ا")
            .replace("ى", "ي")
            .replace("ؤ", "و")
            .replace("ئ", "ي")
            .lowercase()
    }
}

// Data class — content is leeg bij lijst, gevuld bij lezer
data class QuranChapter(
    val id: Int,
    val nameAr: String,
    val namePronEn: String,
    val type: String,
    val versesCount: Int,
    val content: String = ""
) {
    // Niet meer nodig — ayahs komen via getAyahsForChapter()
    fun getAyahs(): List<Pair<Int, String>> = emptyList()
}

data class QuranSearchResult(
    val surahId: Int,
    val surahName: String,
    val ayahNumber: Int,
    val ayahText: String
)
