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

/** FCM client setup. Account-scoped group delivery is not enabled until the server is connected. */
class QuranMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) = storeToken(this, token)

    override fun onMessageReceived(message: RemoteMessage) {
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
        private fun storeToken(context: Context, token: String) {
            // Never log device tokens. Server registration will be added with account lifecycle handling.
            context.getSharedPreferences("firebase_device", Context.MODE_PRIVATE).edit()
                .putString("token", token).apply()
        }
        fun initialize(context: Context) {
            createChannel(context)
            FirebaseMessaging.getInstance().token.addOnSuccessListener { storeToken(context.applicationContext, it) }
        }
        private fun createChannel(context: Context) {
            val language = context.getSharedPreferences("settings", Context.MODE_PRIVATE).getString("app_language", "nl") ?: "nl"
            val channel = NotificationChannel(CHANNEL, notificationText(language, "title"), NotificationManager.IMPORTANCE_DEFAULT)
            channel.lockscreenVisibility = NotificationCompat.VISIBILITY_PRIVATE
            context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}
