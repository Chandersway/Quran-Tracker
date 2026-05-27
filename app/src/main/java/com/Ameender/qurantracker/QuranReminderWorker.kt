package com.Ameender.qurantracker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.work.*
import com.Ameender.qurantracker.data.QuranDatabase
import kotlinx.coroutines.flow.first
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

class QuranReminderWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val db          = QuranDatabase.getDatabase(context)
        val goal        = db.dailyGoalDao().getGoalOnce() ?: return Result.success()
        val history     = db.readingHistoryDao().getRecent().first()

        // Bereken wat er vandaag gelezen is
        val todayKey    = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val todayItems  = history.filter { it.dateKey == todayKey && it.action == "read" }

        val todayCount  = when (goal.unit) {
            "hizb"  -> todayItems.count { it.type == "hizb" } / 4  // 4 rub = 1 hizb
            "rub"   -> todayItems.count { it.type == "hizb" }
            "pages" -> todayItems.count { it.type == "surah" } * 2  // schatting
            "ayahs" -> todayItems.count { it.type == "surah" } * 10
            else    -> todayItems.size
        }

        val unitLabel = when (goal.unit) {
            "hizb"  -> "hizb"
            "rub"   -> "rub"
            "pages" -> "pagina's"
            "ayahs" -> "ayahs"
            else    -> ""
        }

        val goalReached = todayCount >= goal.target

        val title = if (goalReached)
            "MashaAllah! 🌙 Doel gehaald!"
        else
            "📖 Vergeet niet te lezen vandaag"

        val message = if (goalReached)
            "Je hebt je doel van ${goal.target} $unitLabel vandaag gehaald. Barakallah feek!"
        else
            "Je hebt vandaag $todayCount/${goal.target} $unitLabel gelezen. Nog even doorzetten!"

        showNotification(title, message)
        return Result.success()
    }

    private fun showNotification(title: String, message: String) {
        val channelId = "quran_reminder"
        val manager   = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val channel = NotificationChannel(
            channelId,
            "Quran Herinnering",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Dagelijkse herinnering om Quran te lezen"
        }
        manager.createNotificationChannel(channel)

        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .build()

        manager.notify(1001, notification)
    }
}

// Helper om de WorkManager te plannen
fun scheduleReminder(context: Context, hour: Int, minute: Int) {
    val now      = Calendar.getInstance()
    val target   = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
        set(Calendar.SECOND, 0)
    }

    // Als tijd al voorbij is vandaag, plan voor morgen
    if (target.before(now)) {
        target.add(Calendar.DAY_OF_YEAR, 1)
    }

    val delay = target.timeInMillis - now.timeInMillis

    val request = OneTimeWorkRequestBuilder<QuranReminderWorker>()
        .setInitialDelay(delay, TimeUnit.MILLISECONDS)
        .addTag("quran_reminder")
        .build()

    WorkManager.getInstance(context).apply {
        cancelAllWorkByTag("quran_reminder")
        enqueue(request)
    }
}

// Herplan elke dag opnieuw
fun scheduleDailyReminder(context: Context, hour: Int, minute: Int) {
    val request = PeriodicWorkRequestBuilder<QuranReminderWorker>(1, TimeUnit.DAYS)
        .setInitialDelay(calculateInitialDelay(hour, minute), TimeUnit.MILLISECONDS)
        .addTag("quran_daily_reminder")
        .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "quran_daily_reminder",
        ExistingPeriodicWorkPolicy.UPDATE,
        request
    )
}

private fun calculateInitialDelay(hour: Int, minute: Int): Long {
    val now    = Calendar.getInstance()
    val target = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
        set(Calendar.SECOND, 0)
    }
    if (target.before(now)) target.add(Calendar.DAY_OF_YEAR, 1)
    return target.timeInMillis - now.timeInMillis
}
