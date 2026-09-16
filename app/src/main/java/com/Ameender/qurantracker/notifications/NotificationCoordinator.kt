package com.Ameender.qurantracker.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.*
import com.Ameender.qurantracker.MainActivity
import com.Ameender.qurantracker.data.*
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.time.*
import java.util.concurrent.TimeUnit

/** Single delivery path for daily goals and both planning/agenda entry points. */
object NotificationCoordinator {
    private val deliveryLock = Mutex()
    const val CHANNEL = "quran_notifications_v1"

    fun initialize(context: Context) {
        val work = WorkManager.getInstance(context)
        work.cancelUniqueWork("quran_daily_reminder")
        work.cancelAllWorkByTag("quran_reminder")
        work.enqueueUniquePeriodicWork("notification_reconcile_v1", ExistingPeriodicWorkPolicy.KEEP,
            PeriodicWorkRequestBuilder<NotificationReconcileWorker>(15, TimeUnit.MINUTES).build())
        reconcileSoon(context)
    }

    fun reconcileSoon(context: Context) {
        WorkManager.getInstance(context).enqueueUniqueWork("notification_check_v1", ExistingWorkPolicy.REPLACE,
            OneTimeWorkRequestBuilder<NotificationReconcileWorker>().build())
    }

    suspend fun reconcile(context: Context) = withContext(Dispatchers.IO) {
        val db = QuranDatabase.getDatabase(context)
        val prefs = NotificationPreferencesRepository(context).load()
        if (!prefs.enabled) return@withContext
        val zone = ZoneId.systemDefault()
        val now = Instant.now()
        val today = now.atZone(zone).toLocalDate()
        val goal = db.dailyGoalDao().getGoalOnce()
        if (goal != null) {
            val day = db.goalDayDao().all().find { it.goalId == 1 && it.date == today.toString() }
                ?: GoalDay(1, today.toString(), goal.unit, goal.target)
            val progress = goalProgress(day, db.readingHistoryDao().getAllOnce())
            for (extra in listOf(false, true)) {
                if (extra && prefs.daily && prefs.extraMinute == prefs.dailyMinute) continue
                val minute = if (extra) prefs.extraMinute else prefs.dailyMinute
                val due = today.atTime(minute / 60, minute % 60).atZone(zone).toInstant()
                if (now >= due && prefs.quiet.nextAllowed(now, zone) == now &&
                    NotificationPolicy.dailyAllowed(prefs, extra, progress.target, progress.done)) {
                    val language = language(context)
                    val remaining = progress.remaining
                    val body = notificationText(language, "remaining").format(remaining, notificationUnit(language, day.unit))
                    deliver(context, "daily:$today:$extra", notificationText(language, "daily"), body, "daily_goal")
                }
            }
        }
        db.planningItemDao().getAll().first().filter { !it.isDone && it.reminderHour != null && it.reminderMinute != null }
            .forEach { item -> planning(context, item.id, now) }
    }

    suspend fun planning(context: Context, itemId: Int, now: Instant = Instant.now()) = withContext(Dispatchers.IO) {
        val prefs = NotificationPreferencesRepository(context).load()
        val item = QuranDatabase.getDatabase(context).planningItemDao().getOnce(itemId) ?: return@withContext
        if (!NotificationPolicy.planningAllowed(prefs, true, item.isDone, item.reminderHour != null && item.reminderMinute != null)) return@withContext
        val zone = ZoneId.systemDefault()
        val due = LocalDate.parse(item.date).atTime(item.reminderHour!!, item.reminderMinute!!).atZone(zone).toInstant()
        // Quiet-hour deferral may cross midnight, but expired reminders are never replayed indefinitely.
        val allowed = prefs.quiet.nextAllowed(due, zone)
        if (now < allowed || now > allowed.plus(Duration.ofHours(12)) || prefs.quiet.nextAllowed(now, zone) != now) return@withContext
        deliver(context, "planning:${item.id}:${item.date}:${item.reminderHour}:${item.reminderMinute}",
            notificationText(language(context), "planning"), item.displayName, "agenda", item.id)
    }

    private suspend fun deliver(context: Context, event: String, title: String, body: String, route: String, itemId: Int? = null) = deliveryLock.withLock {
        if (!NotificationPreferencesRepository(context).load().enabled) return@withLock
        val manager = NotificationManagerCompat.from(context)
        if (!manager.areNotificationsEnabled()) return@withLock
        val ledger = context.getSharedPreferences("notification_delivery_v1", Context.MODE_PRIVATE)
        if (ledger.contains(event)) return@withLock
        val channel = NotificationChannel(CHANNEL, notificationText(language(context), "title"), NotificationManager.IMPORTANCE_DEFAULT)
        manager.createNotificationChannel(channel)
        if (manager.getNotificationChannel(CHANNEL)?.importance == NotificationManager.IMPORTANCE_NONE) return@withLock
        val uri = Uri.parse("qurantracker://notification/$route" + (itemId?.let { "/$it" } ?: ""))
        val intent = Intent(context, MainActivity::class.java).setData(uri).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pending = PendingIntent.getActivity(context, event.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(context, CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title).setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(pending).setAutoCancel(true).setOnlyAlertOnce(true)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).build()
        try {
            // Stable tag/id replaces the same notification if the process dies before recording delivery.
            manager.notify(event, 1, notification)
            val edit = ledger.edit().putLong(event, System.currentTimeMillis())
            val cutoff = System.currentTimeMillis() - Duration.ofDays(35).toMillis()
            ledger.all.filterValues { it is Long && it < cutoff }.keys.forEach(edit::remove)
            check(edit.commit())
        } catch (_: SecurityException) { /* Permission may be revoked between check and notify. */ }
    }

    private fun language(context: Context) = context.getSharedPreferences("settings", Context.MODE_PRIVATE).getString("app_language", "nl") ?: "nl"
}

class NotificationReconcileWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result = try {
        NotificationCoordinator.reconcile(applicationContext)
        Result.success()
    } catch (cancel: CancellationException) { throw cancel }
    catch (_: Exception) { if (runAttemptCount < 3) Result.retry() else Result.failure() }
}
