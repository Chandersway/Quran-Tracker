package com.Ameender.qurantracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.data.QuranProgressDataSource
import com.Ameender.qurantracker.domain.QuranProgressType
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class QuranViewModel(
    private val repository: QuranProgressDataSource
) : ViewModel() {

    val allProgress = repository.allProgress
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val juzzProgress = repository.juzzProgress
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val hizbProgress = repository.hizbProgress
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val rubProgress = repository.rubProgress
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val surahProgress = repository.surahProgress
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val recentHistory = repository.recentHistory
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allHistory = repository.allHistory
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val mostReadSurahs = repository.mostReadSurahs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val mostReadHizb = repository.mostReadHizb
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalReadCount = repository.totalReadCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val dayActivity = repository.dayActivitySince(
        since = System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000
    ).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTypeCounts = repository.allTypeCounts
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun confirmToggleJuz(juzNumber: Int, currentValue: Boolean) {
        viewModelScope.launch {
            repository.markJuzRead(juzNumber)
        }
    }

    fun confirmToggleJuz(juzNumber: Int) = confirmToggleJuz(juzNumber, false)

    fun removeJuz(juzNumber: Int) {
        viewModelScope.launch {
            repository.removeJuz(juzNumber)
        }
    }

    fun confirmToggleRub(hizbNumber: Int, rubNumber: Int, currentValue: Boolean) {
        viewModelScope.launch {
            repository.markRubRead(hizbNumber, rubNumber)
        }
    }

    fun removeRub(hizbNumber: Int, rubNumber: Int) {
        viewModelScope.launch {
            repository.removeRub(hizbNumber, rubNumber)
        }
    }

    fun confirmToggleSurah(surahId: Int, surahName: String, field: String, currentValue: Boolean) {
        viewModelScope.launch {
            repository.markSurah(surahId, surahName, field)
        }
    }

    fun removeSurah(surahId: Int, surahName: String, field: String) {
        viewModelScope.launch {
            repository.removeSurah(surahId, field)
        }
    }

    fun updateSurahHifzScore(surahId: Int, score: Int) {
        viewModelScope.launch {
            repository.updateHifzScore(QuranProgressType.SURAH, surahId, score)
        }
    }

    fun updateJuzHifzScore(juzNumber: Int, score: Int) {
        viewModelScope.launch {
            repository.updateHifzScore(QuranProgressType.JUZ, juzNumber, score)
        }
    }

    fun updateJuzAndHizbHifzScores(juzNumber: Int, score: Int) {
        viewModelScope.launch {
            repository.updateHifzScore(QuranProgressType.JUZ, juzNumber, score)
            repository.updateHifzScore(QuranProgressType.HIZB, juzNumber * 2 - 1, score)
            repository.updateHifzScore(QuranProgressType.HIZB, juzNumber * 2, score)
        }
    }

    fun updateHizbHifzScore(hizbNumber: Int, score: Int) {
        viewModelScope.launch {
            repository.updateHifzScore(QuranProgressType.HIZB, hizbNumber, score)
        }
    }

    fun updateHifzScoreRange(type: String, from: Int, to: Int, score: Int) {
        viewModelScope.launch {
            repository.updateHifzScoreRange(type, from, to, score)
        }
    }

    fun resetHistory() {
        viewModelScope.launch {
            repository.resetHistory()
        }
    }
}
