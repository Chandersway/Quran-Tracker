package com.Ameender.qurantracker.notifications

import android.content.Context
import androidx.core.app.NotificationManagerCompat
import androidx.work.*
import com.Ameender.qurantracker.data.AuthenticationState
import com.Ameender.qurantracker.data.SupabaseService
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.time.ZoneId
import java.util.UUID
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** Registration is retried on network recovery, session changes and token rotation. */
object GroupPushRegistration {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val lock = Mutex()
    private var context: Context? = null
    private var observing = false
    private fun prefs(c: Context) = c.getSharedPreferences("firebase_device", Context.MODE_PRIVATE)
    private fun installation(c: Context): String = prefs(c).getString("installation", null)
        ?: UUID.randomUUID().toString().also { prefs(c).edit().putString("installation", it).commit() }

    fun initialize(c: Context) {
        context = c.applicationContext
        if (!observing) {
            observing = true
            scope.launch {
                SupabaseService.authenticationState.collectLatest { auth ->
                    if (auth !is AuthenticationState.Checking) {
                        val user = (auth as? AuthenticationState.Authenticated)?.userId
                        if (prefs(c).getString("last_account", null) != user) cancelGroupNotifications(c)
                        prefs(c).edit().putString("last_account", user).apply()
                        if (auth is AuthenticationState.Authenticated) {
                            FirebaseMessaging.getInstance().token.addOnSuccessListener { tokenChanged(c, it) }
                        }
                        enqueue(c)
                    }
                }
            }
            WorkManager.getInstance(c).enqueueUniquePeriodicWork("group_push_registration_periodic", ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<GroupPushRegistrationWorker>(15, TimeUnit.MINUTES)
                    .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build())
        }
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token -> tokenChanged(c, token) }
        enqueue(c)
    }
    fun tokenChanged(c: Context, token: String) {
        prefs(c).edit().putString("token", token).apply()
        enqueue(c)
    }
    fun enqueue(c: Context) {
        WorkManager.getInstance(c).enqueueUniqueWork("group_push_registration", ExistingWorkPolicy.REPLACE,
            OneTimeWorkRequestBuilder<GroupPushRegistrationWorker>()
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build())
    }
    suspend fun register(c: Context) = lock.withLock {
        val user = SupabaseService.pushAccountId() ?: return@withLock
        // Never register a custom cached token restored from another phone's backup.
        val token = withTimeout(45000) {
            suspendCancellableCoroutine<String> { continuation ->
                FirebaseMessaging.getInstance().token
                    .addOnSuccessListener { if (continuation.isActive) continuation.resume(it) }
                    .addOnFailureListener { if (continuation.isActive) continuation.resumeWithException(it) }
            }
        }
        prefs(c).edit().putString("token", token).apply()
        val local = NotificationPreferencesRepository(c).load()
        val language = c.getSharedPreferences("settings", Context.MODE_PRIVATE).getString("app_language", "nl") ?: "nl"
        SupabaseService.registerPushDevice(installation(c), token,
            NotificationManagerCompat.from(c).areNotificationsEnabled(), ZoneId.systemDefault().id,
            local.quiet.enabled, local.quiet.startMinute, local.quiet.endMinute, language)
        // Session could have changed while the request was in flight.
        if (SupabaseService.pushAccountId() == user) prefs(c).edit().putString("registered_user", user).apply()
    }
    suspend fun beforeSignOut() = lock.withLock {
        val c = context ?: return@withLock
        prefs(c).edit().remove("registered_user").apply()
        cancelGroupNotifications(c)
        withTimeoutOrNull(5000) { runCatching { SupabaseService.unregisterPushDevice(installation(c)) } }
        // A fresh token on the next login prevents old-account delivery after offline sign-out.
        prefs(c).edit().remove("token").apply()
        FirebaseMessaging.getInstance().deleteToken()
    }

    private fun cancelGroupNotifications(c: Context) {
        val manager = c.getSystemService(android.app.NotificationManager::class.java)
        manager.activeNotifications.filter { it.notification.channelId == QuranMessagingService.CHANNEL }
            .forEach { manager.cancel(it.tag, it.id) }
    }
}

class GroupPushRegistrationWorker(c: Context, params: WorkerParameters) : CoroutineWorker(c, params) {
    override suspend fun doWork(): Result = try {
        GroupPushRegistration.register(applicationContext)
        Result.success()
    } catch (cancel: CancellationException) { throw cancel }
      catch (_: Exception) {
          android.util.Log.w("GroupPush", "Device registration will retry")
          Result.retry()
      }
}
