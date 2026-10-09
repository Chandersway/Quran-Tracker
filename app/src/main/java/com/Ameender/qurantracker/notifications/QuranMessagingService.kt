package com.Ameender.qurantracker.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.Ameender.qurantracker.MainActivity
import com.Ameender.qurantracker.R
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.net.Uri
import androidx.work.*
import com.Ameender.qurantracker.data.SupabaseService
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.sync.withLock
import java.util.UUID

/** Data-only group pushes are account-checked before any notification is displayed. */
class QuranMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) = GroupPushRegistration.tokenChanged(this, token)

    override fun onMessageReceived(message: RemoteMessage) {
        if (message.data["kind"] == "group_reply") {
            android.util.Log.i("GroupPush", "Group push received")
            val event = message.data["event_id"] ?: return
            val recipient = message.data["recipient"] ?: return
            if (!validPushUuid(event) || !validPushUuid(recipient)) return
            WorkManager.getInstance(this).enqueueUniqueWork("group_push_$event", ExistingWorkPolicy.KEEP,
                OneTimeWorkRequestBuilder<GroupPushDisplayWorker>()
                    .setInputData(workDataOf("event" to event, "recipient" to recipient, "received" to System.currentTimeMillis()))
                    .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST).build())
            return
        }
        // Console test notifications are supported in foreground as well as background.
        // Do not interpret arbitrary data as a group invitation or navigation target.
        val notification = message.notification ?: return
        createChannel(this)
        val manager = NotificationManagerCompat.from(this)
        if (!manager.areNotificationsEnabled()) return
        val intent = Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pending = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val body = notification.body.orEmpty()
        val builder = NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(notification.title ?: getString(R.string.app_name))
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setContentIntent(pending)
            .setAutoCancel(true)
        try {
            manager.notify(message.messageId ?: "firebase", 1, builder.build())
        } catch (_: SecurityException) {
            // Permission may have been revoked between the check and delivery.
        }
    }

    companion object {
        const val CHANNEL = "firebase_messages_v1"
        fun initialize(context: Context) {
            GroupPushGate.initialize(context)
            createChannel(context)
            GroupPushRegistration.initialize(context.applicationContext)
        }
        internal fun createChannel(context: Context) {
            val language = context.getSharedPreferences("settings", Context.MODE_PRIVATE).getString("app_language", "nl") ?: "nl"
            val channel = NotificationChannel(CHANNEL, notificationText(language, "title"), NotificationManager.IMPORTANCE_DEFAULT)
            channel.lockscreenVisibility = NotificationCompat.VISIBILITY_PRIVATE
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}

internal fun validPushUuid(value: String): Boolean =
    Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$").matches(value)

class GroupPushDisplayWorker(c: Context, params: WorkerParameters) : CoroutineWorker(c, params) {
    override suspend fun doWork(): Result {
        val c = applicationContext
        val event = inputData.getString("event") ?: return Result.success()
        val recipient = inputData.getString("recipient") ?: return Result.success()
        if (System.currentTimeMillis() - inputData.getLong("received", 0) > 24 * 60 * 60 * 1000L) return Result.success()
        try {
            if (SupabaseService.pushAccountId() != recipient) return Result.success()
            val local = NotificationPreferencesRepository(c).load()
            if (!NotificationManagerCompat.from(c).areNotificationsEnabled()) return Result.success()
            val now = java.time.Instant.now()
            if (local.quiet.nextAllowed(now, java.time.ZoneId.systemDefault()) > now) return Result.retry()
            val target = SupabaseService.groupPushTarget(event) ?: return Result.success()
            return GroupPushGate.mutex.withLock {
            val global = SupabaseService.loadGroupPushPreferences()
            val group = SupabaseService.loadGroupNotificationPreferences(target.groupCode)
            if (!global.enabled || !global.reaction || !group.pushEnabled || group.level in listOf("muted", "mentions")) return Result.success()
            if (group.mutedUntil?.let { runCatching { java.time.OffsetDateTime.parse(it).toInstant() > now }.getOrDefault(false) } == true) return Result.success()
            // Recheck identity after requests to avoid displaying another account's notification.
            if (SupabaseService.pushAccountId() != recipient) return Result.success()
            val delivered = c.getSharedPreferences("group_push_delivered", Context.MODE_PRIVATE)
            if (delivered.contains(event)) return Result.success()
            QuranMessagingService.createChannel(c)
            val language = c.getSharedPreferences("settings", Context.MODE_PRIVATE).getString("app_language", "nl") ?: "nl"
            val intent = Intent(c, MainActivity::class.java)
                .setData(Uri.parse("qurantracker://notification/group/$event"))
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            val pending = PendingIntent.getActivity(c, event.hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            val notification = NotificationCompat.Builder(c, QuranMessagingService.CHANNEL)
                .setSmallIcon(R.drawable.ic_notification)
                .addExtras(android.os.Bundle().apply { putString("quran_group_code", target.groupCode) })
                .setContentTitle(notificationText(language, "replyTitle"))
                .setContentText(notificationText(language, "replyBody"))
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setAutoCancel(true)
                .setContentIntent(pending).build()
            NotificationManagerCompat.from(c).notify(event, 1, notification)
            delivered.edit().putLong(event, System.currentTimeMillis()).apply()
            return Result.success()
            }
        } catch (cancel: CancellationException) { throw cancel }
          catch (_: SecurityException) { return Result.success() }
          catch (_: Exception) {
              android.util.Log.w("GroupPush", "Group notification check will retry")
              return if (runAttemptCount < 5) Result.retry() else Result.failure()
          }
    }
}
