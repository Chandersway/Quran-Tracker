package com.Ameender.qurantracker.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "planning_items")
data class PlanningItem(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,

    val date: String,           // "2025-05-23"
    val type: String,           // "rub", "hizb", "juz", "surah"
    val referenceId: Int,       // hizb nr, juz nr, surah id
    val subId: Int = 0,         // rub kwart (1-4), anders 0

    val displayName: String,    // "Hizb 3 — ¼"
    val arabicText: String = "", // begin ayah tekst

    val isDone: Boolean = false,
    val historyLogged: Boolean = false,
    val reminderHour: Int? = null,
    val reminderMinute: Int? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Dao
interface PlanningItemDao {

    @Query("SELECT * FROM planning_items ORDER BY date ASC, createdAt ASC")
    fun getAll(): Flow<List<PlanningItem>>

    @Query("SELECT * FROM planning_items WHERE date = :date ORDER BY createdAt ASC")
    fun getForDate(date: String): Flow<List<PlanningItem>>

    @Query("SELECT * FROM planning_items WHERE date >= :from ORDER BY date ASC, createdAt ASC")
    fun getFromDate(from: String): Flow<List<PlanningItem>>

    @Query("SELECT DISTINCT date FROM planning_items WHERE date >= :from ORDER BY date ASC")
    fun getDatesWithItems(from: String): Flow<List<String>>

    @Insert
    suspend fun insert(item: PlanningItem): Long

    @Query("UPDATE planning_items SET isDone = :done WHERE id = :id")
    suspend fun setDone(id: Int, done: Boolean)

    @Query("UPDATE planning_items SET isDone = :done, historyLogged = :historyLogged WHERE id = :id")
    suspend fun setDoneAndHistoryLogged(id: Int, done: Boolean, historyLogged: Boolean)

    @Query("UPDATE planning_items SET reminderHour = :hour, reminderMinute = :minute WHERE id = :id")
    suspend fun setReminder(id: Int, hour: Int?, minute: Int?)

    @Delete
    suspend fun delete(item: PlanningItem)

    @Query("DELETE FROM planning_items WHERE id = :id")
    suspend fun deleteById(id: Int)

    @Query("""
        SELECT COUNT(*) FROM planning_items
        WHERE date = :date AND type = :type AND referenceId = :referenceId AND subId = :subId
    """)
    suspend fun countDuplicate(date: String, type: String, referenceId: Int, subId: Int): Int
}
