package com.Ameender.qurantracker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.concurrent.TimeUnit

class PlanningReminderWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val itemId = inputData.getInt(KEY_ITEM_ID, 0)
        val title = inputData.getString(KEY_TITLE).orEmpty().ifBlank { "Quran lezen" }
        val message = inputData.getString(KEY_MESSAGE).orEmpty().ifBlank { "Tijd om je planning te lezen." }

        showPlanningNotification(itemId, title, message)
        return Result.success()
    }

    private fun showPlanningNotification(itemId: Int, title: String, message: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Planning herinneringen",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Herinneringen voor agenda-items"
        }
        manager.createNotificationChannel(channel)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            itemId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        manager.notify(PLANNING_NOTIFICATION_BASE_ID + itemId, notification)
    }

    companion object {
        const val CHANNEL_ID = "planning_reminders"
        const val KEY_ITEM_ID = "item_id"
        const val KEY_TITLE = "title"
        const val KEY_MESSAGE = "message"
        const val PLANNING_NOTIFICATION_BASE_ID = 3000
    }
}

fun schedulePlanningReminder(
    context: Context,
    itemId: Int,
    date: String,
    hour: Int,
    minute: Int,
    displayName: String,
    arabicText: String
) {
    val delay = calculatePlanningReminderDelay(date, hour, minute)
    val message = if (arabicText.isBlank()) {
        "Tijd om te lezen: $displayName"
    } else {
        "$displayName\n$arabicText"
    }
    val input = Data.Builder()
        .putInt(PlanningReminderWorker.KEY_ITEM_ID, itemId)
        .putString(PlanningReminderWorker.KEY_TITLE, "Tijd om Quran te lezen")
        .putString(PlanningReminderWorker.KEY_MESSAGE, message)
        .build()

    val request = OneTimeWorkRequestBuilder<PlanningReminderWorker>()
        .setInputData(input)
        .setInitialDelay(delay, TimeUnit.MILLISECONDS)
        .addTag(planningReminderTag(itemId))
        .build()

    WorkManager.getInstance(context).enqueueUniqueWork(
        planningReminderName(itemId),
        ExistingWorkPolicy.REPLACE,
        request
    )
}

fun cancelPlanningReminder(context: Context, itemId: Int) {
    WorkManager.getInstance(context).cancelUniqueWork(planningReminderName(itemId))
}

private fun calculatePlanningReminderDelay(date: String, hour: Int, minute: Int): Long {
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val targetDate = runCatching { sdf.parse(date) }.getOrNull()
    val target = Calendar.getInstance().apply {
        if (targetDate != null) time = targetDate
        set(Calendar.HOUR_OF_DAY, hour.coerceIn(0, 23))
        set(Calendar.MINUTE, minute.coerceIn(0, 59))
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }
    val delay = target.timeInMillis - System.currentTimeMillis()
    return delay.coerceAtLeast(1_000L)
}

private fun planningReminderName(itemId: Int): String = "planning_reminder_$itemId"

private fun planningReminderTag(itemId: Int): String = "planning_reminder_tag_$itemId"
