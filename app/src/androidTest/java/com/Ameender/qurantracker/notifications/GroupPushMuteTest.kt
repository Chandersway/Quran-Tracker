package com.Ameender.qurantracker.notifications

import android.app.NotificationManager
import android.os.Bundle
import androidx.core.app.NotificationCompat
import androidx.test.platform.app.InstrumentationRegistry
import com.Ameender.qurantracker.R
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.sync.withLock
import org.junit.Assert.*
import org.junit.Test

class GroupPushMuteTest {
    @Test fun muteRemovesOnlyTheSelectedGroupsNotifications() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val manager = context.getSystemService(NotificationManager::class.java)
        assertTrue("Enable notification permission on the test emulator", manager.areNotificationsEnabled())
        GroupPushGate.initialize(context)
        QuranMessagingService.createChannel(context)
        val first = "11111111-1111-1111-1111-111111111111"
        val second = "22222222-2222-2222-2222-222222222222"
        fun show(tag: String, code: String) {
            manager.notify(tag, 99, NotificationCompat.Builder(context, QuranMessagingService.CHANNEL)
                .setSmallIcon(R.drawable.ic_notification).setContentTitle("Mute regression test")
                .addExtras(Bundle().apply { putString("quran_group_code", code) }).build())
        }
        try {
            show(first, "test-first"); show(second, "test-second")
            withTimeout(3000) { while (manager.activeNotifications.count { it.tag == first || it.tag == second } != 2) delay(20) }
            GroupPushGate.mutex.withLock { GroupPushGate.dismiss("test-first") }
            withTimeout(3000) { while (manager.activeNotifications.any { it.tag == first }) delay(20) }
            assertFalse(manager.activeNotifications.any { it.tag == first })
            assertTrue(manager.activeNotifications.any { it.tag == second })
            GroupPushGate.mutex.withLock { GroupPushGate.dismiss("test-second") }
            withTimeout(3000) { while (manager.activeNotifications.any { it.tag == second }) delay(20) }
            assertFalse(manager.activeNotifications.any { it.tag == second })
        } finally { manager.cancel(first, 99); manager.cancel(second, 99) }
    }
}
