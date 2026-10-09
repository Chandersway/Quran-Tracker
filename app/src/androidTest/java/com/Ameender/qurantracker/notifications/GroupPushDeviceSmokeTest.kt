package com.Ameender.qurantracker.notifications

import androidx.test.platform.app.InstrumentationRegistry
import com.google.android.gms.tasks.Tasks
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.runBlocking
import org.junit.Assume.assumeTrue
import org.junit.Test
import java.util.concurrent.TimeUnit

/** Explicit opt-in diagnostic; never rotates a real device token in the normal suite. */
class GroupPushDeviceSmokeTest {
    @Test fun refreshDeviceToken() {
        assumeTrue(InstrumentationRegistry.getArguments().getString("refreshPushToken") == "true")
        Tasks.await(FirebaseMessaging.getInstance().deleteToken(), 45, TimeUnit.SECONDS)
        Tasks.await(FirebaseMessaging.getInstance().token, 45, TimeUnit.SECONDS)
        runBlocking { GroupPushRegistration.register(InstrumentationRegistry.getInstrumentation().targetContext) }
    }
}
