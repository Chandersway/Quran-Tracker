package com.Ameender.qurantracker.data

import android.content.Context
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class ReadingChecklistStoreTest {
    @Test fun persistsChecksUndoAndSeparatePositionAcrossInstances() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "checklist_test_${java.util.UUID.randomUUID()}"
        try {
            val target = QuranNoteTarget(NoteScope.RUB, 8)
            val store = ReadingChecklistStore(context, name)
            store.update { it.check(target, true).stopAt(target) }
            val reopened = ReadingChecklistStore(context, name)
            assertTrue(reopened.load().completed(target))
            assertEquals(QuranStructure.start(QuranNoteTarget(NoteScope.JUZ, 2)), reopened.load().next)
            reopened.update { it.check(target, false) }
            val again = ReadingChecklistStore(context, name).load()
            assertFalse(again.completed(target))
            assertEquals(target, again.position)
            reopened.update { it.check(target, true).clearPosition() }
            val clearedPosition = ReadingChecklistStore(context, name).load()
            assertNull(clearedPosition.position)
            assertTrue(clearedPosition.completed(target))
            reopened.update { it.stopAt(target).clearChecklist() }
            val clearedChecks = ReadingChecklistStore(context, name).load()
            assertEquals(target, clearedChecks.position)
            assertTrue(clearedChecks.readVerses.isEmpty())
        } finally { context.getSharedPreferences(name, Context.MODE_PRIVATE).edit().clear().commit() }
    }
}
