package com.Ameender.qurantracker.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "daily_goal")
data class DailyGoal(
    @PrimaryKey
    val id: Int = 1,              // Altijd 1 record
    val unit: String = "rub",     // "pages", "ayahs", "rub", "hizb"
    val target: Int = 4,          // Doel per dag
    val reminderHour: Int = 8,    // Uur van herinnering
    val reminderMinute: Int = 0   // Minuut van herinnering
)

@Dao
interface DailyGoalDao {

    @Query("SELECT * FROM daily_goal WHERE id = 1")
    fun getGoal(): Flow<DailyGoal?>

    @Query("SELECT * FROM daily_goal WHERE id = 1")
    suspend fun getGoalOnce(): DailyGoal?

    @Upsert
    suspend fun upsertGoal(goal: DailyGoal)
}