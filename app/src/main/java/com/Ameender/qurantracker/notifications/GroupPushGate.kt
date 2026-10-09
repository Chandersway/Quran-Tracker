package com.Ameender.qurantracker.notifications

import android.app.NotificationManager
import android.content.Context
import com.Ameender.qurantracker.data.SupabaseService
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.sync.Mutex

/** Preference writes and the final permission-check/display form one ordered operation. */
internal object GroupPushGate {
    val mutex = Mutex()
    private var context: Context? = null
    fun initialize(context: Context) { this.context = context.applicationContext }

    suspend fun dismiss(groupCode: String? = null) {
        val manager = context?.getSystemService(NotificationManager::class.java) ?: return
        for (item in manager.activeNotifications) {
            if (item.notification.channelId != QuranMessagingService.CHANNEL) continue
            val tag = item.tag ?: continue
            if (!validPushUuid(tag)) continue // Never remove local reminders or console tests.
            val code = item.notification.extras.getString("quran_group_code") ?: try {
                SupabaseService.groupPushTarget(tag)?.groupCode
            } catch (cancel: CancellationException) { throw cancel }
              catch (_: Exception) { null }
            if (groupCode == null || code == groupCode) manager.cancel(tag, item.id)
        }
    }
}
