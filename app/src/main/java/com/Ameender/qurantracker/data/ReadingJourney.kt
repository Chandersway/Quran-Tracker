package com.Ameender.qurantracker.data

import androidx.room.Dao
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "reading_journey")
data class ReadingJourney(
    @PrimaryKey
    val id: Int = 1,
    val enabled: Boolean = false,
    val type: String = "quran",
    val totalDays: Int = 30,
    val startDate: String = "",
    val autoDailyGoal: Boolean = true,
    val updatedAt: Long = System.currentTimeMillis()
)

@Dao
interface ReadingJourneyDao {
    @Query("SELECT * FROM reading_journey WHERE id = 1")
    fun getJourney(): Flow<ReadingJourney?>

    @Query("SELECT * FROM reading_journey WHERE id = 1")
    suspend fun getJourneyOnce(): ReadingJourney?

    @Upsert
    suspend fun upsertJourney(journey: ReadingJourney)
}
