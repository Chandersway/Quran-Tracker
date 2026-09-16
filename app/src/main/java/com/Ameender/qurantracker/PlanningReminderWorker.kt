package com.Ameender.qurantracker

import android.content.Context
import androidx.work.*
import com.Ameender.qurantracker.notifications.NotificationCoordinator
import kotlinx.coroutines.CancellationException
import java.time.*
import java.util.concurrent.TimeUnit

class PlanningReminderWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result = try {
        NotificationCoordinator.planning(applicationContext, inputData.getInt(KEY_ITEM_ID, 0))
        Result.success()
    } catch (cancel: CancellationException) { throw cancel }
    catch (_: Exception) { if (runAttemptCount < 3) Result.retry() else Result.failure() }

    companion object { const val KEY_ITEM_ID = "item_id" }
}

@Suppress("UNUSED_PARAMETER")
fun schedulePlanningReminder(context: Context, itemId: Int, date: String, hour: Int, minute: Int, displayName: String, arabicText: String) {
    val target = LocalDate.parse(date).atTime(hour, minute).atZone(ZoneId.systemDefault()).toInstant()
    val delay = Duration.between(Instant.now(), target).toMillis().coerceAtLeast(0)
    WorkManager.getInstance(context).enqueueUniqueWork("planning_reminder_$itemId", ExistingWorkPolicy.REPLACE,
        OneTimeWorkRequestBuilder<PlanningReminderWorker>().setInputData(workDataOf(PlanningReminderWorker.KEY_ITEM_ID to itemId))
            .setInitialDelay(delay, TimeUnit.MILLISECONDS).build())
}

fun cancelPlanningReminder(context: Context, itemId: Int) {
    WorkManager.getInstance(context).cancelUniqueWork("planning_reminder_$itemId")
}
