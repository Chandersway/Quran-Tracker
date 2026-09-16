package com.Ameender.qurantracker.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test

class AyahNotePersistenceTest {
    private class MemoryDao : AyahNoteDao {
        val notes = mutableListOf<AyahNote>()
        var failWrites = false
        override fun getAll(): Flow<List<AyahNote>> = flowOf(notes.toList())
        override fun getNote(surahId: Int, ayahNumber: Int): Flow<AyahNote?> =
            flowOf(notes.firstOrNull { it.surahId == surahId && it.ayahNumber == ayahNumber })
        override suspend fun insert(note: AyahNote) {
            check(!failWrites) { "Storage unavailable" }
            notes.add(note.copy(id = (notes.maxOfOrNull { it.id } ?: 0) + 1))
        }
        override suspend fun update(note: AyahNote) {
            check(!failWrites) { "Storage unavailable" }
            val index = notes.indexOfFirst { it.id == note.id }
            check(index >= 0)
            notes[index] = note
        }
        override suspend fun deleteForAyah(surahId: Int, ayahNumber: Int) {
            notes.removeAll { it.surahId == surahId && it.ayahNumber == ayahNumber }
        }
        override suspend fun delete(note: AyahNote) { notes.removeAll { it.id == note.id } }
    }

    @Test fun editingExistingNoteDoesNotCreateDuplicateAndPreservesMetadata() = runBlocking {
        val dao = MemoryDao()
        val repository = AyahNoteRepository(dao)
        repository.persistNote(AyahNote(surahId = 1, surahName = "Al-Fatihah", ayahNumber = 1, note = "Original"))
        val original = dao.notes.single()
        val edited = original.copy(note = "Revised reflection", folder = "Study", tags = "Tafsir",
            isPinned = true, formatSpans = "0,7,16,0,1,0,0,0,gold")
        repository.persistNote(edited)
        assertEquals(1, dao.notes.size)
        assertEquals(edited, dao.notes.single())
    }

    @Test fun separateNotesCanReferenceSameAyah() = runBlocking {
        val dao = MemoryDao()
        val repository = AyahNoteRepository(dao)
        val note = AyahNote(surahId = 1, surahName = "Al-Fatihah", ayahNumber = 1, note = "First")
        repository.persistNote(note)
        repository.persistNote(note.copy(note = "Second"))
        assertEquals(2, dao.notes.size)
        assertNotEquals(dao.notes[0].id, dao.notes[1].id)
    }

    @Test fun failedSavePropagatesAndLeavesOriginalIntact() = runBlocking {
        val dao = MemoryDao()
        val repository = AyahNoteRepository(dao)
        repository.persistNote(AyahNote(surahId = 1, surahName = "Al-Fatihah", ayahNumber = 1, note = "Original"))
        val original = dao.notes.single()
        dao.failWrites = true
        val result = runCatching { repository.persistNote(original.copy(note = "Changed")) }
        assertTrue(result.isFailure)
        assertEquals(original, dao.notes.single())
    }

    @Test fun blankNotesAreRejected() = runBlocking {
        val dao = MemoryDao()
        val result = runCatching {
            AyahNoteRepository(dao).persistNote(AyahNote(surahId = 1, surahName = "Al-Fatihah", ayahNumber = 1, note = "  "))
        }
        assertTrue(result.exceptionOrNull() is IllegalArgumentException)
        assertTrue(dao.notes.isEmpty())
    }
}
