package com.Ameender.qurantracker.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "reading_history")
data class ReadingHistory(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,

    val surahId: Int,
    val surahName: String,      // Rijke naam incl. begin ayah voor hizb
    val type: String,           // "surah", "juz", "hizb"
    val action: String,         // "read", "memorized"
    val extraInfo: String = "", // Begin ayah tekst voor hizb

    val timestamp: Long = System.currentTimeMillis(),
    val dateKey: String = ""
)

@Dao
interface ReadingHistoryDao {

    @Insert
    suspend fun insert(history: ReadingHistory)

    @Query("SELECT * FROM reading_history ORDER BY timestamp DESC")
    fun getAll(): Flow<List<ReadingHistory>>

    @Query("SELECT * FROM reading_history ORDER BY timestamp DESC LIMIT 50")
    fun getRecent(): Flow<List<ReadingHistory>>

    // Meest gelezen soera's
    @Query("""
        SELECT surahId, surahName, COUNT(*) as count
        FROM reading_history
        WHERE action = 'read' AND type = 'surah'
        GROUP BY surahId
        ORDER BY count DESC
        LIMIT 8
    """)
    fun getMostRead(): Flow<List<SurahReadCount>>

    // Meest gelezen hizb — met surahName als label (bevat begin ayah)
    @Query("""
        SELECT surahId, surahName, extraInfo, COUNT(*) as count
        FROM reading_history
        WHERE action = 'read' AND type = 'hizb'
        GROUP BY surahId
        ORDER BY count DESC
        LIMIT 8
    """)
    fun getMostReadHizb(): Flow<List<HizbReadCount>>

    // Totaal per type voor taartgrafiek
    @Query("""
        SELECT type, COUNT(*) as count
        FROM reading_history
        WHERE action = 'read'
        GROUP BY type
        ORDER BY count DESC
    """)
    fun getAllTypeCounts(): Flow<List<TypeCount>>

    // Activiteit per dag laatste 7 dagen
    @Query("""
        SELECT dateKey, COUNT(*) as count
        FROM reading_history
        WHERE timestamp > :since
        GROUP BY dateKey
        ORDER BY dateKey ASC
    """)
    fun getActivityPerDay(since: Long): Flow<List<DayActivity>>

    @Query("DELETE FROM reading_history")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM reading_history WHERE action = 'read'")
    fun getTotalReadCount(): Flow<Int>
}

data class SurahReadCount(
    val surahId: Int,
    val surahName: String,
    val count: Int
)

data class HizbReadCount(
    val surahId: Int,       // hizb nummer
    val surahName: String,  // rijke naam
    val extraInfo: String,  // begin ayah tekst
    val count: Int
)

data class TypeCount(
    val type: String,
    val count: Int
)

data class SurahLastRead(
    val surahId: Int,
    val surahName: String,
    val lastRead: Long
)

data class DayActivity(
    val dateKey: String,
    val count: Int
)