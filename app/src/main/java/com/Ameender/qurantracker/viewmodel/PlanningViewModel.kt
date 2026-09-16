package com.Ameender.qurantracker.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.Ameender.qurantracker.data.DailyGoal
import com.Ameender.qurantracker.data.PlanningDataSource
import com.Ameender.qurantracker.data.PlanningItem
import com.Ameender.qurantracker.domain.PlanningTypeIcon
import com.Ameender.qurantracker.domain.QuranProgressType
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class PlanningViewModel(
    private val repository: PlanningDataSource
) : ViewModel() {
    val allItems = repository.allItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val datesWithItems = repository.datesWithItems
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val dailyGoal = repository.dailyGoal
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DailyGoal())

    val todayDoneCount = repository.todayDoneCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun getItemsForDate(date: String): Flow<List<PlanningItem>> =
        repository.getItemsForDate(date)

    fun addItem(
        date: String,
        type: String,
        referenceId: Int,
        subId: Int = 0,
        displayName: String,
        arabicText: String = ""
    ) {
        viewModelScope.launch {
            repository.addItem(date, type, referenceId, subId, displayName, arabicText)
        }
    }

    fun addKhatmaPlan(startDate: String, days: Int) {
        viewModelScope.launch {
            repository.addKhatmaPlan(startDate, days)
        }
    }

    fun toggleDone(item: PlanningItem) {
        viewModelScope.launch {
            repository.toggleDone(item)
        }
    }

    fun deleteItem(id: Int) {
        viewModelScope.launch {
            repository.deleteItem(id)
        }
    }

    fun setReminder(item: PlanningItem, hour: Int?, minute: Int?) {
        viewModelScope.launch {
            repository.setReminder(item, hour, minute)
        }
    }

    fun saveGoal(unit: String, target: Int, hour: Int, minute: Int) {
        viewModelScope.launch {
            repository.saveGoal(unit, target, hour, minute)
        }
    }

    fun unitLabel(unit: String) = when (unit) {
        QuranProgressType.RUB -> "rub"
        QuranProgressType.HIZB -> "hizb"
        QuranProgressType.JUZ -> "juz"
        "pages" -> "pagina's"
        "ayahs" -> "ayahs"
        else -> ""
    }

    fun typeIcon(type: String) = when (type) {
        QuranProgressType.RUB, QuranProgressType.HIZB -> PlanningTypeIcon.RUB_OR_HIZB
        QuranProgressType.JUZ -> PlanningTypeIcon.JUZ
        QuranProgressType.SURAH -> PlanningTypeIcon.SURAH
        else -> PlanningTypeIcon.DEFAULT
    }
}
