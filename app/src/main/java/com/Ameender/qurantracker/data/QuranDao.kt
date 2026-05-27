package com.Ameender.qurantracker.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface QuranDao {

    // Haal alles op als live stroom (update UI automatisch)
    @Query("SELECT * FROM quran_progress")
    fun getAllProgress(): Flow<List<QuranProgress>>

    // Haal specifiek type op: "juz", "hizb", "rub", "surah"
    @Query("SELECT * FROM quran_progress WHERE type = :type")
    fun getByType(type: String): Flow<List<QuranProgress>>

    // Haal één item op via id
    @Query("SELECT * FROM quran_progress WHERE id = :id")
    suspend fun getById(id: String): QuranProgress?

    // Opslaan of updaten (Upsert = insert als nieuw, update als al bestaat)
    @Upsert
    suspend fun upsertProgress(progress: QuranProgress)

    // Verwijder alles (reset)
    @Query("DELETE FROM quran_progress")
    suspend fun deleteAll()

    @Query("UPDATE quran_progress SET readCount = readCount + 1, lastUpdated = :time WHERE id = :id")
    suspend fun incrementReadCount(id: String, time: Long = System.currentTimeMillis())

    @Query("UPDATE quran_progress SET readCount = readCount + 1 WHERE id = :id")
    suspend fun incrementReadCount(id: String)
}
