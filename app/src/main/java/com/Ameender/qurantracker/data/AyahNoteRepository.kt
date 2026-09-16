package com.Ameender.qurantracker.data

import kotlinx.coroutines.flow.Flow

interface AyahNoteDataSource {
    suspend fun insertNote(note: AyahNote)
    val allNotes: Flow<List<AyahNote>>
    fun getNote(surahId: Int, ayahNumber: Int): Flow<AyahNote?>
    suspend fun saveNote(
        surahId: Int,
        surahName: String,
        ayahNumber: Int,
        title: String,
        note: String,
        folder: String,
        tags: String,
        fontSize: Int,
        headingLevel: Int,
        isBold: Boolean,
        isItalic: Boolean,
        isUnderline: Boolean,
        isStrike: Boolean,
        listMode: String,
        textColorKey: String,
        formatSpans: String
    )
    suspend fun updateNote(note: AyahNote)
    suspend fun deleteNote(note: AyahNote)
    suspend fun deleteForAyah(surahId: Int, ayahNumber: Int)
}

/** Preserve a note's identity when saving edits; only a new note gets inserted. */
suspend fun AyahNoteDataSource.persistNote(note: AyahNote) {
    require(note.title.isNotBlank() || note.note.isNotBlank())
    note.validateTarget()
    if (note.id != 0L) {
        updateNote(note)
    } else {
        insertNote(note)
    }
}

class AyahNoteRepository(
    private val ayahNoteDao: AyahNoteDao
) : AyahNoteDataSource {
    override suspend fun insertNote(note: AyahNote) {
        note.validateTarget()
        require(note.id == 0L && (note.title.isNotBlank() || note.note.isNotBlank()))
        ayahNoteDao.insert(note)
    }
    override val allNotes: Flow<List<AyahNote>> = ayahNoteDao.getAll()

    override fun getNote(surahId: Int, ayahNumber: Int): Flow<AyahNote?> =
        ayahNoteDao.getNote(surahId, ayahNumber)

    override suspend fun saveNote(
        surahId: Int,
        surahName: String,
        ayahNumber: Int,
        title: String,
        note: String,
        folder: String,
        tags: String,
        fontSize: Int,
        headingLevel: Int,
        isBold: Boolean,
        isItalic: Boolean,
        isUnderline: Boolean,
        isStrike: Boolean,
        listMode: String,
        textColorKey: String,
        formatSpans: String
    ) {
        val cleanNote = note
        val cleanTitle = title.trim()
        if (cleanNote.isBlank() && cleanTitle.isBlank()) {
            return
        }
        insertNote(
            AyahNote(
                surahId = surahId,
                surahName = surahName,
                ayahNumber = ayahNumber,
                title = cleanTitle,
                note = cleanNote,
                folder = folder.trim(),
                tags = tags.trim(),
                fontSize = fontSize.coerceIn(12, 28),
                headingLevel = headingLevel.coerceIn(0, 3),
                isBold = isBold,
                isItalic = isItalic,
                isUnderline = isUnderline,
                isStrike = isStrike,
                listMode = listMode,
                textColorKey = textColorKey,
                formatSpans = formatSpans,
                updatedAt = System.currentTimeMillis()
            )
        )
    }

    override suspend fun updateNote(note: AyahNote) {
        note.validateTarget()
        require(note.id > 0L && (note.title.isNotBlank() || note.note.isNotBlank()))
        ayahNoteDao.update(note)
    }

    override suspend fun deleteNote(note: AyahNote) {
        ayahNoteDao.delete(note)
    }

    override suspend fun deleteForAyah(surahId: Int, ayahNumber: Int) {
        ayahNoteDao.deleteForAyah(surahId, ayahNumber)
    }
}
