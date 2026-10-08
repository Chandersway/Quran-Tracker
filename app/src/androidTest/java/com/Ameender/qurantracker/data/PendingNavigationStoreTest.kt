package com.Ameender.qurantracker.data

import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.net.Uri
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import java.util.UUID

class PendingNavigationStoreTest {
    private fun isolated(block: (Context) -> Unit) {
        val base = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "pending_test_${UUID.randomUUID()}"
        val context = object : ContextWrapper(base) {
            override fun getSharedPreferences(key: String, mode: Int) = base.getSharedPreferences(name, mode)
        }
        try { block(context) } finally { base.deleteSharedPreferences(name) }
    }
    private fun link(url: String) = Intent(Intent.ACTION_VIEW, Uri.parse(url))

    @Test fun invitationSurvivesAuthLauncherAndRecreationUntilConsumed() = isolated { context ->
        val store = PendingNavigationStore(context)
        val token = "a".repeat(64)
        store.receive(link("https://qurantracker.app/group/abc-1234?invite=$token"))
        store.receive(link("qurantracker://auth?code=example"))
        store.receive(Intent(Intent.ACTION_MAIN))
        val restored = PendingNavigationStore(context)
        assertEquals("ABC-1234", restored.groupCode)
        assertEquals(token, restored.groupToken)
        restored.consumeGroup("ABC-1234", token)
        assertNull(PendingNavigationStore(context).groupCode)
        assertNull(PendingNavigationStore(context).groupToken)
    }

    @Test fun onlyRecognizedLinksAreDeliveredAndNotificationIsIndependent() = isolated { context ->
        val store = PendingNavigationStore(context)
        store.receive(link("https://evil.example/group/ABC123?invite=${"a".repeat(64)}"))
        store.receive(link("qurantracker:opaque"))
        assertNull(store.groupToken)
        assertNull(store.groupCode)
        store.receive(link("qurantracker://group/abc-1234"))
        store.receive(link("qurantracker://notification/agenda/42"))
        store.receive(link("qurantracker://notification/unknown"))
        assertEquals("ABC-1234", store.groupCode)
        assertEquals("agenda?itemId=42", store.notification)
        store.consumeNotification(store.notification)
        assertNull(store.notification)
        assertEquals("ABC-1234", store.groupCode)
    }

    @Test fun staleCompletionDoesNotDiscardNewerLink() = isolated { context ->
        val store = PendingNavigationStore(context)
        store.receive("FIRST", null, "daily_goal")
        store.receive("SECOND", "b".repeat(64), "agenda")
        store.consumeGroup("FIRST", null)
        store.consumeNotification("daily_goal")
        assertEquals("SECOND", store.groupCode)
        assertEquals("agenda", store.notification)
    }

    @Test fun malformedLinksCannotReplacePendingInvitation() = isolated { context ->
        val store = PendingNavigationStore(context)
        store.receive(link("qurantracker://group/ABC-1234"))
        listOf("https://qurantracker.app/group/nope", "qurantracker://group/ABC-9999/extra",
            "https://user@qurantracker.app/group/ABC-9999", "https://qurantracker.app:8080/group/ABC-9999",
            "https://qurantracker.app.evil/group/ABC-9999", "qurantracker://group/ABC-9999?invite=short",
            "qurantracker://group/ABC-9999?invite=${"a".repeat(64)}&invite=${"b".repeat(64)}")
            .forEach { store.receive(link(it)) }
        assertEquals("ABC-1234", store.groupCode)
    }
}
