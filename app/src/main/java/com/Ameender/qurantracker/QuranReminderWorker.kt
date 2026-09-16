package com.Ameender.qurantracker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.Ameender.qurantracker.notifications.NotificationCoordinator

/** Compatibility for persisted jobs. All delivery is delegated to the central coordinator. */
class QuranReminderWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        NotificationCoordinator.initialize(applicationContext)
        return Result.success()
    }
}

@Suppress("UNUSED_PARAMETER")
fun scheduleReminder(context: Context, hour: Int, minute: Int) = NotificationCoordinator.initialize(context)

@Suppress("UNUSED_PARAMETER")
fun scheduleDailyReminder(context: Context, hour: Int, minute: Int) = NotificationCoordinator.initialize(context)
