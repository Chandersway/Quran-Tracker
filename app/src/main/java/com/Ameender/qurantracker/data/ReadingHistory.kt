package com.Ameender.qurantracker.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "reading_history", indices = [Index(value = ["sourceKey"], unique = true), Index(value = ["ownerId", "timestamp"])])
data class ReadingHistory(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,

    val surahId: Int,
    val surahName: String,      // Rijke naam incl. begin ayah voor hizb
    val type: String,           // "surah", "juz", "hizb"
    val action: String,         // "read", "memorized"
    val extraInfo: String = "", // Begin ayah tekst voor hizb

    val timestamp: Long = System.currentTimeMillis(),
    val dateKey: String = "",
    @ColumnInfo(defaultValue = "1") val amount: Int = 1,
    val sourceKey: String? = null,
    @ColumnInfo(defaultValue = "''") val contentType: String = "",
    @ColumnInfo(defaultValue = "''") val ownerId: String = ""
)

@Dao
interface ReadingHistoryDao {
    @Query("SELECT surahId AS hizbNumber, COUNT(*) AS count FROM reading_history WHERE ownerId = :owner AND timestamp >= :start AND timestamp < :endExclusive AND action = 'read' AND type = 'hizb' AND surahId BETWEEN 1 AND 60 GROUP BY surahId")
    fun hizbCounts(owner: String, start: Long, endExclusive: Long): Flow<List<HizbReadingCount>>

    @Query("SELECT EXISTS(SELECT 1 FROM checkin_requests WHERE requestId = :key)")
    suspend fun hasSource(key: String): Boolean
    @Insert
    suspend fun recordRequest(request: CheckInRequest)
    @Query("DELETE FROM checkin_requests")
    suspend fun clearRequests()
    @Query("SELECT * FROM reading_history ORDER BY timestamp DESC")
    suspend fun getAllOnce(): List<ReadingHistory>

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertOnce(history: ReadingHistory): Long
    @Query("DELETE FROM reading_history WHERE sourceKey = :source")
    suspend fun deleteSource(source: String): Int

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
        WHERE action = 'read' AND (type = 'surah' OR contentType = 'surah')
        GROUP BY surahId
        ORDER BY count DESC
        LIMIT 8
    """)
    fun getMostRead(): Flow<List<SurahReadCount>>

    // Meest gelezen hizb — met surahName als label (bevat begin ayah)
    @Query("""
        SELECT surahId, surahName, extraInfo, COUNT(*) as count
        FROM reading_history
        WHERE action = 'read' AND (type IN ('hizb', 'rub') OR contentType = 'hizb')
        GROUP BY surahId
        ORDER BY count DESC
        LIMIT 8
    """)
    fun getMostReadHizb(): Flow<List<HizbReadCount>>

    // Totaal per type voor taartgrafiek
    @Query("""
        SELECT CASE WHEN contentType != '' THEN contentType ELSE type END AS type, COUNT(*) as count
        FROM reading_history
        WHERE action = 'read'
        GROUP BY CASE WHEN contentType != '' THEN contentType ELSE type END
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

    @Query("""
        DELETE FROM reading_history
        WHERE action = 'read'
          AND type IN ('hizb', 'rub')
          AND surahId = :hizbNumber
          AND dateKey = :dateKey
          AND (
              surahName LIKE '%' || :markerA || '%'
              OR surahName LIKE '%' || :markerB || '%'
              OR surahName LIKE '%' || :markerC || '%'
          )
    """)
    suspend fun deleteRubReadForDay(
        hizbNumber: Int,
        dateKey: String,
        markerA: String,
        markerB: String,
        markerC: String
    )

    @Query("SELECT COUNT(*) FROM reading_history WHERE action = 'read'")
    fun getTotalReadCount(): Flow<Int>
}

data class HizbReadingCount(val hizbNumber: Int, val count: Int)

@Entity(tableName = "checkin_requests")
data class CheckInRequest(@PrimaryKey val requestId: String)

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
