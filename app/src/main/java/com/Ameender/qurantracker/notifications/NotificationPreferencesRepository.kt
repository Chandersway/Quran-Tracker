package com.Ameender.qurantracker.notifications

import android.content.Context
import androidx.room.withTransaction
import com.Ameender.qurantracker.data.QuranDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Local reminder preferences. A failed write never changes the published UI state. */
class NotificationPreferencesRepository(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("notification_preferences_v1", Context.MODE_PRIVATE)
    private val database = QuranDatabase.getDatabase(context.applicationContext)

    suspend fun load(): NotificationPreferences = withContext(Dispatchers.IO) {
        val goal = database.dailyGoalDao().getGoalOnce()
        NotificationPreferences(
        enabled = prefs.getBoolean("enabled", true),
        daily = prefs.getBoolean("daily", true),
        // The existing goal editor and this screen use the same persisted reminder time.
        dailyMinute = goal?.let { it.reminderHour * 60 + it.reminderMinute } ?: prefs.getInt("dailyMinute", 480),
        extra = prefs.getBoolean("extra", false),
        extraMinute = prefs.getInt("extraMinute", 1260),
        planning = prefs.getBoolean("planning", true),
        quiet = QuietHours(prefs.getBoolean("quiet", false), prefs.getInt("quietStart", 1320), prefs.getInt("quietEnd", 420))
        )
    }

    suspend fun save(value: NotificationPreferences) = withContext(Dispatchers.IO) {
      database.withTransaction {
        database.dailyGoalDao().getGoalOnce()?.let { goal ->
            database.dailyGoalDao().upsertGoal(goal.copy(reminderHour = value.dailyMinute / 60, reminderMinute = value.dailyMinute % 60))
        }
        check(prefs.edit().putBoolean("enabled", value.enabled).putBoolean("daily", value.daily)
            .putInt("dailyMinute", value.dailyMinute).putBoolean("extra", value.extra)
            .putInt("extraMinute", value.extraMinute).putBoolean("planning", value.planning)
            .putBoolean("quiet", value.quiet.enabled).putInt("quietStart", value.quiet.startMinute)
            .putInt("quietEnd", value.quiet.endMinute).commit()) { "PREFERENCE_SAVE_FAILED" }
      }
    }
}
