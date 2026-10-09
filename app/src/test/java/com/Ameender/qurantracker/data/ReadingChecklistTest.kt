package com.Ameender.qurantracker.data

import org.junit.Assert.*
import org.junit.Test

class ReadingChecklistTest {
    @Test fun clearingPositionAndChecklistAreIndependent() {
        val target = QuranNoteTarget(NoteScope.HIZB, 3)
        val original = ReadingChecklistState().check(target, true).stopAt(target)
        assertEquals(original.readVerses, original.clearPosition().readVerses)
        assertNull(original.clearPosition().position)
        assertEquals(original.position, original.clearChecklist().position)
        assertTrue(original.clearChecklist().readVerses.isEmpty())
        assertEquals(ReadingChecklistState(), original.clearChecklist().clearPosition())
    }
    private fun rub(n: Int) = QuranNoteTarget(NoteScope.RUB, n)
    @Test fun everyPartitionCoversTheSameQuranWithoutGaps() {
        listOf(NoteScope.RUB, NoteScope.HIZB, NoteScope.JUZ, NoteScope.SURAH).forEach { scope ->
            val indices = (1..ReadingChecklistMapping.maximum(scope)).flatMap { ReadingChecklistMapping.range(QuranNoteTarget(scope, it)).toList() }
            assertEquals((0 until 6236).toList(), indices)
        }
    }
    @Test fun markingLaterPartDoesNotMarkEarlierPartsOrMovePosition() {
        val state = ReadingChecklistState().stopAt(rub(12)).check(rub(30), true)
        assertFalse(state.completed(rub(29)))
        assertTrue(state.completed(rub(30)))
        assertEquals(rub(12), state.position)
        assertEquals(QuranStructure.start(rub(13)), state.next)
    }
    @Test fun wholeHizbAndUndoStayConsistentWithoutLosingResumePoint() {
        val hizb = QuranNoteTarget(NoteScope.HIZB, 2)
        val state = ReadingChecklistState().check(hizb, true).stopAt(hizb)
        (5..8).forEach { assertTrue(state.completed(rub(it))) }
        val undone = state.check(rub(7), false)
        assertFalse(undone.completed(hizb))
        assertTrue(undone.partial(hizb))
        assertEquals(state.position, undone.position)
        assertEquals(QuranStructure.start(QuranNoteTarget(NoteScope.JUZ, 2)), undone.next)
    }
    @Test fun savingPositionDoesNotCheckPreviousPartsAndHandlesEnd() {
        val state = ReadingChecklistState().stopAt(rub(240))
        assertTrue(state.readVerses.isEmpty())
        assertNull(state.next)
        assertEquals(QuranStart(1, 1), ReadingChecklistState().next)
        assertEquals(QuranStart(114, 6), ReadingChecklistMapping.point(6235))
    }
    @Test fun surahCompletionDoesNotRoundToWholeRub() {
        val state = ReadingChecklistState().check(QuranNoteTarget(NoteScope.SURAH, 1), true)
        assertTrue(state.partial(rub(1)))
        assertFalse(state.completed(rub(1)))
        assertEquals(QuranStart(2, 1), state.stopAt(QuranNoteTarget(NoteScope.SURAH, 1)).next)
    }
    @Test fun allHizbAndJuzBoundariesMatchExistingData() {
        (1..60).forEach { h ->
            assertEquals(QuranStructure.start(rub((h-1)*4+1)), QuranStructure.start(QuranNoteTarget(NoteScope.HIZB,h)))
            assertEquals(h, ReadingChecklistMapping.hizbAt(QuranStructure.start(QuranNoteTarget(NoteScope.HIZB,h))))
        }
        (1..30).forEach { j -> assertEquals(QuranStructure.start(rub((j-1)*8+1)), QuranStructure.start(QuranNoteTarget(NoteScope.JUZ,j))) }
    }
}
