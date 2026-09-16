package com.Ameender.qurantracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.data.AyahNote
import com.Ameender.qurantracker.data.AyahNoteDataSource
import com.Ameender.qurantracker.data.persistNote
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AyahNoteViewModel(
    private val repository: AyahNoteDataSource
) : ViewModel() {
    val allNotes = repository.allNotes
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Await the actual write so the editor only closes after persistence succeeds.
    suspend fun persistNote(note: AyahNote) = repository.persistNote(note)

    suspend fun removeNote(note: AyahNote) = repository.deleteNote(note)

    fun saveNote(
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
        viewModelScope.launch {
            repository.saveNote(
                surahId,
                surahName,
                ayahNumber,
                title,
                note,
                folder,
                tags,
                fontSize,
                headingLevel,
                isBold,
                isItalic,
                isUnderline,
                isStrike,
                listMode,
                textColorKey,
                formatSpans
            )
        }
    }

    fun deleteNote(note: AyahNote) {
        viewModelScope.launch {
            repository.deleteNote(note)
        }
    }

    fun updateNote(note: AyahNote) {
        viewModelScope.launch {
            repository.updateNote(note)
        }
    }
}
