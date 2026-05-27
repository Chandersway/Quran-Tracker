package com.Ameender.qurantracker.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "quran_progress")
data class QuranProgress(
    @PrimaryKey
    val id: String,
    val referenceId: Int = 0, // Nieuw: numeriek ID voor Juzz/Surah
    val subId: Int = 0,       // Nieuw: voor Rub of Ayah
    val type: String, // "juz", "hizb", "rub", "surah"
    val isRead: Boolean = false,
    val isMemorized: Boolean = false,
    val progress: Int = 0,
    val hasHifzScore: Boolean = false,
    val isCompleted: Boolean = false,
    val readCount: Int = 0,        // ← nieuw: hoe vaak geleze
    val lastUpdated: Long = System.currentTimeMillis()
)
