package com.Ameender.qurantracker.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

/** A target snapshot, never a second copy of completed activity. */
@Entity(tableName = "goal_days", primaryKeys = ["goalId", "date"])
data class GoalDay(
    val goalId: Int,
    val date: String,
    val unit: String,
    val target: Int,
    val extra: Int = 0,
    val resolution: String = ""
)

@Dao
interface GoalDayDao {
    @Query("SELECT * FROM goal_days ORDER BY date, goalId")
    fun observe(): Flow<List<GoalDay>>
    @Query("SELECT * FROM goal_days ORDER BY date, goalId")
    suspend fun all(): List<GoalDay>
    @Upsert suspend fun save(day: GoalDay)
}

fun goalAction(id: Int) = when (id) { 2 -> "memorized"; 3 -> "review"; else -> "read" }

data class GoalDayProgress(val day: GoalDay, val done: Int) {
    val target get() = day.target + day.extra
    val remaining get() = (target - done).coerceAtLeast(0)
    val fraction get() = if (target > 0) (done.toFloat() / target).coerceIn(0f, 1f) else 0f
}

data class GoalSessionContent(
    val type: String,
    val referenceId: Int,
    val subId: Int = 0,
    val displayName: String
)

fun goalProgress(day: GoalDay, history: List<ReadingHistory>): GoalDayProgress {
    val entries = history.filter { it.dateKey == day.date && it.action == goalAction(day.goalId) }
    val done = if (day.unit == "minutes") entries.filter { it.type == "minutes" }.sumOf { it.amount }
        else kotlin.math.floor(entries.sumOf { historyQuranFraction(it) } / unitQuranFraction(day.unit) + 0.000001).toInt()
    return GoalDayProgress(day, done)
}
